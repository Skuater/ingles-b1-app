# Inglés B1 · PWA de seguimiento

App instalable en Android (versión 1.7.1, diseño de fichas con «ficha en mano»). Sigue el plan de `02_ruta_aprendizaje_B1_v3.2.md`.
Funciona sin conexión y guarda todo en el móvil. No lee Outlook: el plan va dentro
de la app (`plan.js`) y los recordatorios siguen llegando desde el calendario de Outlook.

Dirección: https://skuater.github.io/ingles-b1-app/ · Repositorio: `Skuater/ingles-b1-app`

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Página principal y aviso de versión nueva |
| `plan.js` | El plan: 30 semanas, unidades de Murphy, paquetes de speaking, writing y ajustes de un día. Si el plan cambia, se edita sobre todo este archivo |
| `db.js` | Guardado local (IndexedDB) |
| `app.js` | Pantallas, alertas, criterios, notas, importación y exportación |
| `styles.css` | Diseño |
| `sw.js` | Funcionamiento sin conexión y actualizaciones |
| `manifest.webmanifest` + `icons/` | Nombre e icono al instalarla |
| `recordatorio_copia_domingo.ics` | Recordatorio semanal de la copia, para Outlook |

## Actualizar la app

1. Cambia los archivos en el repositorio (subiéndolos en GitHub o pidiéndoselo a Claude).
2. En `sw.js`, sube `const VERSION = 'b1-v11';` a `'b1-v12'` (y así sucesivamente). En `app.js`, actualiza el texto de versión de la pantalla Datos.
3. En el móvil, al abrir la app aparece **«Hay una versión nueva · Actualizar»**. Púlsalo y se recarga con la versión nueva.

Tus datos no se pierden al actualizar. Cada versión guarda todos sus archivos juntos: nunca se mezcla un archivo nuevo con uno antiguo.

## Copia de seguridad

Cada domingo, la pantalla Hoy muestra el cierre de la semana con los botones de copiar la fila y exportar la copia. Si pasan 7 días sin copia, el aviso aparece cualquier día. El recordatorio llega desde Outlook (`recordatorio_copia_domingo.ics`).

**Importar una copia es seguro:**
- La app comprueba el archivo entero antes de tocar nada. Si está dañado, lo dice y no cambia nada.
- Antes de sustituir, descarga una copia de lo que tienes ahora (`ingles-b1-antes-de-importar-….json`).
- La sustitución se hace de una sola vez: si algo falla a mitad, los datos anteriores siguen intactos.

## Cómo se mide cada destreza (plan v3.2)

| Destreza | Medición | Cuenta para la puerta |
| --- | --- | --- |
| Listening | Dictado de 3 frases tras la escucha en frío (% de palabras bien escritas) o preguntas de comprensión (% de aciertos) | Solo 6 Minute English y mini-diagnóstico, con dictado (≥ 80 %) o preguntas (≥ 70 %), 3 seguidos. La estimación a ojo se guarda pero no cuenta |
| Speaking | Parte 4 del examen (30 s + 1,5 min), pausas, errores y situaciones de rol resueltas | Monólogo ≥ 90 s, 0 pausas de más de 5 s, ≤ 3 errores, 3 de 3 situaciones |
| Writing | Tarea formal (70-100), informal (100-120) o las 2 del examen seguidas | Las 2 en ≤ 45 min, ≥ 4 conectores, ≤ 5 errores cada una |
| Reading y listening de examen | Simulacro desde S20 | Los modelos de muestra de S9 y S15 se guardan aparte y no cuentan |

## Notas por sesión

Al tocar una ficha se puede escribir una nota (qué costó, un error típico, algo que repasar). Se ve en la ficha con 📝, se conserva al cambiar minutos o estado y aparece en la fila del registro.

## Ajustes de un día

Las recuperaciones puntuales se añaden en `AJUSTES_DIA`, al final de `plan.js`: bloques extra o cambios en un día concreto, sin tocar el resto del plan.

## Supuestos que no están en el plan (ajustables en `plan.js` o `app.js`)

| Supuesto | Valor usado |
| --- | --- |
| Domingo de mini-diagnóstico | Domingo normal + 30 min extra de mini-diagnóstico (semana de 630 min) |
| Sábado desde S22 | Anki 10 + simulacro 155 min (el plan dice "hasta 2 h 45") |
| Domingo desde S22 | Anki 10 + listening largo 45 + corrección en frío 20 |
| Descargas (S7, S13, S19) y S29-S30 | Anki 10 diario + listening pasivo 15-20 min (≈3 h) |
| Día "caído" (sábado o domingo) | Menos del 50 % de los minutos previstos |
| Alerta de reparto | Desviación de más de 5 puntos respecto al previsto de esa semana |
| Criterio Murphy (soporte) | Media de las últimas 5 unidades medidas ≥ 80 % |
| Alerta de fatiga | 3 días seguidos sin ningún minuto registrado |
| Umbrales de listening | Provisionales: se recalibran en el mini-diagnóstico 1 (S3) con los primeros datos |

## Historial de versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 1.7.1 (b1-v11) | 18 oct 2026 | Corrección: si tras «Hecha» o la pulsación larga se cancela la hoja (Cancelar, atrás o Escape), la ficha vuelve a como estaba. Guardar la deja hecha |
| 1.7 (b1-v10) | 18 oct 2026 | Modelo 3 «Ficha en mano»: en Hoy, la ficha que toca sale grande con los botones «Hecha» y «Anotar resultado», después va la cola y las hechas se pliegan en una línea. Ruta en 30 filas verticales por fase, con las horas en la misma fila. Cabecera de Hoy en una línea. Copia de la 1.6 en la rama `copia-v1.6-antes-rediseno` |
| 1.6 (b1-v9) | 18 oct 2026 | Recupera notas, racha de Anki, resumen de hoy, tendencias y resumen global (perdidos el 8 oct). Listening medido con dictado o preguntas. Criterios con el formato real del examen. Gramática B1 completa. Importación segura. Aviso de versión nueva |
| 1.5 (b1-v8) | 18 oct 2026 | Unidad de Murphy por día y recuperación de S2 |
| 1.5 (b1-v7) | 8 oct 2026 | Reparto comparado con lo previsto a fecha de hoy; segundo episodio de listening |
| 1.4 (b1-v6) | 2 oct 2026 | Notas, racha de Anki, tendencias |
