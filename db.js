'use strict';
/* db.js — Almacenamiento local en IndexedDB. Todo se guarda en el móvil. */
const DB = (() => {
  const NOMBRE = 'inglesB1';
  const STORES = {
    sesiones: 'key',     // bloques registrados: `${fecha}|${bloque}`
    mediciones: 'id',    // listening %, Murphy, speaking, writing, simulacros, Anki
    semaforos: 'semana', // mini-diagnósticos
    ajustes: 'k',        // tareas de S0, fecha simulada…
  };
  let db = null;

  function abrir() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(NOMBRE, 1);
      r.onupgradeneeded = () => {
        for (const [s, key] of Object.entries(STORES)) {
          if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: key });
        }
      };
      r.onsuccess = () => { db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  }
  function tx(store, modo, fn) {
    return new Promise((res, rej) => {
      const t = db.transaction(store, modo);
      const out = fn(t.objectStore(store));
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  /* Sustituye todos los almacenes en UNA sola transacción.
     Si cualquier registro falla, IndexedDB deshace todo y los datos anteriores siguen intactos. */
  function reemplazar(datos) {
    return new Promise((res, rej) => {
      const nombres = Object.keys(STORES);
      const t = db.transaction(nombres, 'readwrite');
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Importación cancelada'));
      try {
        for (const s of nombres) {
          const o = t.objectStore(s);
          o.clear();
          for (const x of datos[s] || []) o.put(x);
        }
      } catch (err) { t.abort(); rej(err); }
    });
  }
  return {
    STORES,
    reemplazar,
    abrir,
    todos: (s) => tx(s, 'readonly', (o) => o.getAll()),
    poner: (s, obj) => tx(s, 'readwrite', (o) => o.put(obj)),
    borrar: (s, key) => tx(s, 'readwrite', (o) => o.delete(key)),
    vaciar: (s) => tx(s, 'readwrite', (o) => o.clear()),
  };
})();
