'use strict';
/* app.js — Pantallas Hoy, Semana, Ruta, Criterios y Datos */

const S = {
  ses: new Map(), med: new Map(), sem: new Map(), aj: new Map(),
  vista: 'hoy', dia: null, semanaVista: null,
};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtH = (min) => (min / 60).toFixed(1).replace('.', ',');
const fmtLarga = (d) => cap(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(d));
const fmtCorta = (d) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(d).replace('.', '');
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CODIGO = { L: 'LI', S: 'SP', V: 'VG', R: 'RE', W: 'WR', C: 'CO', X: 'SI', D: 'DG' };

function hoyReal() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function hoy() { const f = S.aj.get('fechaSimulada'); return f ? parseISO(f) : hoyReal(); }
function semanaActual() { const n = semanaDe(hoy()); return Math.min(Math.max(n, 0), 30); }

/* ================= Datos ================= */
async function cargar() {
  await DB.abrir();
  const [ses, med, sem, aj] = await Promise.all(['sesiones', 'mediciones', 'semaforos', 'ajustes'].map(DB.todos));
  ses.forEach((x) => S.ses.set(x.key, x));
  med.forEach((x) => S.med.set(x.id, x));
  sem.forEach((x) => S.sem.set(x.semana, x));
  aj.forEach((x) => S.aj.set(x.k, x.v));
  if (!S.sem.has(0)) { // Punto de partida del registro: EF SET del 21 sep
    const ef = { semana: 0, L: 'rojo', R: 'verde', S: '', W: 'ambar', ajuste: 'Reparto L 35 %, R 10 %', origen: 'EF SET, 21 sep' };
    S.sem.set(0, ef); await DB.poner('semaforos', ef);
  }
}
async function setAjuste(k, v) {
  if (v === null || v === undefined || v === '') { S.aj.delete(k); await DB.borrar('ajustes', k); }
  else { S.aj.set(k, v); await DB.poner('ajustes', { k, v }); }
}
const clave = (f, b) => `${iso(f)}|${b.id}`;
const minHecho = (s) => (s && (s.estado === 'hecha' || s.estado === 'parcial') ? s.minReal : 0);

/* nota: undefined = conservar la que hubiera; '' = borrarla */
async function guardarSesion(f, b, estado, minReal, nota) {
  const key = clave(f, b);
  const previa = S.ses.get(key);
  if (estado === 'pendiente') { S.ses.delete(key); await DB.borrar('sesiones', key); return; }
  const s = { key, fecha: iso(f), semana: semanaDe(f), bloque: b.id, sk: b.sk, minPlan: b.min, minReal: estado === 'saltada' ? 0 : minReal, estado };
  const n = (nota === undefined ? (previa && previa.nota) || '' : nota).trim();
  if (n) s.nota = n;
  S.ses.set(key, s); await DB.poner('sesiones', s);
}
async function guardarMediciones(ref, fecha, lista) {
  for (const m of [...S.med.values()].filter((m) => m.ref === ref)) { S.med.delete(m.id); await DB.borrar('mediciones', m.id); }
  for (const m of lista) {
    const x = { ...m, id: `${ref}|${m.tipo}${m.sub ? '#' + m.sub : ''}`, ref, fecha: iso(fecha), semana: semanaDe(fecha) };
    S.med.set(x.id, x); await DB.poner('mediciones', x);
  }
}
const medsDe = (tipo) => [...S.med.values()].filter((m) => m.tipo === tipo).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));

/* ================= Cálculos ================= */
function resumen(n) {
  const ini = inicioSemana(n), t = hoy(), sem = getSem(n);
  const r = { n, sem, plan: 0, hecho: 0, planAFecha: 0, por: {}, dias: [], ankiDias: 0, speakingSes: 0, cerrada: t > addDays(ini, 6), empezada: t >= ini };
  for (const k in DESTREZAS) r.por[k] = { plan: 0, planHoy: 0, hecho: 0 };
  for (let i = 0; i < 7; i++) {
    const f = addDays(ini, i);
    let p = 0, h = 0, anki = false;
    const pasado = f <= t;
    for (const b of bloquesDe(f)) {
      const m = minHecho(S.ses.get(clave(f, b)));
      p += b.min; h += m;
      r.por[b.sk].plan += b.min; r.por[b.sk].hecho += m;
      if (pasado) r.por[b.sk].planHoy += b.min;
      if (b.tipo === 'anki' && m > 0) anki = true;
      if (b.sk === 'S' && m > 0) r.speakingSes++;
    }
    r.plan += p; r.hecho += h; if (f <= t) r.planAFecha += p; if (anki) r.ankiDias++;
    r.dias.push({ fecha: f, plan: p, hecho: h, anki, futuro: f > t });
  }
  return r;
}
const esNormal = (n) => n >= 1 && n <= 30 && !getSem(n).tipo;
const findeCaido = (r) => {
  const [sa, do_] = [r.dias[5], r.dias[6]];
  return !do_.futuro && sa.hecho < sa.plan * 0.5 && do_.hecho < do_.plan * 0.5;
};

function alertasSemana(n) {
  const out = [];
  if (n < 1 || n > 30) return out;
  const r = resumen(n);
  if (esNormal(n)) {
    if (r.cerrada && r.hecho < PLAN.minimoMin) out.push(['rojo', `Semana cerrada con ${fmtH(r.hecho)} h: por debajo del mínimo de 9 h.`]);
    if (r.cerrada && n > 1 && esNormal(n - 1)) {
      const p = resumen(n - 1);
      if (p.hecho < PLAN.minimoMin && r.hecho < PLAN.minimoMin) out.push(['rojo', 'Dos semanas seguidas por debajo de 9 h: toca semana de descarga (sección 12).']);
      if (findeCaido(p) && findeCaido(r)) out.push(['rojo', 'Dos fines de semana seguidos sin hacer: fija hora para el sábado y el domingo en el calendario.']);
    }
    if (findeCaido(r)) out.push(['ambar', 'Sábado y domingo sin hacer: la semana cuenta como incumplida.']);
    if (r.cerrada && r.ankiDias < 7) out.push(['ambar', `Anki: ${r.ankiDias} de 7 días. Anki va primero, siempre.`]);
    if (r.cerrada && r.por.S.hecho < r.por.S.plan) out.push(['ambar', `Speaking recortado: ${r.por.S.hecho} de ${r.por.S.plan} min. El speaking nunca se recorta.`]);
    if (r.hecho >= 240 && r.planAFecha > 0) {
      for (const k of ['L', 'S', 'V', 'R', 'W']) {
        const hizo = Math.round((r.por[k].hecho / r.hecho) * 100);
        const toca = Math.round((r.por[k].planHoy / r.planAFecha) * 100);
        if (Math.abs(hizo - toca) > 5) out.push(['ambar', `${DESTREZAS[k]}: ${hizo} % del tiempo frente al ${toca} % previsto a estas alturas de la semana.`]);
      }
    }
  }
  for (const m of medsDe('murphy').filter((m) => m.semana === n && m.valor < 70)) {
    out.push(['ambar', `Murphy U${m.extra.unidad || '?'} al ${m.valor} %: repetir la explicación y hacerla el sábado.`]);
  }
  if (n === 9 && r.cerrada) {
    const l = lisObjetivas().filter((m) => m.semana === 9);
    const dist = l.length ? Math.round(l.reduce((a, m) => a + (m.valor - UMBRAL_L[m.extra.metodo]), 0) / l.length) : null;
    if (dist !== null) out.push([dist >= -10 ? 'verde' : 'info', dist >= -10
      ? `Listening de S9 a ${Math.abs(dist)} puntos del umbral de la puerta: la salida anticipada es realista.`
      : `Listening de S9 a ${Math.abs(dist)} puntos del umbral de la puerta: por ahora, examen en S29.`]);
  }
  const sems = [...S.sem.values()].filter((x) => x.semana > 0 && x.semana <= n).sort((a, b) => a.semana - b.semana);
  if (sems.length >= 2 && sems.at(-1).S === 'rojo' && sems.at(-2).S === 'rojo') out.push(['rojo', 'Speaking en rojo en dos mini-diagnósticos seguidos: pasar de IA a Tandem/HelloTalk.']);
  return out;
}

function diasSinEstudio() {
  let c = 0, f = addDays(hoy(), -1);
  while (semanaDe(f) >= 1) {
    const p = bloquesDe(f).reduce((a, b) => a + b.min, 0);
    const h = bloquesDe(f).reduce((a, b) => a + minHecho(S.ses.get(clave(f, b))), 0);
    if (p > 0 && h === 0) { c++; f = addDays(f, -1); } else break;
  }
  return c;
}

/* Racha de días seguidos con Anki hecho, hacia atrás desde hoy.
   Hoy sin Anki todavía no rompe la racha. */
function rachaAnki() {
  let racha = 0, d = hoy();
  for (let i = 0; i < 400; i++) {
    const n = semanaDe(d);
    if (n < 1 || n > 30) break;
    const bl = bloquesDe(d).find((b) => b.tipo === 'anki');
    if (!bl) { d = addDays(d, -1); continue; }
    if (minHecho(S.ses.get(clave(d, bl))) > 0) { racha++; d = addDays(d, -1); continue; }
    if (i === 0) { d = addDays(d, -1); continue; }
    break;
  }
  return racha;
}
function tendenciaTxt(serie, invertida) {
  if (!serie || serie.length < 2) return '';
  const a = serie.at(-2), b = serie.at(-1);
  if (a === b) return 'estable';
  return (invertida ? b < a : b > a) ? 'mejorando' : 'bajando';
}

/* ---------- Medición objetiva del listening (plan v3.2) ----------
   Solo cuentan para la puerta los episodios de 6 Minute English (o del mini-diagnóstico)
   medidos con dictado o con preguntas. La estimación se guarda, pero no cuenta. */
const UMBRAL_L = { dictado: 80, preguntas: 70 };
const FUENTES_L = [['6ME', '6 Minute English'], ['BBC', 'Otro programa de BBC Learning English'], ['LR', 'Language Reactor'], ['diag', 'Mini-diagnóstico (6 Minute English)'], ['otro', 'Otra fuente']];
const METODOS_L = [['dictado', 'Dictado de 3 frases: palabras bien escritas'], ['preguntas', 'Preguntas de comprensión acertadas'], ['estimacion', 'Estimación a ojo (no cuenta para la puerta)']];
const FUENTE_BLOQUE = { '6me': '6ME', lis: '6ME', largo: '6ME', esc: '6ME', bbc: 'BBC', lr: 'LR', pasivo: 'otro' };
const esObjetiva = (m) => m.extra && UMBRAL_L[m.extra.metodo] !== undefined && ['6ME', 'diag'].includes(m.extra.fuente);
const lisObjetivas = () => medsDe('listening').filter(esObjetiva);
const okL = (m, margen = 0) => m.valor >= UMBRAL_L[m.extra.metodo] - margen;
const noMuestra = (m) => !(m.extra && m.extra.muestra);
const ultSim = (t) => medsDe(t).filter(noMuestra).at(-1);

/* ---------- Criterios de salida (sección 9) ---------- */
function criterios() {
  const ult = (t) => medsDe(t).at(-1);
  const lis = lisObjetivas(), ult3 = lis.slice(-3);
  const racha = ult3.length === 3 && ult3.every((m) => okL(m));
  const sL = ultSim('sim_L'), sR = ultSim('sim_R');
  const sp = ult('speaking');
  const wr = medsDe('writing').filter((m) => m.extra.tarea === 'examen').at(-1);
  const mur = medsDe('murphy').slice(-5), ank = ult('anki');
  const murMedia = mur.length ? Math.round(mur.reduce((a, m) => a + m.valor, 0) / mur.length) : null;
  const est = (hay, ok) => (!hay ? 'sin' : ok ? 'ok' : 'no');

  const c = [
    { k: 'L', nombre: 'Listening', estado: est(lis.length || sL, racha && sL && sL.valor >= 65),
      lineas: [
        ult3.length ? `Últimos episodios medidos de 6 Minute English: ${ult3.map((m) => `${m.valor} % (${m.extra.metodo})`).join(', ')}. Hacen falta 3 seguidos: 80 % en dictado o 70 % en preguntas.` : 'Sin episodios de 6 Minute English medidos con dictado o preguntas. Hacen falta 3 seguidos: 80 % en dictado o 70 % en preguntas.',
        sL ? `Simulacro: ${sL.valor} %. Mínimo 65.` : 'Simulacro: se mide desde S20. Mínimo 65 %.'],
      serie: lis.map((m) => m.valor), umbral: 70 },
    { k: 'R', nombre: 'Reading', estado: est(sR, sR && sR.valor >= 65 && sR.extra.enTiempo),
      lineas: [sR ? `Simulacro: ${sR.valor} %${sR.extra.enTiempo ? ', dentro del tiempo' : ', fuera de tiempo'}. Mínimo 65 dentro del tiempo.` : 'Se mide en el simulacro desde S20. Mínimo 65 % dentro del tiempo.'],
      serie: medsDe('sim_R').map((m) => m.valor), umbral: 65 },
    { k: 'S', nombre: 'Speaking', estado: est(sp, sp && sp.valor >= 90 && sp.extra.pausas === 0 && sp.extra.errores <= 3 && sp.extra.sitTotal >= 3 && sp.extra.sitOk === sp.extra.sitTotal),
      lineas: [sp ? `Última grabación: ${Math.floor(sp.valor / 60)} min ${sp.valor % 60} s, ${sp.extra.pausas} pausas de más de 5 s, ${sp.extra.errores} errores graves${sp.extra.sitTotal ? `, ${sp.extra.sitOk} de ${sp.extra.sitTotal} situaciones de rol resueltas` : ', sin situaciones de rol'}.` : 'Sin grabaciones medidas.',
        'Criterio (formato del examen): parte 4 con 30 s de preparación y 1,5 min sin pausas de más de 5 s, 3 de 3 situaciones de rol resueltas y 3 errores graves como máximo.'],
      serie: medsDe('speaking').map((m) => m.extra.errores), umbral: 3, invertida: true },
    { k: 'W', nombre: 'Writing', estado: est(wr, wr && wr.valor >= 70 && wr.valor <= 100 && wr.extra.palabras2 >= 100 && wr.extra.palabras2 <= 120 && wr.extra.minutos <= 45 && wr.extra.conectores >= 4 && wr.extra.errores <= 5 && wr.extra.errores2 <= 5),
      lineas: [wr ? `Último examen completo: formal ${wr.valor} palabras (${wr.extra.errores} errores) e informal ${wr.extra.palabras2 ?? '?'} palabras (${wr.extra.errores2 ?? '?'} errores), en ${wr.extra.minutos} min, ${wr.extra.conectores} conectores.` : 'Sin las 2 tareas del examen medidas juntas. Se practican desde S17.',
        'Criterio (formato del examen): formal de 70-100 palabras e informal de 100-120, las 2 en 45 min o menos, 4 conectores distintos y 5 errores como máximo en cada una.'],
      serie: medsDe('writing').filter((m) => m.extra.tarea === 'examen').map((m) => Math.max(m.extra.errores, m.extra.errores2 ?? 0)), umbral: 5, invertida: true },
  ];
  const soporte = { nombre: 'Soporte de vocabulario y gramática', estado: est(murMedia !== null || ank, murMedia !== null && murMedia >= 80 && ank && ank.valor >= 85),
    lineas: [murMedia !== null ? `Murphy, media de las últimas ${mur.length} unidades: ${murMedia} %. Mínimo 80.` : 'Murphy: sin unidades medidas. Mínimo 80 %.',
      ank ? `Retención de Anki: ${ank.valor} %. Mínimo 85.` : 'Retención de Anki: sin dato. Mínimo 85 %. Se anota en la pantalla Semana.'],
    serie: mur.map((m) => m.valor), umbral: 80 };
  return { c, soporte, cumplidas: c.filter((x) => x.estado === 'ok').length };
}

/* ================= Plantillas comunes ================= */
const ESTADO_TXT = { ok: 'Cumple', no: 'No cumple', sin: 'Sin datos' };
function alertaHTML([nivel, txt]) { return `<p class="alerta a-${nivel}">${esc(txt)}</p>`; }
function sparkline(serie, umbral, invertida) {
  if (serie.length < 2) return '';
  const W = 300, H = 56, max = Math.max(100, ...serie, umbral) * (invertida ? 1 : 1);
  const top = invertida ? Math.max(umbral * 2, ...serie) : max;
  const y = (v) => H - 4 - (v / top) * (H - 8);
  const x = (i) => 4 + (i / (serie.length - 1)) * (W - 8);
  const pts = serie.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <line x1="0" x2="${W}" y1="${y(umbral)}" y2="${y(umbral)}" class="umbral"/>
    <polyline points="${pts}" fill="none" class="linea"/>
    <circle cx="${x(serie.length - 1)}" cy="${y(serie.at(-1))}" r="3.5" class="punto"/></svg>`;
}

/* ================= Vista: Hoy ================= */
function vistaHoy() {
  const f = S.dia || hoy();
  const n = semanaDe(f);
  const t = hoy();
  const nav = `<div class="dia-nav">
      <button class="icono" data-acc="dia" data-d="-1" aria-label="Día anterior">‹</button>
      <div class="dia-fecha"><span>${esc(fmtLarga(f))}</span>${iso(f) === iso(t) ? '' : `<button class="enlace" data-acc="dia-hoy">Volver a hoy</button>`}</div>
      <button class="icono" data-acc="dia" data-d="1" aria-label="Día siguiente">›</button></div>`;

  if (n <= 0) return nav + vistaS0(f);
  if (n > 30) return nav + `<section class="cabecera"><h1 class="num-sem">Fin</h1><p class="sub-cab">El plan de 30 semanas ha terminado.</p></section>`;

  const s = getSem(n);
  const bl = bloquesDe(f);
  const plan = bl.reduce((a, b) => a + b.min, 0);
  const hecho = bl.reduce((a, b) => a + minHecho(S.ses.get(clave(f, b))), 0);
  const futuro = f > t;
  const pct = plan ? Math.min(100, (hecho / plan) * 100) : 0;
  const r = resumen(n);

  const laborable = diaIdx(f) < 5;
  let html = nav + `<section class="cabecera">
      <h1 class="num-sem"><span class="s">Semana</span>${n}</h1>
      <div class="cab-txt">
        <p class="fase">${esc(FASES[s.fase])}</p>
        <p class="sub-cab">${esc(s.gram)}</p>
        ${s.hito ? `<p class="hito">${s.diag ? '◆ ' : ''}${esc(s.hito)}</p>` : s.diag ? `<p class="hito">◆ Mini-diagnóstico ${s.diag} el domingo</p>` : ''}
      </div></section>
    <div class="progreso-dia" role="img" aria-label="${hecho} de ${plan} minutos">
      <div class="pd-barra"><i style="width:${pct}%"></i></div>
      <p><span>${laborable ? '17:00' : '0'}</span><span><b class="cifra">${hecho}</b> de ${plan} min</span><span>${laborable ? '18:15' : plan}</span></p>
    </div>`;

  const ankiBl = bl.find((b) => b.tipo === 'anki');
  const ankiOk = ankiBl ? minHecho(S.ses.get(clave(f, ankiBl))) > 0 : false;
  const pendN = bl.filter((b) => !S.ses.get(clave(f, b))).length;
  const racha = rachaAnki();
  const partesHoy = [
    ankiBl ? (ankiOk ? 'Anki hecho' : 'Anki pendiente') : null,
    racha > 0 ? `racha Anki ${racha} día${racha === 1 ? '' : 's'}` : null].filter(Boolean);
  html += `<p class="resumen-hoy">${esc(partesHoy.join(' · '))}</p>`;

  if (!futuro && iso(f) === iso(t)) {
    const dse = diasSinEstudio();
    if (dse >= 3) html += alertaHTML(['rojo', `${dse} días seguidos sin estudiar: señal de fatiga (sección 12). Valora una descarga.`]);
  }
  if (diaIdx(f) === 5) {
    const pend = medsDe('murphy').filter((m) => m.semana === n && m.valor < 70);
    pend.forEach((m) => { html += alertaHTML(['ambar', `Pendiente para hoy: repetir Murphy U${m.extra.unidad || '?'} (${m.valor} %).`]); });
  }

  html += fichasHoy(f, bl, futuro, iso(f) === iso(t));
  html += `<p class="ayuda">${futuro ? 'Día futuro: puedes verlo, pero no registrarlo.' : 'Pulsa «Hecha» o mantén pulsada cualquier ficha para cerrarla. Tócala para ajustar minutos, nota o resultados.'}</p>`;
  html += `<button class="resumen-sem" data-acc="ir-semana" data-n="${n}">
      <span>Semana ${n}</span><span><b class="cifra">${fmtH(r.hecho)}</b> de ${fmtH(r.plan)} h</span></button>`;
  if (iso(f) === iso(t)) html += avisoCopia(n);
  else if (diaIdx(f) === 6 && !futuro) html += `<button class="boton" data-acc="copiar-registro" data-n="${n}">Copiar la fila del registro de S${n}</button>`;
  return html;
}

/* Modelo 3 «Ficha en mano» (v1.7): primero la ficha que toca, después la cola y, plegadas, las hechas.
   Las fichas siguen siendo los mismos .tira con data-b: la pulsación larga y el toque no cambian. */
function fichasHoy(f, bl, futuro, esHoy) {
  const est = (b) => { const s = S.ses.get(clave(f, b)); return s ? s.estado : 'pendiente'; };
  const minDe = (b) => { const s = S.ses.get(clave(f, b)); return s && s.estado !== 'pendiente' ? minHecho(s) : b.min; };
  if (futuro) return `<p class="cola-tit"><span>Previsto</span><span>${bl.reduce((x, b) => x + b.min, 0)} min</span></p>
    <ul class="tiras cola">${bl.map((b) => tiraHTML(f, b, true)).join('')}</ul>`;
  const pend = bl.filter((b) => est(b) === 'pendiente');
  const hechas = bl.filter((b) => est(b) !== 'pendiente');
  const [foco, ...cola] = pend;
  let h = '';
  if (foco) {
    h += `<section class="foco"><p class="foco-et"><span>${esHoy ? 'Ahora' : 'Pendiente'}</span><b>${pend.length === 1 ? 'Última ficha' : `1 de ${pend.length} pendientes`}</b></p>
      <ul class="tiras">${tiraHTML(f, foco, false)}</ul>
      <div class="foco-botones"><button type="button" class="boton" data-acc="foco-hecha" data-b="${foco.id}">✓ Hecha · ${foco.min} min</button>
        <button type="button" class="boton sec" data-acc="foco-anotar" data-b="${foco.id}">${FORMS[foco.tipo] && foco.tipo !== 'anki' ? 'Anotar resultado' : 'Ajustar'}</button></div></section>`;
  } else if (bl.length) {
    h += `<section class="foco foco-fin"><p class="foco-et"><span>${esHoy ? 'Hoy' : 'Este día'}</span><b>Todo hecho ✓</b></p></section>`;
  }
  if (cola.length) h += `<p class="cola-tit"><span>Después</span><span>${cola.reduce((x, b) => x + b.min, 0)} min</span></p>
    <ul class="tiras cola">${cola.map((b) => tiraHTML(f, b, false)).join('')}</ul>`;
  if (hechas.length) {
    const sellos = hechas.map((b) => `<i style="--c:var(--sk-${b.sk})">${CODIGO[b.sk]}</i>`).join('');
    h += `<details class="hechas"${S.hechasAbiertas ? ' open' : ''}><summary><span><b>${hechas.length} hecha${hechas.length === 1 ? '' : 's'}</b> · ${hechas.reduce((x, b) => x + minDe(b), 0)} min</span><span class="sellos">${sellos}</span></summary>
      <ul class="tiras">${hechas.map((b) => tiraHTML(f, b, false)).join('')}</ul></details>`;
  }
  return h;
}

function detalleDe(b) {
  const sk = DESTREZAS[b.sk], repite = b.nombre.toLowerCase().includes(sk.split(' ')[0].toLowerCase());
  return [repite ? '' : sk, b.sub].filter(Boolean).join('. ');
}
/* Cierre del domingo: fila del registro + copia de seguridad.
   Se muestra el domingo y, cualquier día, si la última copia tiene 7 días o más. */
function diasDesdeCopia() {
  const u = S.aj.get('ultimaExport');
  return u ? diasEntre(parseISO(u), hoy()) : null;
}
function avisoCopia(n) {
  const d = diasDesdeCopia(), domingo = diaIdx(hoy()) === 6;
  const hayDatos = S.ses.size > 0;
  const hechaHoy = d === 0;
  const vencida = hayDatos && (d === null || d >= 7);
  if (!domingo && !vencida) return '';
  const txt = hechaHoy ? 'Copia de seguridad hecha hoy.'
    : d === null ? 'Todavía no has exportado ninguna copia.'
    : `Última copia hace ${d} ${d === 1 ? 'día' : 'días'}.`;
  return `<section class="cierre${vencida && !hechaHoy ? ' vencida' : ''}">
    <h2 class="h2">${domingo ? `Cierre de la semana ${n}` : 'Copia de seguridad pendiente'}</h2>
    <p class="ayuda">${esc(txt)}</p>
    ${domingo ? `<button class="boton sec" data-acc="copiar-registro" data-n="${n}">Copiar la fila del registro de S${n}</button>` : ''}
    ${hechaHoy ? '' : '<button class="boton" data-acc="exportar">Exportar copia ahora</button>'}
  </section>`;
}
function tiraHTML(f, b, futuro) {
  const s = S.ses.get(clave(f, b));
  const est = s ? s.estado : 'pendiente';
  const min = est === 'parcial' ? `${s.minReal}<small>/${b.min}</small>` : est === 'saltada' ? '—' : est === 'hecha' ? s.minReal : b.min;
  const etq = { pendiente: 'min', hecha: 'hecho', parcial: 'parcial', saltada: 'saltada' }[est];
  const aria = { pendiente: 'pendiente', hecha: 'completada', parcial: 'parcial', saltada: 'saltada' }[est];
  return `<li><button class="tira est-${est}${futuro ? ' futura' : ''}" style="--c:var(--sk-${b.sk})" data-b="${b.id}" aria-label="${esc(b.nombre)}, ${b.min} minutos, ${aria}">
    <span class="barra"></span><span class="cod">${CODIGO[b.sk]}</span>
    <span class="txt"><span class="nombre">${esc(b.nombre)}</span><span class="detalle">${esc(s && s.nota ? [detalleDe(b), '📝 ' + s.nota].filter(Boolean).join(' · ') : detalleDe(b))}</span></span>
    <span class="min"><small class="etq">${etq}</small><span class="cifra">${min}</span></span></button></li>`;
}

function vistaS0(f) {
  const faltan = diasEntre(hoy(), parseISO(PLAN.inicioS1));
  const tarde = (t) => TAREAS_S0.filter((x) => x.tarde === t).map((x) => {
    const hecha = S.aj.get('s0:' + x.id);
    return `<li><button class="tira ${hecha ? 'est-hecha' : 'est-pendiente'}" style="--c:var(--sk-D)" data-s0="${x.id}" aria-label="${esc(x.nombre)}, ${hecha ? 'hecha' : 'pendiente'}">
      <span class="barra"></span><span class="cod">T${x.tarde}</span><span class="txt"><span class="nombre">${esc(x.nombre)}</span><span class="detalle">${esc(x.sub)}</span></span>
      <span class="min"><small class="etq">${hecha ? 'hecha' : ''}</small><span class="cifra">${hecha ? '✓' : ''}</span></span></button></li>`;
  }).join('');
  return `<section class="cabecera"><h1 class="num-sem"><span class="s">Semana</span>0</h1>
      <div class="cab-txt"><p class="fase">Preparación</p><p class="sub-cab">Dos tardes, del 22 de septiembre al 4 de octubre</p>
      <p class="hito">${faltan > 0 ? `Faltan ${faltan} días para S1` : 'S1 empieza hoy'}</p></div></section>
    <h2 class="h2">Tarde 1, unos 55 min</h2><ul class="tiras">${tarde(1)}</ul>
    <h2 class="h2">Tarde 2, unos 35 min</h2><ul class="tiras">${tarde(2)}</ul>
    <p class="ayuda">Mantén pulsada una ficha para cerrarla. Estas tareas no cuentan en las horas del plan. Primera sesión: lunes 5 de octubre a las 17:00, Murphy U1 con la regla del 90 %.</p>`;
}

/* ================= Vista: Semana ================= */
function vistaSemana() {
  const n = S.semanaVista ?? Math.max(1, semanaActual());
  if (n < 1) return '<p class="vacio">El plan empieza el lunes 5 de octubre.</p>';
  const r = resumen(n), s = r.sem, ini = inicioSemana(n);
  const obj = r.plan, minimo = s.tipo ? r.plan : PLAN.minimoMin;
  const escala = Math.max(obj * 1.15, r.hecho);
  let estado;
  if (!r.empezada) estado = 'Semana futura.';
  else if (r.cerrada) estado = s.tipo ? `Semana ${s.tipo === 'descarga' ? 'de descarga' : 'ligera'} cerrada con ${fmtH(r.hecho)} h de ${fmtH(obj)}.` : r.hecho >= obj ? 'Semana cerrada en el objetivo.' : r.hecho >= minimo ? 'Semana cerrada entre el mínimo y el objetivo.' : 'Semana cerrada por debajo del mínimo.';
  else {
    const f1 = Math.max(0, obj - r.hecho), f2 = Math.max(0, minimo - r.hecho);
    estado = f1 === 0 ? 'Objetivo de la semana cumplido.' : s.tipo ? `Faltan ${f1} min para cerrar la semana.` : `Faltan ${f1} min para el objetivo y ${f2} para el mínimo. A fecha de hoy tocaban ${r.planAFecha}.`;
  }
  const seg = ['L', 'S', 'V', 'R', 'W', 'C', 'X', 'D'].filter((k) => r.por[k].plan || r.por[k].hecho);
  const barraSeg = seg.map((k) => `<i style="width:${(r.por[k].hecho / escala) * 100}%;background:var(--sk-${k})"></i>`).join('');
  const anki = r.dias.map((d, i) => `<span class="punto-anki ${d.anki ? 'si' : d.futuro ? 'fut' : 'no'}"><b>${DIAS[i]}</b></span>`).join('');
  const filas = seg.map((k) => {
    const p = r.por[k];
    const cuota = r.hecho ? Math.round((p.hecho / r.hecho) * 100) : 0;
    const enCurso = r.empezada && !r.cerrada;
    const base = enCurso ? r.planAFecha : r.plan;
    const basePor = enCurso ? p.planHoy : p.plan;
    const cuotaPlan = base ? Math.round((basePor / base) * 100) : 0;
    return `<div class="ficha-fila${p.hecho ? '' : ' apagada'}" style="--c:var(--sk-${k})"><span class="barra"></span><span class="cod">${CODIGO[k]}</span>
      <span class="nom">${esc(DESTREZAS[k])}</span><span class="val cifra">${p.hecho}<small>/${enCurso ? p.planHoy : p.plan}</small></span><span class="val cifra">${cuota}<small>/${cuotaPlan} %</small></span></div>`;
  }).join('');
  const ank = S.med.get(`anki:S${n}|anki`);
  const alertas = alertasSemana(n);

  return `<div class="dia-nav">
      <button class="icono" data-acc="sem" data-d="-1" aria-label="Semana anterior" ${n <= 1 ? 'disabled' : ''}>‹</button>
      <div class="dia-fecha"><span>Semana ${n}, ${fmtCorta(ini)} a ${fmtCorta(addDays(ini, 6))}</span></div>
      <button class="icono" data-acc="sem" data-d="1" aria-label="Semana siguiente" ${n >= 30 ? 'disabled' : ''}>›</button></div>
    <section class="cabecera sem-cab">
      <p class="grande cifra">${r.hecho}<span class="de"> de ${obj} min</span></p>
      <p class="sub-cab">${esc(estado)}</p></section>
    <div class="zona" role="img" aria-label="${r.hecho} minutos; mínimo ${minimo}, objetivo ${obj}">
      <div class="zona-barra">${barraSeg}
        ${s.tipo ? '' : `<span class="banda" style="left:${(minimo / escala) * 100}%;width:${((obj - minimo) / escala) * 100}%"></span>`}
        <span class="marca" style="left:${(obj / escala) * 100}%"></span></div>
      <div class="zona-leyenda">${s.tipo ? '' : `<span class="izq" style="left:${(minimo / escala) * 100}%">mínimo 9 h</span>`}<span class="der" style="left:${(obj / escala) * 100}%">${fmtH(obj)} h</span></div>
    </div>
    ${alertas.map(alertaHTML).join('')}
    <h2 class="h2">Anki, ${r.ankiDias} de 7 días</h2><div class="fila-anki">${anki}</div>
    <h2 class="h2 sin-margen">Reparto por destreza</h2>
    <div class="cab-fichas"><span></span><span>min</span><span>cuota</span></div>
    <div class="portafichas">${filas}</div>
    <p class="ayuda">${r.empezada && !r.cerrada ? 'Minutos y cuota, frente a lo previsto hasta hoy. Al cerrar la semana pasan a compararse con el total.' : 'Minutos y cuota, frente a lo previsto para la semana completa.'} Objetivo de la semana: ${r.por.L.plan} min de listening, ${r.por.S.plan} de speaking, ${r.por.V.plan} de vocab y gramática, ${r.por.R.plan} de reading${r.por.W.plan ? `, ${r.por.W.plan} de writing` : ''}.</p>
    <h2 class="h2">Retención de Anki</h2>
    <div class="en-linea"><label for="anki-ret">% de retención en las estadísticas de Anki</label>
      <input id="anki-ret" type="number" inputmode="numeric" min="0" max="100" value="${ank ? ank.valor : ''}" data-n="${n}"></div>
    <button class="boton" data-acc="copiar-registro" data-n="${n}">Copiar la fila del registro de S${n}</button>`;
}

/* ---------- Exportar al 03_registro_progreso.md ---------- */
function filaRegistro(n) {
  const r = resumen(n), s = r.sem;
  const lis = medsDe('listening').filter((m) => m.semana === n);
  const mur = medsDe('murphy').filter((m) => m.semana === n);
  const lisO = lis.filter(esObjetiva);
  const media = lisO.length ? `${Math.round(lisO.reduce((a, m) => a + m.valor, 0) / lisO.length)} % medido` : lis.length ? `${Math.round(lis.reduce((a, m) => a + m.valor, 0) / lis.length)} % est.` : '';
  const esc0 = bloquesDe(addDays(inicioSemana(n), 5)).find((b) => b.id === 'esc');
  const escHecho = esc0 && minHecho(S.ses.get(clave(addDays(inicioSemana(n), 5), esc0))) > 0;
  const pw = s.tipo ? '—' : n >= 22 ? 'Simulacro' : `${esc0 ? esc0.nombre : ''}${escHecho ? ' ✓' : ' pendiente'}`;
  const notas = [s.tipo === 'descarga' ? 'Descarga' : '', ...alertasSemana(n).map((a) => a[1].split(':')[0])].filter(Boolean).join('; ');
  const out = [`| S${n} | ${fmtH(r.hecho)} | ${r.ankiDias}/7 | ${mur.map((m) => `U${m.extra.unidad || '?'} (${m.valor} %)`).join(', ')} | ${media} | ${r.speakingSes} | ${pw} | ${notas} |`];
  if (lis.length) {
    out.push('', '<!-- Sección 3 · Listening -->');
    lis.forEach((m) => out.push(`| ${fmtCorta(parseISO(m.fecha))} | ${m.extra.episodio || ''} | ${m.valor} % (${m.extra.metodo || 'estimacion'}${m.extra.total ? ` ${m.extra.aciertos}/${m.extra.total}` : ''}) | ${(m.extra.palabras || '').replace(/\n/g, '; ')} |`));
  }
  if (mur.length) {
    out.push('', '<!-- Sección 4 · Murphy -->');
    mur.forEach((m) => out.push(`| U${m.extra.unidad || '?'} | ${fmtCorta(parseISO(m.fecha))} | ${m.valor} % | ${m.valor >= 90 ? 'cerrada' : m.valor < 70 ? 'repetir / sábado' : 'no cerrada'} |`));
  }
  const notasSes = [...S.ses.values()].filter((x) => x.semana === n && x.nota).sort((a, b) => a.key.localeCompare(b.key));
  if (notasSes.length) {
    out.push('', '<!-- Notas de las sesiones -->');
    notasSes.forEach((x) => { const bx = bloquesDe(parseISO(x.fecha)).find((b) => b.id === x.bloque); out.push(`| ${fmtCorta(parseISO(x.fecha))} | ${bx ? bx.nombre : x.bloque} | ${x.nota.replace(/\n/g, ' ')} |`); });
  }
  const sm = S.sem.get(n);
  if (sm && s.diag) {
    const ic = { verde: '🟢', ambar: '🟡', rojo: '🔴', '': '—' };
    const l = medsDe('listening').find((m) => m.ref.includes('|diag') && m.semana === n);
    const mr = medsDe('murphy_repaso').find((m) => m.semana === n);
    out.push('', '<!-- Sección 6 · Mini-diagnóstico -->',
      `| ${s.diag} | S${n} | ${l ? l.valor : ''} | ${mr ? mr.valor : ''} | ${ic[sm.S || '']} | ${ic[sm.W || '']} | ${sm.ajuste || ''} |`);
  }
  return out.join('\n');
}

/* ================= Vista: Ruta ================= */
function vistaRuta() {
  const t = hoy(), act = semanaActual();
  const resumenes = SEMANAS.map((s) => resumen(s.n));
  const cerradas = resumenes.filter((r) => r.cerrada && esNormal(r.n));
  const media = cerradas.length ? fmtH(cerradas.reduce((a, r) => a + r.hecho, 0) / cerradas.length) : null;
  const totalHecho = resumenes.reduce((a, r) => a + r.hecho, 0);
  const totalPlan = resumenes.reduce((a, r) => a + r.plan, 0);
  const planAFecha = resumenes.reduce((a, r) => a + r.planAFecha, 0);
  const pct = totalPlan ? Math.round((totalHecho / totalPlan) * 100) : 0;
  const pctFecha = planAFecha ? Math.round((totalHecho / planAFecha) * 100) : 0;
  // v1.7: una fila por semana (sin desplazamiento horizontal), agrupada por fase, con sus horas
  const max = 700;
  const SEP = { 1: 'Fase 0 · diagnóstico', 3: 'Fase 1 · cimientos', 10: 'Fase 2 · salto a B1', 22: 'Fase 3 · recta final' };
  const filas = resumenes.map((r) => {
    const s = r.sem;
    const celdas = r.dias.map((x, i) => {
      let c = 'fut';
      if (!x.futuro) c = x.hecho === 0 ? 'n0' : x.hecho < x.plan * 0.5 ? 'n1' : x.hecho < x.plan ? 'n2' : 'n3';
      return `<i class="c ${c}${s.tipo ? ' desc' : ''}${iso(x.fecha) === iso(t) ? ' hoy' : ''}" title="S${r.n} ${DIAS[i]}: ${x.hecho}/${x.plan} min"></i>`;
    }).join('');
    const bajo = esNormal(r.n) && r.cerrada && r.hecho < PLAN.minimoMin;
    const mk = s.examen ? '●' : s.puerta ? '▲' : s.diag ? '◆' : s.comprob ? '△' : '';
    const horas = r.empezada ? `<em>${fmtH(r.hecho)} h</em>` : `<em class="fut">${fmtH(r.plan)}</em>`;
    return `${SEP[r.n] ? `<p class="rf-sep">${SEP[r.n]}</p>` : ''}<div class="rf-fila${r.n === act ? ' act' : ''}${s.tipo ? ' desc' : ''}" data-acc="ir-semana" data-n="${r.n}" role="button" tabindex="0" aria-label="Semana ${r.n}: ${fmtH(r.hecho)} de ${fmtH(r.plan)} h">
      <b>S${r.n}</b>${celdas}<span class="rf-h"><span class="rf-mk">${mk}</span><span class="rf-hb"><i class="${s.tipo ? 'desc' : bajo ? 'bajo' : ''}" style="width:${(Math.min(r.hecho, max) / max) * 100}%"></i><s style="left:${(Math.min(r.plan, max) / max) * 100}%"></s></span>${horas}</span></div>`;
  }).join('');

  return `<section class="cabecera sem-cab"><p class="grande cifra">${act < 1 ? 'S0' : `S${act}`}<span class="de"> de 30</span></p>
      <p class="sub-cab">${totalHecho > 0 ? `<strong>${fmtH(totalHecho)} h</strong> hechas · <strong>${pct} %</strong> del plan${media ? ` · media de las semanas cerradas: ${media} h` : ''}` : 'Todavía no hay horas registradas.'}</p>
      ${act >= 1 && planAFecha ? `<p class="ayuda">Respecto a lo previsto hasta hoy: ${pctFecha} %.</p>` : ''}</section>
    <p class="leyenda-r"><span><i class="c n3"></i>Completo</span><span><i class="c n2"></i>Parcial</span><span><i class="c n0"></i>Sin hacer</span><span><i class="c desc"></i>Descarga</span></p>
    <p class="leyenda-r"><span>◆ Mini-diagnóstico</span><span>△ Comprobación</span><span>▲ Puerta</span><span>● Examen</span></p>
    <div class="ruta-filas"><div class="rf-cab"><span></span>${DIAS.map((d) => `<span>${d}</span>`).join('')}<span class="rf-cab-h">horas · raya = objetivo</span></div>${filas}</div>
    <p class="ayuda">En rojo, semanas normales cerradas por debajo del mínimo de 9 h. Toca una fila para abrir esa semana.</p>`;
}

/* ================= Vista: Criterios ================= */
function vistaCriterios() {
  const { c, soporte, cumplidas } = criterios();
  const n = semanaActual();
  const fila = (x) => `<article class="crit${x.estado === 'sin' ? ' apagada' : ''}" style="--c:var(--sk-${x.k || 'V'})">
      <span class="barra"></span><span class="cod">${CODIGO[x.k || 'V']}</span>
      <div class="crit-cuerpo"><header><h2>${esc(x.nombre)}</h2><span class="estado e-${x.estado}">${ESTADO_TXT[x.estado]}</span>${tendenciaTxt(x.serie, x.invertida) ? `<span class="tend t-${tendenciaTxt(x.serie, x.invertida)}">${tendenciaTxt(x.serie, x.invertida)}</span>` : ''}</header>
      ${x.lineas.map((l) => `<p>${esc(l)}</p>`).join('')}
      ${sparkline(x.serie, x.umbral, x.invertida)}</div></article>`;
  let regla = '';
  if (n >= 24) regla = cumplidas === 4 ? 'Con 4 de 4 en S24 y S26: reserva en S27 y examen en S29.' : cumplidas === 3 ? 'Con 3 de 4: dos semanas de refuerzo en la destreza fallida, recomprobación en S28 y examen en S30.' : 'Con 2 de 4 o menos: aplazar a junio de 2027 con nueva reserva.';
  else if (n >= 20) {
    const lis = lisObjetivas().slice(-3), sL = ultSim('sim_L'), sR = ultSim('sim_R');
    const sm = [...S.sem.values()].filter((x) => x.semana > 0).sort((a, b) => a.semana - b.semana).at(-1);
    const conds = [
      ['Listening en 3 episodios seguidos a 5 puntos o menos del umbral (75 % dictado o 65 % preguntas)', lis.length === 3 && lis.every((m) => okL(m, 5))],
      ['Simulacro R+L de 60 % o más de media', sL && sR && (sL.valor + sR.valor) / 2 >= 60],
      ['Speaking en verde en el último mini-diagnóstico', sm && sm.S === 'verde'],
      ['Writing en verde en el último mini-diagnóstico', sm && sm.W === 'verde']];
    regla = `Salida anticipada, se decide en S21:</p><ul class="conds">${conds.map(([t, ok]) => `<li class="${ok ? 'si' : 'no'}">${esc(t)}</li>`).join('')}</ul><p class="ayuda">Si se cumplen las cuatro, la puerta pasa a S23.`;
  }
  const recientes = [...S.med.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);
  const NOM = { listening: 'Listening', murphy: 'Murphy', murphy_repaso: 'Murphy repaso', speaking: 'Speaking', writing: 'Writing', sim_L: 'Simulacro L', sim_R: 'Simulacro R', sim_W: 'Simulacro W', sim_S: 'Simulacro S', sim_err: 'Errores simulacro', anki: 'Anki' };
  const val = (m) => m.tipo === 'listening' ? `${m.valor} %${m.extra.metodo && m.extra.metodo !== 'estimacion' ? '' : ' est.'}` : m.tipo === 'speaking' ? `${m.valor} s` : m.tipo === 'writing' ? `${m.valor} pal.` : m.tipo === 'sim_err' ? `${m.valor} err.` : `${m.valor} %`;
  return `<section class="cabecera sem-cab"><p class="grande cifra">${cumplidas}<span class="de"> de 4 destrezas</span></p>
      <p class="sub-cab">Criterios de salida de la sección 9. No se reserva el examen hasta cumplirlos.</p></section>
    ${regla ? `<p class="ayuda regla">${regla}</p>` : ''}
    <div class="portafichas">${c.map(fila).join('')}</div>
    <p class="h2">Soporte, no cuenta en el 4 de 4</p>
    <div class="portafichas">${fila(soporte)}</div>
    <p class="ayuda">Murphy usa la media de las últimas 5 unidades medidas.</p>
    <button class="boton" data-acc="medir">Añadir una medición</button>
    <h2 class="h2">Últimas mediciones</h2>
    ${recientes.length ? `<ul class="lista-med">${recientes.map((m) => `<li><span>${fmtCorta(parseISO(m.fecha))}</span><span>${NOM[m.tipo] || m.tipo}${m.extra && m.extra.muestra ? ' (muestra)' : ''}${m.extra && m.extra.unidad ? ` U${esc(m.extra.unidad)}` : ''}</span><span class="cifra">${val(m)}</span><button class="enlace" data-acc="borrar-med" data-id="${esc(m.id)}">Borrar</button></li>`).join('')}</ul>` : '<p class="vacio">Las mediciones aparecen aquí al anotar resultados en las tiras de Hoy.</p>'}`;
}

/* ================= Vista: Datos ================= */
function vistaDatos() {
  const fs = S.aj.get('fechaSimulada') || '';
  return `<section class="cabecera sem-cab"><p class="grande">Datos</p><p class="sub-cab">Todo se guarda solo en este móvil.</p></section>
    <h2 class="h2">Copia de seguridad</h2>
    <p class="ayuda">Exporta una copia cada domingo, junto con la fila del registro. Si borras los datos de Chrome o cambias de móvil, la copia es lo único que conserva el historial.</p>
    <p class="ayuda">${S.aj.get('ultimaExport') ? `Última copia: ${esc(fmtLarga(parseISO(S.aj.get('ultimaExport'))))}.` : 'Todavía no hay ninguna copia exportada.'}</p>
    <button class="boton" data-acc="exportar">Exportar copia (JSON)</button>
    <label class="boton sec" for="imp">Importar copia</label><input id="imp" type="file" hidden>
    <h2 class="h2">Fecha de prueba</h2>
    <p class="ayuda">Sirve para probar la app antes del 5 de octubre. Déjala vacía para usar la fecha real.</p>
    <div class="en-linea"><label for="fsim">Fecha simulada</label><input id="fsim" type="date" value="${fs}" min="${PLAN.inicioS0}" max="2027-05-02"></div>
    ${fs ? '<button class="boton sec" data-acc="fecha-real">Usar la fecha real</button>' : ''}
    <h2 class="h2">Borrar todo</h2>
    <p class="ayuda">Elimina sesiones, mediciones y semáforos. No se puede deshacer.</p>
    <button class="boton peligro" data-acc="borrar-todo">Borrar todos los datos</button>
    <p class="version">Versión 1.7.1 · ficha en mano y ruta en filas. Plan v3.2.</p>`;
}

/* ================= Hojas (formularios) ================= */
const num = (name, label, v, min = 0, max = 999) => `<label class="campo"><span>${label}</span><input name="${name}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${v ?? ''}"></label>`;
const txt = (name, label, v) => `<label class="campo"><span>${label}</span><input name="${name}" type="text" value="${esc(v ?? '')}"></label>`;
const area = (name, label, v) => `<label class="campo"><span>${label}</span><textarea name="${name}" rows="3">${esc(v ?? '')}</textarea></label>`;
const nv = (el) => (el && el.value !== '' ? Number(el.value) : null);
const semSel = (name, label, v) => `<label class="campo"><span>${label}</span><select name="${name}">
  ${[['', 'Sin valorar'], ['verde', '🟢 Verde'], ['ambar', '🟡 Ámbar'], ['rojo', '🔴 Rojo']].map(([k, t]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;

const sel = (name, label, opts, v) => `<label class="campo"><span>${label}</span><select name="${name}">${opts.map(([k, t]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;

/* Listening: el % sale de aciertos / total (dictado o preguntas). La estimación solo se guarda. */
const lisCampos = (x, v) => sel('fuente' + x, 'Fuente', FUENTES_L, v.fuente) + sel('metodo' + x, 'Cómo lo has medido', METODOS_L, v.metodo)
  + `<div class="rejilla-campos">${num('aciertos' + x, 'Aciertos', v.aciertos, 0, 500)}${num('total' + x, 'Total', v.total, 0, 500)}</div>`
  + num('pct' + x, '% estimado (solo si es estimación)', v.metodo === 'estimacion' ? v.pct : undefined, 0, 100);
function lisLeer(f, x) {
  const met = f['metodo' + x].value, ac = nv(f['aciertos' + x]), tot = nv(f['total' + x]);
  const medido = met !== 'estimacion' && ac !== null && tot;
  const valor = medido ? Math.round((Math.min(ac, tot) / tot) * 100) : nv(f['pct' + x]);
  if (valor === null) return null;
  return { valor, extra: { fuente: f['fuente' + x].value, metodo: medido ? met : 'estimacion', aciertos: medido ? ac : null, total: medido ? tot : null } };
}
const lisCargar = (m) => (m ? { pct: m.valor, ...m.extra, metodo: m.extra.metodo || 'estimacion', fuente: m.extra.fuente || (m.extra.episodio === 'Mini-diagnóstico' ? 'diag' : '6ME') } : {});

const FORMS = {
  listening: {
    titulo: 'Listening',
    cargar: (ms) => {
      const l = ms.filter((x) => x.tipo === 'listening').sort((a, b) => a.id.localeCompare(b.id));
      const v = lisCargar(l[0]);
      if (l[1]) { const w = lisCargar(l[1]); for (const k in w) v[k + '2'] = w[k]; }
      return v;
    },
    html: (v) => '<p class="ayuda">Dictado: tras la escucha en frío, escribe 3 frases (minutos 1, 3 y 5, máximo 2 escuchas cada una) y corrígelas con la transcripción. Aciertos = palabras bien escritas; total = palabras de las 3 frases.</p>'
      + lisCampos('', v) + txt('episodio', 'Episodio', v.episodio) + area('palabras', 'Palabras nuevas con contexto, 3 a 5', v.palabras)
      + `<details class="segundo"${v.pct2 !== undefined ? ' open' : ''}><summary>Segundo episodio del mismo bloque</summary>
        ${lisCampos('2', { fuente: v.fuente2 || v.fuente, metodo: v.metodo2 || 'dictado', ...Object.fromEntries(['aciertos', 'total', 'pct'].map((k) => [k, v[k + '2']])) })}${txt('episodio2', 'Episodio', v.episodio2)}${area('palabras2', 'Palabras nuevas con contexto, 3 a 5', v.palabras2)}</details>`,
    leer: (f) => {
      const out = [];
      const a = lisLeer(f, ''), b = lisLeer(f, '2');
      if (a) out.push({ tipo: 'listening', valor: a.valor, extra: { ...a.extra, episodio: f.episodio.value.trim(), palabras: f.palabras.value.trim() } });
      if (b) out.push({ tipo: 'listening', sub: '2', valor: b.valor, extra: { ...b.extra, episodio: f.episodio2.value.trim(), palabras: f.palabras2.value.trim() } });
      return out;
    },
  },
  murphy: {
    titulo: 'Murphy',
    cargar: (ms) => { const m = ms.find((x) => x.tipo === 'murphy'); return m ? { pct: m.valor, unidad: m.extra.unidad } : {}; },
    html: (v) => num('unidad', 'Unidad', v.unidad, 1, 150) + num('pct', '% de acierto a la primera', v.pct, 0, 100) + '<p class="regla90" aria-live="polite"></p>',
    leer: (f) => { const p = nv(f.pct); return p === null ? [] : [{ tipo: 'murphy', valor: p, extra: { unidad: f.unidad.value } }]; },
  },
  speaking: {
    titulo: 'Speaking grabado',
    cargar: (ms) => { const m = ms.find((x) => x.tipo === 'speaking'); return m ? { seg: m.valor, ...m.extra } : {}; },
    html: (v) => num('seg', 'Duración del monólogo en segundos (parte 4: 90 o más)', v.seg, 0, 600) + num('pausas', 'Pausas de más de 5 s', v.pausas, 0, 50) + num('errores', 'Errores que dificultan la comprensión', v.errores, 0, 50)
      + `<div class="rejilla-campos">${num('sitOk', 'Situaciones de rol resueltas', v.sitOk, 0, 10)}${num('sitTotal', 'Situaciones de rol planteadas', v.sitTotal, 0, 10)}</div>`,
    leer: (f) => { const s = nv(f.seg); return s === null ? [] : [{ tipo: 'speaking', valor: s, extra: { pausas: nv(f.pausas) ?? 0, errores: nv(f.errores) ?? 0, sitOk: nv(f.sitOk) ?? 0, sitTotal: nv(f.sitTotal) ?? 0 } }]; },
  },
  writing: {
    titulo: 'Writing',
    cargar: (ms) => { const m = ms.find((x) => x.tipo === 'writing'); return m ? { palabras: m.valor, ...m.extra } : {}; },
    html: (v) => sel('tarea', 'Tarea', [['informal', 'Informal: carta o email a un amigo (100-120)'], ['formal', 'Formal: respuesta corta a un texto (70-100)'], ['examen', 'Las 2 tareas del examen seguidas']], v.tarea)
      + num('palabras', 'Palabras (en el examen, las de la tarea formal)', v.palabras, 0, 400) + num('errores', 'Errores gramaticales (de esa tarea)', v.errores, 0, 50)
      + num('minutos', 'Minutos empleados en total', v.minutos, 0, 120) + num('conectores', 'Conectores distintos bien usados', v.conectores, 0, 30)
      + `<details class="segundo"${v.tarea === 'examen' ? ' open' : ''}><summary>Tarea informal (solo si son las 2 del examen)</summary>
        ${num('palabras2', 'Palabras de la tarea informal', v.palabras2, 0, 400)}${num('errores2', 'Errores gramaticales de la tarea informal', v.errores2, 0, 50)}</details>`,
    leer: (f) => {
      const p = nv(f.palabras); if (p === null) return [];
      const examen = f.tarea.value === 'examen';
      return [{ tipo: 'writing', valor: p, extra: { tarea: f.tarea.value, minutos: nv(f.minutos) ?? 0, conectores: nv(f.conectores) ?? 0, errores: nv(f.errores) ?? 0,
        palabras2: examen ? nv(f.palabras2) : null, errores2: examen ? nv(f.errores2) : null } }];
    },
  },
  simulacro: {
    titulo: 'Simulacro',
    cargar: (ms) => {
      const v = {}; ms.forEach((m) => { if (m.tipo.startsWith('sim_') && m.tipo !== 'sim_err') { v[m.tipo.slice(4)] = m.valor; if (m.tipo === 'sim_R') v.enTiempo = m.extra.enTiempo; } if (m.tipo === 'sim_err') Object.assign(v, m.extra); });
      return v;
    },
    html: (v) => `<div class="rejilla-campos">${num('L', 'Listening %', v.L, 0, 100)}${num('R', 'Reading %', v.R, 0, 100)}${num('W', 'Writing %', v.W, 0, 100)}${num('S', 'Speaking %', v.S, 0, 100)}</div>
      <label class="check-campo"><input type="checkbox" name="enTiempo" ${v.enTiempo !== false ? 'checked' : ''}> Reading hecho dentro del tiempo</label>
      <p class="ayuda">Errores por tipo</p><div class="rejilla-campos">${num('G', 'Gramática', v.G)}${num('V', 'Vocabulario', v.V)}${num('NE', 'No entendí', v.NE)}${num('T', 'Timing', v.T)}</div>`,
    leer: (f) => {
      const out = [];
      for (const p of ['L', 'R', 'W', 'S']) { const x = nv(f[p]); if (x !== null) out.push({ tipo: 'sim_' + p, valor: x, extra: { enTiempo: f.enTiempo.checked } }); }
      const e = { G: nv(f.G) ?? 0, V: nv(f.V) ?? 0, NE: nv(f.NE) ?? 0, T: nv(f.T) ?? 0 };
      const tot = e.G + e.V + e.NE + e.T; if (tot) out.push({ tipo: 'sim_err', valor: tot, extra: e });
      return out;
    },
  },
  muestra: null, // se completa debajo: igual que el simulacro, marcado como muestra
  minidiag: {
    titulo: 'Mini-diagnóstico',
    cargar: (ms, n) => {
      const l = ms.find((x) => x.tipo === 'listening'), m = ms.find((x) => x.tipo === 'murphy_repaso');
      return { ...lisCargar(l), fuente: 'diag', metodo: l ? (l.extra.metodo || 'estimacion') : 'dictado', mur: m && m.valor, ...(S.sem.get(n) || {}) };
    },
    html: (v) => '<p class="ayuda">Listening: un episodio de 6 Minute English, medido con dictado o con preguntas.</p>' + lisCampos('', v) + num('mur', 'Murphy, % en los 10 ejercicios de repaso', v.mur, 0, 100)
      + `<div class="rejilla-campos">${semSel('sL', 'Listening', v.L)}${semSel('sR', 'Reading', v.R)}${semSel('sS', 'Speaking', v.S)}${semSel('sW', 'Writing', v.W)}</div>` + area('ajuste', 'Ajuste para la semana siguiente', v.ajuste),
    leer: (f) => {
      const out = [], l = lisLeer(f, ''), m = nv(f.mur);
      if (l) out.push({ tipo: 'listening', valor: l.valor, extra: { ...l.extra, episodio: 'Mini-diagnóstico', palabras: '' } });
      if (m !== null) out.push({ tipo: 'murphy_repaso', valor: m, extra: {} });
      return out;
    },
    semaforo: (f) => ({ L: f.sL.value, R: f.sR.value, S: f.sS.value, W: f.sW.value, ajuste: f.ajuste.value.trim() }),
  },
  anki: {
    titulo: 'Retención de Anki',
    cargar: (ms) => { const m = ms.find((x) => x.tipo === 'anki'); return m ? { pct: m.valor } : {}; },
    html: (v) => num('pct', '% de retención', v.pct, 0, 100),
    leer: (f) => { const p = nv(f.pct); return p === null ? [] : [{ tipo: 'anki', valor: p, extra: {} }]; },
  },
};

FORMS.muestra = { ...FORMS.simulacro, titulo: 'Modelo de muestra (no cuenta para la puerta)',
  leer: (f) => FORMS.simulacro.leer(f).map((m) => ({ ...m, extra: { ...m.extra, muestra: true } })) };

function regla90(form) {
  const out = $('.regla90', form); if (!out) return;
  const p = nv(form.pct);
  out.textContent = p === null ? 'Regla del 90 %: 90 o más cierra la unidad; menos de 70 repite la explicación y la marca para el sábado.'
    : p >= 90 ? 'Unidad cerrada: se avanza.' : p < 70 ? 'Por debajo de 70: repetir la explicación y marcarla para el sábado.' : 'Entre 70 y 89: la unidad no se cierra todavía.';
  out.className = 'regla90 ' + (p === null ? '' : p >= 90 ? 'r-ok' : p < 70 ? 'r-bad' : 'r-warn');
}

/* alCancelar: qué hacer si la hoja se cierra sin Guardar (Cancelar, atrás o Escape) */
function abrirHoja(html, alGuardar, alAbrir, alCancelar) {
  const d = $('#hoja');
  d.innerHTML = `<form method="dialog" class="hoja-form">${html}
    <div class="acciones"><button value="cancelar" class="boton sec" formnovalidate>Cancelar</button><button value="ok" class="boton">Guardar</button></div></form>`;
  const f = $('form', d);
  d.onclose = async () => {
    const ok = d.returnValue === 'ok'; d.returnValue = '';
    if (ok) { await alGuardar(f); render(); } else if (alCancelar) { await alCancelar(); render(); }
  };
  if (alAbrir) alAbrir(f);
  d.showModal();
}

function hojaBloque(f, b, alCancelar) {
  const key = clave(f, b), s = S.ses.get(key);
  const futuro = f > hoy();
  const est = s ? s.estado : 'hecha';
  const form = FORMS[b.tipo];
  const n = semanaDe(f);
  const v = form ? form.cargar([...S.med.values()].filter((m) => m.ref === key), n) : {};
  if (b.tipo === 'murphy' && b.unidad && !v.unidad) v.unidad = b.unidad;
  if (b.tipo === 'listening') { if (!v.fuente) v.fuente = FUENTE_BLOQUE[b.id] || '6ME'; if (!v.metodo) v.metodo = 'dictado'; }
  if (b.tipo === 'writing' && !v.tarea) v.tarea = b.tarea || 'informal';
  const radio = (k, t) => `<label class="pill"><input type="radio" name="estado" value="${k}" ${est === k ? 'checked' : ''}><span>${t}</span></label>`;
  abrirHoja(`<h2 class="hoja-tit">${esc(b.nombre)}</h2><p class="hoja-sub">${esc(detalleDe(b))}${detalleDe(b) ? '. ' : ''}${b.min} min previstos.</p>
    ${futuro ? '<p class="alerta a-info">Día futuro: no se puede registrar todavía.</p>' : `
    <fieldset class="pills">${radio('hecha', 'Hecha')}${radio('parcial', 'Parcial')}${radio('saltada', 'Saltada')}${radio('pendiente', 'Pendiente')}</fieldset>
    <label class="campo"><span>Minutos reales</span><span class="paso"><button type="button" data-paso="-5" aria-label="Restar 5">−5</button>
      <input name="min" type="number" inputmode="numeric" min="0" max="300" value="${s ? s.minReal : b.min}"><button type="button" data-paso="5" aria-label="Sumar 5">+5</button></span></label>
    <label class="campo"><span>Nota (opcional)</span><textarea name="nota" rows="2" placeholder="Qué me costó, error típico, repasar…">${esc(s && s.nota ? s.nota : '')}</textarea></label>
    ${form ? `<h3 class="h3">${form.titulo}</h3>${form.html(v)}` : ''}`}`,
  async (fm) => {
    if (futuro) return;
    const e = fm.estado.value;
    await guardarSesion(f, b, e, Math.max(0, nv(fm.min) ?? b.min), fm.nota ? fm.nota.value : undefined);
    if (form) {
      await guardarMediciones(key, f, e === 'pendiente' ? [] : form.leer(fm));
      if (form.semaforo && e !== 'pendiente') { const x = { semana: n, ...form.semaforo(fm) }; S.sem.set(n, x); await DB.poner('semaforos', x); }
    }
  },
  (fm) => {
    if (futuro) return;
    const minIn = fm.min;
    fm.addEventListener('click', (ev) => { const p = ev.target.dataset.paso; if (p) { minIn.value = Math.max(0, (nv(minIn) ?? 0) + Number(p)); sincEstado(); } });
    const sincEstado = () => {
      const m = nv(minIn) ?? 0, e = fm.estado.value;
      if (e === 'hecha' && m < b.min) fm.estado.value = 'parcial';
      else if (e === 'parcial' && m >= b.min) fm.estado.value = 'hecha';
    };
    minIn.addEventListener('input', sincEstado);
    if (b.tipo === 'murphy') { fm.pct.addEventListener('input', () => regla90(fm)); regla90(fm); }
  }, alCancelar);
}

function hojaMedicion() {
  const tipos = [['listening', 'Listening (episodio suelto)'], ['murphy', 'Murphy (unidad)'], ['speaking', 'Speaking grabado'], ['writing', 'Writing'], ['simulacro', 'Simulacro'], ['muestra', 'Modelo de muestra'], ['anki', 'Retención de Anki']];
  abrirHoja(`<h2 class="hoja-tit">Añadir una medición</h2>
    <label class="campo"><span>Tipo</span><select name="tipo">${tipos.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
    <label class="campo"><span>Fecha</span><input name="fecha" type="date" value="${iso(hoy())}" min="${PLAN.inicioS1}" max="2027-05-02"></label>
    <div class="campos-tipo"></div>`,
  async (fm) => {
    const tipo = fm.tipo.value, lista = FORMS[tipo].leer(fm);
    if (!lista.length || !fm.fecha.value) return;
    await guardarMediciones(`manual:${Date.now()}`, parseISO(fm.fecha.value), lista);
  },
  (fm) => {
    const pintar = () => { $('.campos-tipo', fm).innerHTML = FORMS[fm.tipo.value].html({ fuente: '6ME', metodo: 'dictado', tarea: 'informal' }); if (fm.tipo.value === 'murphy') { fm.pct.addEventListener('input', () => regla90(fm)); regla90(fm); } };
    fm.tipo.addEventListener('change', pintar); pintar();
  });
}

/* ================= Gesto: mantener pulsado ================= */
const HOLD_MS = 600;
function activarTiras() {
  $$('.tira').forEach((el) => {
    let timer = null, x0 = 0, y0 = 0, t0 = 0, completado = false;
    const cancelar = () => { clearTimeout(timer); timer = null; el.classList.remove('cargando'); };
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      if (el.classList.contains('futura') || !el.classList.contains('est-pendiente')) return;
      x0 = e.clientX; y0 = e.clientY; t0 = Date.now(); completado = false;
      el.classList.add('cargando');
      timer = setTimeout(async () => { completado = true; el.classList.remove('cargando'); await completar(el); }, HOLD_MS);
    });
    el.addEventListener('pointermove', (e) => { if (timer && (Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10)) cancelar(); });
    el.addEventListener('pointerup', cancelar);
    el.addEventListener('pointercancel', cancelar);
    el.addEventListener('pointerleave', cancelar);
    el.addEventListener('click', (e) => {
      if (completado) { completado = false; return; }
      if (t0 && Date.now() - t0 > 300) { t0 = 0; return; }
      t0 = 0; tocar(el);
    });
  });
}

async function completar(el) {
  if (navigator.vibrate) navigator.vibrate(15);
  if (el.dataset.s0) { await setAjuste('s0:' + el.dataset.s0, true); render(); toast('Tarea hecha', async () => { await setAjuste('s0:' + el.dataset.s0, null); render(); }); return; }
  const f = S.dia || hoy(), b = bloquesDe(f).find((x) => x.id === el.dataset.b);
  const previa = S.ses.get(clave(f, b)); // para volver atrás si se cancela la hoja
  await guardarSesion(f, b, 'hecha', b.min);
  render();
  if (FORMS[b.tipo] && b.tipo !== 'anki') {
    // Cancelar (o cerrar sin Guardar) deja la ficha como estaba antes de pulsar «Hecha»
    hojaBloque(f, b, async () => {
      if (previa) { S.ses.set(previa.key, previa); await DB.poner('sesiones', previa); } else await guardarSesion(f, b, 'pendiente');
      toast(`${b.nombre}: sin cambios`);
    });
    return;
  }
  toast(`${b.nombre}: ${b.min} min`, async () => { await guardarSesion(f, b, 'pendiente'); render(); });
}
function tocar(el) {
  if (el.dataset.s0) {
    if (S.aj.get('s0:' + el.dataset.s0)) { const id = 's0:' + el.dataset.s0; setAjuste(id, null).then(render); toast('Tarea marcada como pendiente', async () => { await setAjuste(id, true); render(); }); }
    return;
  }
  const f = S.dia || hoy(), b = bloquesDe(f).find((x) => x.id === el.dataset.b);
  hojaBloque(f, b);
}

let toastTimer;
function toast(txt, deshacer) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(txt)}</span>${deshacer ? '<button class="enlace">Deshacer</button>' : ''}`;
  t.classList.add('ver');
  if (deshacer) $('button', t).onclick = () => { t.classList.remove('ver'); deshacer(); };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('ver'), 4000);
}

/* ================= Acciones ================= */
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast('Fila copiada. Pégala en el registro o en el chat.'); }
  catch { abrirHoja(`<h2 class="hoja-tit">Fila del registro</h2><p class="ayuda">No se pudo copiar automáticamente. Selecciona el texto.</p><textarea class="salida" rows="10" readonly>${esc(texto)}</textarea>`, () => {}); }
}

function datosActuales() {
  const ajustes = [...S.aj].filter(([k]) => k !== 'fechaSimulada').map(([k, v]) => ({ k, v }));
  return { app: 'ingles-b1', version: 1, exportado: new Date().toISOString(),
    sesiones: [...S.ses.values()], mediciones: [...S.med.values()], semaforos: [...S.sem.values()], ajustes };
}
function descargar(datos, nombre) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 1)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function exportar() {
  await setAjuste('ultimaExport', iso(hoy()));
  descargar(datosActuales(), `ingles-b1-copia-${iso(hoyReal())}.json`);
  render(); toast('Copia exportada en Descargas');
}

/* Comprueba la copia entera ANTES de tocar nada. Devuelve el texto del problema o null si está bien. */
function problemaCopia(d) {
  if (!d || d.app !== 'ingles-b1') return 'Ese archivo no es una copia de la app. Elige un ingles-b1-copia-….json';
  const fechaOk = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
  for (const [s, clave] of Object.entries(DB.STORES)) {
    if (d[s] !== undefined && !Array.isArray(d[s])) return `La copia está dañada: «${s}» no es una lista.`;
    for (const [i, x] of (d[s] || []).entries()) {
      if (!x || typeof x !== 'object' || x[clave] === undefined || x[clave] === null || x[clave] === '') return `La copia está dañada: el registro ${i + 1} de «${s}» no tiene «${clave}».`;
      if ((s === 'sesiones' || s === 'mediciones') && !fechaOk(x.fecha)) return `La copia está dañada: el registro ${i + 1} de «${s}» tiene una fecha incorrecta.`;
      if (s === 'mediciones' && typeof x.valor !== 'number') return `La copia está dañada: la medición ${i + 1} no tiene un valor numérico.`;
    }
  }
  if (!Array.isArray(d.sesiones)) return 'La copia está dañada: no tiene sesiones.';
  return null;
}
async function importar(file) {
  let d;
  try { d = JSON.parse(await file.text()); } catch { toast('Ese archivo no es una copia de la app. Elige un ingles-b1-copia-….json'); return; }
  const fallo = problemaCopia(d);
  if (fallo) { toast(fallo + ' No se ha cambiado nada.'); return; }
  const fechaCopia = (d.exportado || '').slice(0, 10);
  if (!confirm(`Esto sustituye los datos actuales por la copia del ${fechaCopia}. Antes se descargará una copia de lo que tienes ahora. ¿Continuar?`)) return;
  // Red de seguridad: copia de los datos actuales antes de sustituirlos
  if (S.ses.size || S.med.size) descargar(datosActuales(), `ingles-b1-antes-de-importar-${iso(hoyReal())}.json`);
  d.ajustes = (d.ajustes || []).filter((x) => x.k !== 'fechaSimulada');
  if (!d.ajustes.some((x) => x.k === 'ultimaExport') && fechaCopia) d.ajustes.push({ k: 'ultimaExport', v: fechaCopia });
  try { await DB.reemplazar(d); }
  catch (err) { toast(`No se pudo importar (${err && err.message ? err.message : 'error'}). Tus datos no han cambiado.`); return; }
  S.ses.clear(); S.med.clear(); S.sem.clear(); S.aj.clear();
  await cargar(); S.dia = null; render();
  const fechas = d.sesiones.map((x) => x.fecha).sort();
  const rango = fechas.length ? `, del ${fmtCorta(parseISO(fechas[0]))} al ${fmtCorta(parseISO(fechas.at(-1)))}` : '';
  const tareas = d.ajustes.filter((x) => x.k.startsWith('s0:')).length;
  const notas = d.sesiones.filter((x) => x.nota).length;
  toast(`Copia importada: ${d.sesiones.length} sesiones, ${(d.mediciones || []).length} mediciones${notas ? `, ${notas} notas` : ''}${tareas ? `, ${tareas} tareas de S0` : ''}${rango}.`);
}

document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-acc]');
  if (t) {
    const a = t.dataset.acc;
    if (a === 'dia') {
      const nuevo = addDays(S.dia || hoy(), Number(t.dataset.d));
      if (nuevo >= parseISO(PLAN.inicioS0) && nuevo <= parseISO('2027-05-02')) { S.dia = nuevo; render(); }
    } else if (a === 'dia-hoy') { S.dia = null; render(); }
    else if (a === 'sem') { S.semanaVista = Math.min(30, Math.max(1, (S.semanaVista ?? Math.max(1, semanaActual())) + Number(t.dataset.d))); render(); }
    else if (a === 'ir-semana') { S.semanaVista = Number(t.dataset.n); ir('semana'); }
    else if (a === 'copiar-registro') copiar(filaRegistro(Number(t.dataset.n)));
    else if (a === 'medir') hojaMedicion();
    else if (a === 'foco-hecha' || a === 'foco-anotar') {
      const el = $(`.foco .tira[data-b="${t.dataset.b}"]`);
      if (el) { if (a === 'foco-hecha') await completar(el); else tocar(el); }
    }
    else if (a === 'borrar-med') { if (confirm('¿Borrar esta medición?')) { S.med.delete(t.dataset.id); await DB.borrar('mediciones', t.dataset.id); render(); } }
    else if (a === 'exportar') exportar();
    else if (a === 'fecha-real') { await setAjuste('fechaSimulada', null); S.dia = null; render(); }
    else if (a === 'borrar-todo') {
      if (confirm('¿Borrar todos los datos? Exporta antes una copia si quieres conservarlos.')) {
        for (const s of ['sesiones', 'mediciones', 'semaforos', 'ajustes']) await DB.vaciar(s);
        S.ses.clear(); S.med.clear(); S.sem.clear(); S.aj.clear(); await cargar(); render(); toast('Datos borrados');
      }
    }
    return;
  }
  const tab = e.target.closest('[data-vista]');
  if (tab) { if (tab.dataset.vista === 'semana') S.semanaVista = null; if (tab.dataset.vista === 'hoy') S.dia = null; ir(tab.dataset.vista); }
});
document.addEventListener('change', async (e) => {
  if (e.target.id === 'anki-ret') {
    const n = Number(e.target.dataset.n), v = e.target.value;
    await guardarMediciones(`anki:S${n}`, addDays(inicioSemana(n), 6), v === '' ? [] : [{ tipo: 'anki', valor: Number(v), extra: {} }]);
    toast(v === '' ? 'Retención borrada' : `Retención de S${n}: ${v} %`); render();
  } else if (e.target.id === 'fsim') { await setAjuste('fechaSimulada', e.target.value || null); S.dia = null; render(); }
  else if (e.target.id === 'imp' && e.target.files[0]) importar(e.target.files[0]);
});

/* ================= Render ================= */
const VISTAS = { hoy: vistaHoy, semana: vistaSemana, ruta: vistaRuta, criterios: vistaCriterios, datos: vistaDatos };
function ir(v) { S.vista = v; render(); window.scrollTo(0, 0); }
function render() {
  $('#vista').innerHTML = VISTAS[S.vista]();
  $$('[data-vista]').forEach((b) => b.setAttribute('aria-current', b.dataset.vista === S.vista ? 'page' : 'false'));
  $('#aviso-fecha').hidden = !S.aj.get('fechaSimulada');
  if (S.aj.get('fechaSimulada')) $('#aviso-fecha').textContent = `Fecha de prueba: ${fmtLarga(hoy())}`;
  if (S.vista === 'hoy') {
    activarTiras();
    const d = $('details.hechas'); if (d) d.addEventListener('toggle', () => { S.hechasAbiertas = d.open; });
  }
}

(async () => {
  try { await cargar(); } catch (err) { $('#vista').innerHTML = `<p class="alerta a-rojo">No se pudo abrir el almacenamiento local: ${esc(err.message)}. Comprueba que Chrome no está en modo incógnito.</p>`; return; }
  render();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  // Si la app queda abierta, al cambiar de día se refresca
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();
