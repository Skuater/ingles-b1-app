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
  { n: 1,  fase: 'F0', gram: 'Present simple y continuous (formas)', esc: { cod: '', tema: 'Listening extra: el test ya está hecho' }, hito: 'Reinicio de Anki y Murphy U1' },
  { n: 2,  fase: 'F0', gram: 'Present simple vs continuous; verbos de estado', esc: { cod: 'PW0', tema: 'Errores típicos de hispanohablantes' }, hito: 'Rutina cumplida 14 de 14 días' },
  { n: 3,  fase: 'F1', gram: 'Past simple (regulares e irregulares)', esc: { cod: 'PW1', tema: 'Orden de la oración y sujeto obligatorio' }, diag: 1 },
  { n: 4,  fase: 'F1', gram: 'Past simple: preguntas y negativas; used to', esc: { cod: 'PW2', tema: 'Puntuación, mayúsculas, contracciones' } },
  { n: 5,  fase: 'F1', gram: 'Present perfect (experiencias, ever/never)', esc: { cod: 'PW3', tema: 'Conectores de adición y contraste' } },
  { n: 6,  fase: 'F1', gram: 'Present perfect vs past simple; for/since', esc: { cod: 'PW4', tema: 'Conectores de secuencia y tiempo' }, diag: 2 },
  { n: 7,  fase: 'DESC', tipo: 'descarga', gram: 'Solo Anki y listening pasivo', hito: 'Descarga' },
  { n: 8,  fase: 'F1', gram: 'Condicionales 0 y 1 (if, when, unless)', esc: { cod: 'PW5', tema: 'Causa, consecuencia, finalidad, ejemplo' } },
  { n: 9,  fase: 'F1', gram: 'Consolidación de la Fase 1', esc: { cod: 'PW6', tema: 'Párrafo y fórmulas de email' }, diag: 3, hito: 'Cierre de la Fase 1' },
  { n: 10, fase: 'F2', gram: 'Past continuous vs past simple', esc: { cod: 'W1', tema: 'Email informal de 60 a 80 palabras', texto: true }, hito: 'Arranca el writing' },
  { n: 11, fase: 'F2', gram: 'Futuro: will / going to', esc: { cod: 'W2', tema: 'Email informal sobre planes, 80 a 100', texto: true } },
  { n: 12, fase: 'F2', gram: 'Present continuous con valor de futuro', esc: { cod: 'W3', tema: 'Email informal completo, 100 a 120', texto: true }, diag: 4 },
  { n: 13, fase: 'DESC', tipo: 'descarga', gram: 'Descarga de Navidad', hito: 'Descarga' },
  { n: 14, fase: 'F2', gram: 'Voz pasiva (presente y pasado)', esc: { cod: 'W4', tema: 'Email semiformal: petición o queja', texto: true } },
  { n: 15, fase: 'F2', gram: 'Voz pasiva (otros tiempos)', esc: { cod: 'W5', tema: 'Texto narrativo con tiempos pasados', texto: true }, diag: 5 },
  { n: 16, fase: 'F2', gram: 'Reported speech (say / tell)', esc: { cod: 'W6', tema: 'Texto de opinión con razones', texto: true } },
  { n: 17, fase: 'F2', gram: 'Reported speech (preguntas y órdenes)', esc: { cod: 'W7', tema: 'Texto de 100 a 150 palabras en 30 min', texto: true }, hito: 'Comprar el libro de simulacros' },
  { n: 18, fase: 'F2', gram: 'Repaso integral de tiempos verbales', esc: { cod: 'W8', tema: 'Reescritura de los 2 peores textos', texto: true }, diag: 6 },
  { n: 19, fase: 'DESC', tipo: 'descarga', gram: 'Solo Anki y listening pasivo', hito: 'Descarga' },
  { n: 20, fase: 'F2', gram: 'Repaso integral y speaking sostenido de 3-4 min', esc: { cod: '', tema: 'Tarea de examen cronometrada', texto: true }, hito: 'Primer simulacro por partes (R+L)' },
  { n: 21, fase: 'F2', gram: 'Repaso de errores dominantes', esc: { cod: '', tema: 'Tarea de examen cronometrada', texto: true }, diag: 7, hito: 'Cierre de F2 y decisión de salida anticipada' },
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

function bloquesDe(fecha) {
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
  const lis = (min) => blq('lis', 'L', min, 'Listening', 'Protocolo de 4 pasos', 'listening');
  const ia = (sub = 'Hablar, no escribir') => blq('ia', 'S', 20, 'Speaking con IA', sub);

  switch (d) {
    case 0: return [anki,
      blq('murA', 'V', 25, `${gNom}, unidad A`, s.gram, murphyTipo),
      blq('6me', 'L', 25, '6 Minute English', 'Protocolo de 4 pasos', 'listening'),
      lis(15)];
    case 1: return [anki,
      blq('bbc', 'L', 45, 'BBC Learning English', 'Protocolo de 4 pasos', 'listening'),
      ia()];
    case 2: return [anki,
      blq('murB', 'V', 25, `${gNom}, unidad B`, s.gram, murphyTipo),
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
