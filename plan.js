'use strict';
/* =====================================================================
   plan.js — El plan de 30 semanas, copiado de 02_ruta_aprendizaje_B1_v3.md
   Secciones usadas: 4 (calendario), 5 (reparto), 6 (rutina), 9 (criterios).
   Si el plan cambia, se edita SOLO este archivo.
   ===================================================================== */

const PLAN = {
  inicioS0: '2026-09-22',
  inicioS1: '2026-10-05',      // lunes
  semanas: 30,
  objetivoMin: 600,            // 10 h
  minimoMin: 540,              // 9 h
  reparto: { L: 35, S: 20, V: 20, R: 10, W: 10, C: 5 }, // % (sección 5)
};

const DESTREZAS = {
  L: 'Listening',
  S: 'Speaking',
  V: 'Vocab y gramática',
  R: 'Reading',
  W: 'Writing',
  C: 'Colchón',
  X: 'Simulacro',
  D: 'Diagnóstico',
};

const FASES = {
  F0: 'Fase 0, diagnóstico',
  F1: 'Fase 1, cimientos',
  F2: 'Fase 2, salto a B1',
  F3: 'Fase 3, recta final',
  DESC: 'Semana de descarga',
};

/* tipo: 'normal' (por defecto) | 'descarga' | 'ligera'
   esc: bloque de escritura del sábado (S1-S21). texto:true = writing de textos
   sim: nombre del simulacro del sábado (S22-S28)
   diag: número de mini-diagnóstico (domingo) */
const SEMANAS = [
  { n: 1,  fase: 'F0', gram: 'Present simple y continuous (formas)', mur: [{ u: '1', t: 'Present continuous (I am doing)' }, { u: '2', t: 'Present simple (I do)' }], esc: { cod: '', tema: 'Listening extra: el test ya está hecho' }, hito: 'Reinicio de Anki y Murphy U1' },
  { n: 2,  fase: 'F0', gram: 'Present simple vs continuous; verbos de estado', mur: [{ u: '3', t: 'Present continuous and present simple 1' }, { u: '4', t: 'Present continuous and present simple 2 · verbos de estado' }], esc: { cod: 'PW0', tema: 'Errores típicos de hispanohablantes' }, hito: 'Rutina cumplida 14 de 14 días' },
  { n: 3,  fase: 'F1', gram: 'Past simple (regulares e irregulares)', mur: [{ u: '5', t: 'Past simple (I did)' }, { u: '', t: 'Apéndice 1 · Regular and irregular verbs + fallos de U5' }], esc: { cod: 'PW1', tema: 'Orden de la oración y sujeto obligatorio' }, diag: 1 },
  { n: 4,  fase: 'F1', gram: 'Past simple: preguntas y negativas; used to', mur: [{ u: '49', t: 'Questions 1 · preguntas con did' }, { u: '18', t: 'Used to (do)' }], esc: { cod: 'PW2', tema: 'Puntuación, mayúsculas, contracciones' } },
  { n: 5,  fase: 'F1', gram: 'Present perfect (experiencias, ever/never)', mur: [{ u: '7', t: 'Present perfect 1 (I have done)' }, { u: '8', t: 'Present perfect 2 · ever / never' }], esc: { cod: 'PW3', tema: 'Conectores de adición y contraste' } },
  { n: 6,  fase: 'F1', gram: 'Present perfect vs past simple; for/since', mur: [{ u: '12', t: 'For and since, When…? and How long…?' }, { u: '13', t: 'Present perfect and past 1 (I have done and I did)' }], esc: { cod: 'PW4', tema: 'Conectores de secuencia y tiempo' }, diag: 2 },
  { n: 7,  fase: 'DESC', tipo: 'descarga', gram: 'Solo Anki y listening pasivo', hito: 'Descarga' },
  { n: 8,  fase: 'F1', gram: 'Condicionales 0 y 1 (if, when, unless)', mur: [{ u: '25', t: 'When I do / When I\'ve done · When and if' }, { u: '114', t: 'Unless, As long as, Provided (solo unless)' }], esc: { cod: 'PW5', tema: 'Causa, consecuencia, finalidad, ejemplo' } },
  { n: 9,  fase: 'F1', gram: 'Consolidación de la Fase 1', mur: [{ u: '14', t: 'Present perfect and past 2' }, { u: '', t: 'Repaso · ejercicios fallados de U1-U13' }], esc: { cod: 'PW6', tema: 'Párrafo y fórmulas de email' }, diag: 3, hito: 'Cierre de la Fase 1' },
  { n: 10, fase: 'F2', gram: 'Past continuous vs past simple', mur: [{ u: '6', t: 'Past continuous (I was doing)' }, { u: '', t: 'Repaso · fallos de U5 y U6' }], esc: { cod: 'W1', tema: 'Email informal de 60 a 80 palabras', texto: true }, hito: 'Arranca el writing' },
  { n: 11, fase: 'F2', gram: 'Futuro: will / going to', mur: [{ u: '20', t: '(I\'m) going to (do)' }, { u: '21', t: 'Will / shall 1' }], esc: { cod: 'W2', tema: 'Email informal sobre planes, 80 a 100', texto: true } },
  { n: 12, fase: 'F2', gram: 'Present continuous con valor de futuro', mur: [{ u: '19', t: 'Present tenses for the future' }, { u: '23', t: 'I will and I\'m going to' }], esc: { cod: 'W3', tema: 'Email informal completo, 100 a 120', texto: true }, diag: 4 },
  { n: 13, fase: 'DESC', tipo: 'descarga', gram: 'Descarga de Navidad', hito: 'Descarga' },
  { n: 14, fase: 'F2', gram: 'Voz pasiva (presente y pasado)', mur: [{ u: '42', t: 'Passive 1 (is done / was done)' }, { u: '', t: 'Repaso · fallos de U42' }], esc: { cod: 'W4', tema: 'Email semiformal: petición o queja', texto: true } },
  { n: 15, fase: 'F2', gram: 'Voz pasiva (otros tiempos)', mur: [{ u: '43', t: 'Passive 2 (be done / have been done / is being done)' }, { u: '44', t: 'Passive 3' }], esc: { cod: 'W5', tema: 'Texto narrativo con tiempos pasados', texto: true }, diag: 5 },
  { n: 16, fase: 'F2', gram: 'Reported speech (say / tell)', mur: [{ u: '47', t: 'Reported speech 1 (He said that…)' }, { u: '48', t: 'Reported speech 2' }], esc: { cod: 'W6', tema: 'Texto de opinión con razones', texto: true } },
  { n: 17, fase: 'F2', gram: 'Reported speech (preguntas y órdenes)', mur: [{ u: '50', t: 'Questions 2 (He asked me where…)' }, { u: '55', t: 'Verb + object + to… (tell / ask somebody to)' }], esc: { cod: 'W7', tema: 'Texto de 100 a 150 palabras en 30 min', texto: true }, hito: 'Comprar el libro de simulacros' },
  { n: 18, fase: 'F2', gram: 'Repaso integral de tiempos verbales', mur: [{ u: '', t: 'Repaso · fallos de presente y pasado (U1-U14)' }, { u: '', t: 'Repaso · fallos de futuro y pasiva (U19-U44)' }], esc: { cod: 'W8', tema: 'Reescritura de los 2 peores textos', texto: true }, diag: 6 },
  { n: 19, fase: 'DESC', tipo: 'descarga', gram: 'Solo Anki y listening pasivo', hito: 'Descarga' },
  { n: 20, fase: 'F2', gram: 'Repaso integral y speaking sostenido de 3-4 min', mur: [{ u: '', t: 'Repaso · fallos registrados de tiempos verbales' }, { u: '', t: 'Repaso · fallos de pasiva y reported speech' }], esc: { cod: '', tema: 'Tarea de examen cronometrada', texto: true }, hito: 'Primer simulacro por partes (R+L)' },
  { n: 21, fase: 'F2', gram: 'Repaso de errores dominantes', mur: [{ u: '', t: 'Repaso · errores dominantes del registro' }, { u: '', t: 'Repaso · errores dominantes del registro' }], esc: { cod: '', tema: 'Tarea de examen cronometrada', texto: true }, diag: 7, hito: 'Cierre de F2 y decisión de salida anticipada' },
  { n: 22, fase: 'F3', gram: 'Formato del examen LanguageCert B1', sim: 'Simulacro por partes, formato oficial', hito: 'Simulacro por partes' },
  { n: 23, fase: 'F3', gram: 'Timing bajo presión', sim: 'Simulacros por partes con reloj', hito: 'Puerta anticipada, solo si S21 la activó' },
  { n: 24, fase: 'F3', gram: 'Análisis del patrón de errores', sim: 'Simulacro completo', hito: 'Comprobación de criterios 1', comprob: true },
  { n: 25, fase: 'F3', gram: 'Refuerzo de la destreza más débil', sim: 'Simulacro completo' },
  { n: 26, fase: 'F3', gram: 'Puerta de examen', sim: 'Simulacro completo', hito: 'Comprobación 2 y decisión de examen', comprob: true, puerta: true },
  { n: 27, fase: 'F3', gram: 'Consolidación', sim: 'Simulacro completo', hito: 'Reserva del examen y decisión sobre Take²' },
  { n: 28, fase: 'F3', gram: 'Repaso de errores registrados', sim: 'Último simulacro completo', hito: 'Recomprobación si hizo falta', comprob: true },
  { n: 29, fase: 'F3', tipo: 'ligera', gram: 'Examen LanguageCert B1', hito: 'Semana ligera y examen', examen: true },
  { n: 30, fase: 'F3', tipo: 'ligera', gram: 'Margen de seguridad', hito: 'Examen si se aplaza una semana' },
];

/* Semana 0: 2 tardes de preparación (sección 14) */
const TAREAS_S0 = [
  { id: 't1a', tarde: 1, nombre: 'Reiniciar Anki en la tablet', sub: '15 nuevas, 150 repasos, sincronizar con Subir' },
  { id: 't1b', tarde: 1, nombre: 'Preparar los recursos de la sección 7', sub: 'Murphy with answers, favoritos, Language Reactor' },
  { id: 't1c', tarde: 1, nombre: 'Verificar LanguageCert', sub: 'Precio del escrito y del oral, Take², modelos' },
  { id: 't2a', tarde: 2, nombre: 'Importar el calendario en Outlook', sub: 'Calendario aparte Inglés B1, una sola vez' },
  { id: 't2b', tarde: 2, nombre: 'Revisión de S0 con Claude', sub: 'En el proyecto Inglés para Controlador' },
];

/* ---------- Fechas (siempre en hora local, a medianoche) ---------- */
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function diasEntre(a, b) { return Math.round((b - a) / 86400000); }
function diaIdx(d) { return (d.getDay() + 6) % 7; } // lunes = 0

/* -1 antes del plan · 0 = S0 · 1-30 · 31 = plan terminado */
function semanaDe(fecha) {
  const d = diasEntre(parseISO(PLAN.inicioS1), fecha);
  if (d < 0) return fecha >= parseISO(PLAN.inicioS0) ? 0 : -1;
  const n = Math.floor(d / 7) + 1;
  return n > PLAN.semanas ? 31 : n;
}
function inicioSemana(n) { return addDays(parseISO(PLAN.inicioS1), (n - 1) * 7); }
function getSem(n) { return SEMANAS[n - 1]; }

/* ---------- Rutina diaria (sección 6) ---------- */
function blq(id, sk, min, nombre, sub = '', tipo = null) { return { id, sk, min, nombre, sub, tipo }; }

function bloquesBase(fecha) {
  const n = semanaDe(fecha);
  if (n < 1 || n > PLAN.semanas) return [];
  const s = getSem(n);
  const d = diaIdx(fecha);
  const anki = blq('anki', 'V', 10, 'Anki', '15 nuevas, máximo 150 repasos', 'anki');

  // Descarga (S7, S13, S19) y semanas ligeras (S29, S30): ≈3 h
  if (s.tipo === 'descarga' || s.tipo === 'ligera') {
    const m = [15, 15, 15, 15, 15, 20, 15][d];
    const sub = s.tipo === 'ligera' ? 'Sin material nuevo' : 'Pasivo, sin protocolo';
    return [anki, blq('pasivo', 'L', m, 'Listening pasivo', sub)];
  }

  const f3 = n >= 22;
  const gNom = f3 ? 'Gramática' : 'Murphy';
  const murphyTipo = f3 ? null : 'murphy';
  // Bloque de Murphy con la unidad exacta de la semana (s.mur), si la tiene
  const mur = (id, i) => {
    const u = s.mur && !f3 ? s.mur[i] : null;
    const b = blq(id, 'V', 25, u ? (u.u ? `Murphy U${u.u}` : 'Murphy, repaso') : `${gNom}, unidad ${i ? 'B' : 'A'}`, u ? u.t : s.gram, murphyTipo);
    if (u && u.u) b.unidad = u.u;
    return b;
  };
  const lis = (min) => blq('lis', 'L', min, 'Listening', 'Protocolo de 4 pasos', 'listening');
  const ia = (sub = 'Hablar, no escribir') => blq('ia', 'S', 20, 'Speaking con IA', sub);

  switch (d) {
    case 0: return [anki,
      mur('murA', 0),
      blq('6me', 'L', 25, '6 Minute English', 'Protocolo de 4 pasos', 'listening'),
      lis(15)];
    case 1: return [anki,
      blq('bbc', 'L', 45, 'BBC Learning English', 'Protocolo de 4 pasos', 'listening'),
      ia()];
    case 2: return [anki,
      mur('murB', 1),
      ia(), lis(20)];
    case 3: return [anki,
      blq('read', 'R', 30, 'Reading', 'British Council LearnEnglish, nivel B1'),
      ia(), lis(15)];
    case 4: return [anki,
      blq('lr', 'L', 45, 'Episodio con Language Reactor', 'En el ordenador, con YouTube', 'listening'),
      ia('IA o Tandem/HelloTalk')];
    case 5: {
      if (f3) return [anki, blq('sim', 'X', 155, s.sim, 'Reloj, sin diccionario, sin pausas', 'simulacro')];
      let esc;
      if (n === 1) esc = blq('esc', 'L', 60, 'Listening extra', 'Protocolo de 4 pasos', 'listening');
      else if (s.esc.texto) esc = blq('esc', 'W', 60, s.esc.cod ? `Writing ${s.esc.cod}` : 'Writing', s.esc.tema, 'writing');
      else esc = blq('esc', 'W', 60, `Pre-writing ${s.esc.cod}`, s.esc.tema);
      return [anki, esc,
        blq('grab', 'S', 40, 'Speaking grabado', '2-3 min sin preparar y corrección', 'speaking'),
        blq('read', 'R', 30, 'Reading', 'British Council LearnEnglish, nivel B1'),
        blq('colchon', 'C', 10, 'Colchón', 'Repaso de fallos')];
    }
    case 6: {
      // Mini-diagnóstico: 30 min extra sobre el domingo normal (semana de 630 min)
      if (s.diag) return [anki,
        blq('largo', 'L', 45, 'Listening largo', 'Podcast de 6 Minute English', 'listening'),
        blq('colchon', 'C', 20, 'Colchón y repaso semanal', 'Copiar la fila del registro'),
        blq('diag', 'D', 30, `Mini-diagnóstico ${s.diag}`,
          'Tiempo extra. Episodio con %, 10 ejercicios de Murphy, 2 min grabados' + (n >= 12 ? ', texto breve' : ''), 'minidiag')];
      if (f3) return [anki,
        blq('largo', 'L', 45, 'Listening largo', 'Podcast de 6 Minute English', 'listening'),
        blq('corr', 'X', 20, 'Corrección en frío', 'Simulacro del sábado, por tipo de error')];
      return [anki,
        blq('largo', 'L', 45, 'Listening largo', 'Podcast de 6 Minute English', 'listening'),
        blq('colchon', 'C', 20, 'Colchón y repaso semanal', 'Copiar la fila del registro')];
    }
  }
  return [];
}

/* ---------- Ajustes puntuales de un día (recuperaciones) ----------
   Se añaden o cambian bloques solo en esa fecha. El resto del plan no cambia.
   cambia: { idBloque: { min, nombre, sub } } · extra: [bloques] · tras: id del bloque tras el que se insertan */
const AJUSTES_DIA = {
  // Cierre de S2: recuperación del Murphy de la semana del examen (decidido el 18 oct)
  '2026-10-18': {
    cambia: {
      anki: { min: 25, sub: 'Repasos atrasados y 15 nuevas. Las nuevas perdidas no se recuperan' },
      colchon: { sub: 'Tarjetas-frase de give up, cut down, bonds, likelihood… y copiar la fila del registro' },
    },
    tras: 'anki',
    extra: [
      { id: 'murRecA', sk: 'V', min: 25, nombre: 'Murphy U3', sub: 'Recuperación de S2. Present continuous and present simple 1', tipo: 'murphy', unidad: '3' },
      { id: 'murRecB', sk: 'V', min: 25, nombre: 'Murphy U4', sub: 'Recuperación de S2. Present continuous and present simple 2 · verbos de estado', tipo: 'murphy', unidad: '4' },
    ],
  },
  // Sábado de S3: PW0 recortado, pendiente de S2
  '2026-10-24': {
    tras: 'esc',
    extra: [
      { id: 'pw0rec', sk: 'W', min: 30, nombre: 'Pre-writing PW0', sub: 'Recuperación de S2. Errores típicos de hispanohablantes, 10 frases', tipo: null },
    ],
  },
};

function bloquesDe(fecha) {
  const base = bloquesBase(fecha);
  const a = AJUSTES_DIA[iso(fecha)];
  if (!a || !base.length) return base;
  const out = base.map((b) => (a.cambia && a.cambia[b.id] ? { ...b, ...a.cambia[b.id] } : b));
  if (a.extra) {
    const i = a.tras ? out.findIndex((b) => b.id === a.tras) : -1;
    out.splice(i >= 0 ? i + 1 : out.length, 0, ...a.extra.map((e) => ({ ...e })));
  }
  return out;
}
