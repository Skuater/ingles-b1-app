'use strict';
/* =====================================================================
   plan.js — El plan de 30 semanas, copiado de 02_ruta_aprendizaje_B1_v3.2.md
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
   mur: unidades de Murphy del lunes (A) y del miércoles (B). u = número de unidad (4.ª/5.ª ed.), t = título
   hab: paquete situacional de speaking de la semana (sección 6)
   esc: bloque de escritura del sábado. texto:true = writing de textos; tarea: formal | informal | examen
   muestra: modelo oficial de muestra en el sábado (sustituye al reading de ese día)
   sim: simulacro del sábado (S22-S28) · diag: número de mini-diagnóstico (domingo) */
const M = (u, t) => ({ u, t });
const SEMANAS = [
  { n: 1,  fase: 'F0', gram: 'Present simple y continuous (formas)', mur: [M('1', 'Present continuous (I am doing)'), M('2', 'Present simple (I do)')], hab: 'Mi rutina diaria y mi trabajo', esc: { cod: '', tema: 'Listening extra: el test ya está hecho' }, hito: 'Reinicio de Anki y Murphy U1' },
  { n: 2,  fase: 'F0', gram: 'Present simple vs continuous; verbos de estado', mur: [M('3', 'Present continuous and present simple 1'), M('4', 'Present continuous and present simple 2 · verbos de estado')], hab: 'Mi rutina diaria y mi trabajo', esc: { cod: 'PW0', tema: 'Errores típicos de hispanohablantes' }, hito: 'Rutina cumplida 14 de 14 días' },
  { n: 3,  fase: 'F1', gram: 'Past simple y past continuous', mur: [M('5', 'Past simple (I did) + Apéndice 1, verbos irregulares'), M('6', 'Past continuous (I was doing)')], hab: 'Un fin de semana o un viaje pasado', esc: { cod: 'PW1', tema: 'Orden de la oración y sujeto obligatorio' }, diag: 1 },
  { n: 4,  fase: 'F1', gram: 'Used to; preguntas en pasado', mur: [M('18', 'Used to (do)'), M('49', 'Questions 1 · preguntas con did / was')], hab: 'Cómo era mi vida antes y qué ha cambiado', esc: { cod: 'PW2', tema: 'Puntuación, mayúsculas, contracciones' } },
  { n: 5,  fase: 'F1', gram: 'Present perfect (experiencias, ever/never)', mur: [M('7', 'Present perfect 1 (I have done)'), M('8', 'Present perfect 2 · ever / never')], hab: 'Experiencias: lugares, comidas, cosas que nunca he hecho', esc: { cod: 'PW3', tema: 'Conectores de adición y contraste' } },
  { n: 6,  fase: 'F1', gram: 'Present perfect vs past simple; for/since', mur: [M('12', 'For and since, When…? and How long…?'), M('13', 'Present perfect and past 1 (I have done and I did)')], hab: 'Cuánto tiempo llevo haciendo algo', esc: { cod: 'PW4', tema: 'Conectores de secuencia y tiempo' }, diag: 2 },
  { n: 7,  fase: 'DESC', tipo: 'descarga', gram: 'Solo Anki y listening pasivo', hito: 'Descarga' },
  { n: 8,  fase: 'F1', gram: 'Condicionales 0, 1 y 2 (when, if)', mur: [M('25', 'When I do / When I\'ve done · When and if'), M('38', 'If I do… and If I did…')], hab: 'Qué hago o haría según las circunstancias', esc: { cod: 'PW5', tema: 'Causa, consecuencia, finalidad, ejemplo' } },
  { n: 9,  fase: 'F1', gram: 'Consolidación de la Fase 1', mur: [M('14', 'Present perfect and past 2'), M('', 'Repaso · ejercicios fallados de U1-U14')], hab: 'Presentación personal completa (parte 1 del examen)', esc: { cod: 'PW6', tema: 'Párrafo y fórmulas de email' }, muestra: 'Listening completo de un modelo oficial: 4 partes, 2 escuchas, 30 min', diag: 3, hito: 'Cierre de la Fase 1 y primer modelo de muestra' },
  { n: 10, fase: 'F2', gram: 'Past perfect y contraste de tiempos pasados', mur: [M('15', 'Past perfect (I had done)'), M('', 'Repaso · contraste de U5, U6 y U15')], hab: 'Una anécdota: qué pasó y qué había pasado antes', esc: { cod: 'W1', tema: 'Email informal a un amigo, 60-80 palabras', texto: true, tarea: 'informal' }, hito: 'Arranca el writing y las situaciones de rol' },
  { n: 11, fase: 'F2', gram: 'Futuro: going to / will', mur: [M('20', '(I\'m) going to (do)'), M('21', 'Will / shall 1')], hab: 'Planes para Navidad y para el año que viene', esc: { cod: 'W2', tema: 'Respuesta formal corta a un anuncio o aviso, 70-100', texto: true, tarea: 'formal' } },
  { n: 12, fase: 'F2', gram: 'Presente con valor de futuro; will vs going to', mur: [M('19', 'Present tenses (I am doing / I do) for the future'), M('23', 'I will and I\'m going to')], hab: 'Planes para Navidad y para el año que viene', esc: { cod: 'W3', tema: 'Carta informal con 2 funciones, 100-120', texto: true, tarea: 'informal' }, diag: 4 },
  { n: 13, fase: 'DESC', tipo: 'descarga', gram: 'Descarga de Navidad', hito: 'Descarga' },
  { n: 14, fase: 'F2', gram: 'Voz pasiva', mur: [M('42', 'Passive 1 (is done / was done)'), M('43', 'Passive 2 (be done / have been done / is being done)')], hab: 'Un problema con un producto o un servicio y cómo se resolvió', esc: { cod: 'W4', tema: 'Respuesta formal: petición o queja, 70-100', texto: true, tarea: 'formal' } },
  { n: 15, fase: 'F2', gram: 'Modales: capacidad y obligación', mur: [M('26', 'Can, could and (be) able to'), M('31', 'Have to and must')], hab: 'Normas y obligaciones en el trabajo y en casa', esc: { cod: 'W5', tema: 'Carta informal narrativa, 100-120', texto: true, tarea: 'informal' }, muestra: 'Reading partes 1 y 2 de un modelo oficial, con reloj', diag: 5, hito: 'Segundo modelo de muestra' },
  { n: 16, fase: 'F2', gram: 'Reported speech (say / tell)', mur: [M('47', 'Reported speech 1 (He said that…)'), M('48', 'Reported speech 2')], hab: 'Contar lo que otra persona dijo', esc: { cod: 'W6', tema: 'Respuesta formal con opinión y motivos, 70-100', texto: true, tarea: 'formal' } },
  { n: 17, fase: 'F2', gram: 'Preguntas indirectas; should', mur: [M('50', 'Questions 2 (Do you know where…? / He asked me where…)'), M('33', 'Should 1')], hab: 'Pedir información y dar consejos', esc: { cod: 'W7', tema: 'Las 2 tareas del examen en 45 min', texto: true, tarea: 'examen' }, hito: 'Comprar el libro de simulacros' },
  { n: 18, fase: 'F2', gram: 'Oraciones de relativo', mur: [M('92', 'Relative clauses 1 (who / that / which)'), M('94', 'Relative clauses 3 (whose / whom / where)')], hab: 'Describir personas, lugares y cosas', esc: { cod: 'W8', tema: 'Reescritura de los 2 peores textos', texto: true, tarea: '' }, diag: 6 },
  { n: 19, fase: 'DESC', tipo: 'descarga', gram: 'Solo Anki y listening pasivo', hito: 'Descarga' },
  { n: 20, fase: 'F2', gram: 'Verbo + -ing o verbo + to; speaking sostenido', mur: [M('53', 'Verb + -ing (enjoy doing / stop doing…)'), M('54', 'Verb + to… (decide to… / forget to…)')], hab: 'Gustos, hábitos y preferencias con motivos', esc: { cod: '', tema: 'Las 2 tareas del examen con reloj, 45 min', texto: true, tarea: 'examen' }, hito: 'Primer simulacro por partes (R+L)' },
  { n: 21, fase: 'F2', gram: 'Comparativos y superlativos', mur: [M('106', 'Comparison 1 (cheaper, more expensive…)'), M('109', 'Superlatives (the longest, the most enjoyable…)')], hab: 'Comparar opciones y elegir (parte 3 del examen)', esc: { cod: '', tema: 'Las 2 tareas del examen con reloj, 45 min', texto: true, tarea: 'examen' }, diag: 7, hito: 'Cierre de F2 y decisión de salida anticipada' },
  { n: 22, fase: 'F3', gram: 'Formato del examen; may / might y artículos', mur: [M('29', 'May and might 1'), M('72', 'A/an and the')], sim: 'Simulacro por partes, formato oficial', hito: 'Simulacro por partes' },
  { n: 23, fase: 'F3', gram: 'Timing bajo presión; unless y present perfect continuous', mur: [M('114', 'Unless, As long as, Provided'), M('9', 'Present perfect continuous (I have been doing)')], sim: 'Simulacros por partes con reloj', hito: 'Puerta anticipada, solo si S21 la activó' },
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
    const u = s.mur ? s.mur[i] : null;
    const b = blq(id, 'V', 25, u ? (u.u ? `Murphy U${u.u}` : 'Murphy, repaso') : `${gNom}, unidad ${i ? 'B' : 'A'}`, u ? u.t : s.gram, u ? 'murphy' : murphyTipo);
    if (u && u.u) b.unidad = u.u;
    return b;
  };
  const rol = n >= 10 && !f3 ? ' + 1 situación de rol' : '';
  const lis = (min) => blq('lis', 'L', min, 'Listening', 'Protocolo de 4 pasos', 'listening');
  const ia = (extra = '') => blq('ia', 'S', 20, 'Speaking con IA', `${s.hab ? s.hab + rol + '. ' : ''}Hablar, no escribir${extra}`);

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
      ia('. IA, Tandem/HelloTalk o la conversación con nativo')];
    case 5: {
      if (f3) return [anki, blq('sim', 'X', 155, s.sim, 'Reloj, sin diccionario, sin pausas', 'simulacro')];
      let esc;
      if (n === 1) esc = blq('esc', 'L', 60, 'Listening extra', 'Protocolo de 4 pasos', 'listening');
      else if (s.esc.texto) { esc = blq('esc', 'W', 60, s.esc.cod ? `Writing ${s.esc.cod}` : 'Writing', s.esc.tema, 'writing'); esc.tarea = s.esc.tarea || ''; }
      else esc = blq('esc', 'W', 60, `Pre-writing ${s.esc.cod}`, s.esc.tema);
      return [anki, esc,
        blq('grab', 'S', 40, 'Speaking grabado', n >= 10 ? `Parte 4: 30 s de preparación y 1,5 min${rol}. Corrección` : '2-3 min sin preparar y corrección', 'speaking'),
        s.muestra ? blq('muestra', 'X', 30, 'Modelo de muestra oficial', s.muestra + '. Diagnóstico, no cuenta para la puerta', 'muestra')
          : blq('read', 'R', 30, 'Reading', 'British Council LearnEnglish, nivel B1'),
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
