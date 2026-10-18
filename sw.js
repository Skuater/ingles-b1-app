/* sw.js — Hace que la app funcione sin conexión.
   Al cambiar cualquier archivo de la app, sube el número de VERSION (y la versión que muestra app.js).
   Cada versión guarda TODOS sus archivos juntos: nunca se mezcla un archivo nuevo con uno antiguo.
   La versión nueva espera hasta que pulses «Actualizar» en el aviso de la app. */
const VERSION = 'b1-v10';
const FUENTES = 'b1-fuentes'; // la tipografía se guarda aparte y sobrevive a las actualizaciones
const APP = ['./', './index.html', './styles.css', './plan.js', './db.js', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(APP.map((u) => new Request(u, { cache: 'reload' })));
    // Paso único: las versiones hasta b1-v8 no tenían aviso de actualización, así que se activa sola
    const antiguas = (await caches.keys()).some((k) => /^b1-v[0-8]$/.test(k));
    if (antiguas) self.skipWaiting();
  })());
});
self.addEventListener('message', (e) => { if (e.data === 'activar') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('b1-') && k !== VERSION && k !== FUENTES).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const fuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (fuente) {
    e.respondWith(caches.open(FUENTES).then(async (c) => (await c.match(e.request))
      || fetch(e.request).then((r) => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  // Archivos de la app: siempre los de esta versión; la red solo si falta alguno
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const guardada = await c.match(e.request, { ignoreSearch: true });
    if (guardada) return guardada;
    try { return await fetch(e.request); }
    catch { return (e.request.mode === 'navigate' && await c.match('./index.html')) || Response.error(); }
  }));
});
