# SimTS

SimTS es un simulador pedagogico para la carrera de Trabajo Social.
Genera casos con IA, objetivos de aprendizaje y preguntas abiertas para analisis docente/estudiantil.

## Alcance actual

- Generacion de casos con IA (Gemini por defecto; OpenAI opcional como fallback tecnico).
- Modo de uso pedagogico: no requiere login para el flujo principal.
- Preguntas abiertas para reflexion y discusion.
- Respuestas abiertas del estudiante, sin respuestas modelo ni intervenciones sugeridas visibles.
- Exportacion del caso con respuestas: texto copiable, HTML, PDF e impresion.
- Historial de casos generados y guardados.

## Arquitectura

- Frontend: React + Vite, publicado como sitio estatico en GitHub Pages.
- Backend: FastAPI.
- Persistencia: SQLite.

## Sitio publicado

- Frontend: https://estebancofre-coy.github.io/simts/
- Backend: https://simts.onrender.com
- Despliegue: [Guia de GitHub Pages](DEPLOY-GITHUB-PAGES.md).

El frontend y su logo se alojan en GitHub Pages, sin Vercel ni servicios
externos de almacenamiento. El backend sigue en su servicio actual con sus
claves de IA y base de datos. El script de despliegue publica solamente el
resultado de la compilacion en la rama `gh-pages`, no la documentacion ni el
codigo Python. GitHub Pages sirve esa rama.

## Estructura relevante

- frontend/src/main.jsx: entrada de la app.
- frontend/src/App.jsx: simulador principal UX docente.
- frontend/src/styles.css: sistema visual y layout.
- backend/main.py: endpoints API y generacion con IA.
- backend/db.py: capa de datos SQLite.
- scripts/deploy_pages.sh: compilacion y publicacion del frontend.

## Variables de entorno backend

Crear backend/.env con:

GEMINI_API_KEY=tu-api-key
SIMTS_LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-3-flash-preview

Opcional fallback:

OPENAI_API_KEY=tu-api-key-openai
SIMTS_LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

`OPENAI_MODEL` es opcional y usa `gpt-4o-mini` por defecto. Si lo configuras,
debe contener un modelo compatible con Responses API y disponible para tu
cuenta de OpenAI; no puede quedar vacio. Tambien se usa cuando OpenAI actua
como proveedor alternativo por falta de una clave de Gemini.
En un despliegue existente, aplica estos cambios al backend y reinicia o
redespliega el servicio para cargar la configuracion.

## Ejecucion local

Backend:

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Frontend:

cd frontend
npm install
npm run dev -- --host 0.0.0.0

URLs:

- Frontend: http://localhost:5173
- API health: http://localhost:8000/api/health
- API docs: http://localhost:8000/docs

## API principal

- GET /api/health
- POST /api/simulate
- GET /api/cases
- GET /api/cases/{id}
- POST /api/cases
- PUT /api/cases/{id}
- DELETE /api/cases/{id}

## Flujo recomendado docente

La extension controla las palabras del relato (`description`), no el tamaño de
las preguntas ni del JSON completo:

- Corto: 300-500 palabras.
- Medio (predeterminado): 600-900 palabras.
- Extenso: temporalmente deshabilitado para reducir la carga de IA. El backend
  rechaza estas solicitudes con HTTP 503 antes de llamar al proveedor. Los
  casos extensos ya guardados siguen disponibles para lectura.

El backend solicita antecedentes, evolucion del problema, contexto familiar y
territorial, redes y dilemas de intervencion, sin relleno ni una solucion anticipada.
Comprueba el rango antes de guardar y reintenta una vez si la respuesta no lo
cumple o no contiene un relato valido. Si ambos intentos fallan, devuelve HTTP 502
con un error visible y no guarda el caso. Un `case_length` desconocido devuelve
HTTP 422. La respuesta incluye `metrics.description_words` y
`metrics.generation_attempts` para comprobar el resultado.

La generacion dispone de hasta 16384 tokens de salida tanto en Gemini como en
OpenAI; el frontend espera hasta cinco minutos para permitir el reintento. El
modelo configurado debe admitir ese presupuesto. Los casos ya guardados no se
modifican: genera un caso nuevo para aplicar las nuevas extensiones. Redespliega
backend y frontend para que validacion y etiquetas queden sincronizadas.

1. Configurar parametros del caso.
2. Generar caso nuevo o abrir uno del historial.
3. Trabajar en vista enfocada de tarjeta grande.
4. Escribir respuestas a las preguntas abiertas y sugeridas; el docente media
   las dudas. No se muestran guias de solucion ni intervenciones modelo.
5. Usar **Descargar PDF con respuestas** para obtener el documento directamente,
   o **Imprimir / guardar PDF** para abrir la impresion del navegador y elegir
   Guardar como PDF. Ambas opciones incluyen relato, preguntas y respuestas,
   sin guias de solucion; el PDF pagina automaticamente respuestas largas.

Las respuestas permanecen solo en la memoria del navegador, no se envian al
servidor y se reinician al generar/cambiar de caso o recargar. Descarga el PDF
antes de salir. Copiar y descargar HTML tambien incluyen las respuestas.

## Scripts utiles

- bash scripts/smoke.sh
- bash scripts/stop.sh
- bash scripts/deploy_help.sh

## Notas

- La app esta optimizada para uso pedagogico y apoyo docente.
- Las respuestas abiertas se trabajan localmente en el frontend.
