# Inglés B1 · PWA de seguimiento

App instalable en Android (versión 1.2, diseño de fichas). Sigue el plan de `02_ruta_aprendizaje_B1_v3.1.md`.
Funciona sin conexión y guarda todo en el móvil. No lee Outlook: el plan va dentro
de la app (`plan.js`) y los recordatorios siguen llegando desde el calendario de Outlook.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Página principal |
| `plan.js` | El plan: 30 semanas y rutina diaria. Si el plan cambia, solo se edita este archivo |
| `db.js` | Guardado local (IndexedDB) |
| `app.js` | Pantallas, alertas, criterios y exportación |
| `styles.css` | Diseño |
| `sw.js` | Funcionamiento sin conexión |
| `manifest.webmanifest` + `icons/` | Nombre e icono al instalarla |

## Publicarla en GitHub Pages (sin terminal)

1. Entra en github.com con tu cuenta y pulsa **New repository**. Nombre: `ingles-b1`. Marca **Public** (Pages gratis lo exige; el repositorio solo contiene el código, no tus datos). Pulsa **Create repository**.
2. En la página del repositorio, pulsa **uploading an existing file**. Descomprime el zip en el ordenador y arrastra **todo el contenido de la carpeta** (incluida la carpeta `icons`). Pulsa **Commit changes**.
3. Ve a **Settings → Pages**. En **Branch** elige `main` y carpeta `/ (root)`. Pulsa **Save**.
4. Espera 1-2 minutos. La dirección será `https://TU-USUARIO.github.io/ingles-b1/`.

## Instalarla en Android

1. Abre esa dirección en **Chrome** del móvil.
2. Menú **⋮ → Instalar aplicación** (o **Añadir a pantalla de inicio**).
3. Ábrela una vez con conexión. A partir de ahí funciona sin red.

## Actualizar la app

1. Sube el archivo cambiado al repositorio (paso 2 de arriba).
2. En `sw.js`, cambia `const VERSION = 'b1-v1';` por `'b1-v2'` (y así sucesivamente) y súbelo también.
3. En el móvil, abre la app dos veces: la primera descarga la versión nueva y la segunda la usa.

Tus datos no se pierden al actualizar.

## Copia de seguridad

Cada domingo, la pantalla Hoy muestra el cierre de la semana con los botones de copiar la fila y exportar la copia. Si pasan 7 días sin copia, el aviso aparece cualquier día. El recordatorio con notificación llega desde Outlook (`recordatorio_copia_domingo.ics`).

Pantalla **Datos → Exportar copia** cada domingo. Si borras los datos de Chrome, desinstalas la app
o cambias de móvil, la copia JSON es lo único que conserva el historial.

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
