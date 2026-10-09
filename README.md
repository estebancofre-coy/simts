# SimTS

SimTS es un simulador pedagogico para la carrera de Trabajo Social.
Genera casos con IA, objetivos de aprendizaje y preguntas abiertas para analisis docente/estudiantil.

## Alcance actual

- Generacion de casos con IA (Gemini por defecto; OpenAI opcional como fallback tecnico).
- Modo de uso pedagogico: no requiere login para el flujo principal.
- Preguntas abiertas para reflexion y discusion.
- Exportacion del caso en formato copiable y descargable en HTML.
- Historial de casos generados y guardados.

## Arquitectura

- Frontend: React + Vite.
- Backend: FastAPI.
- Persistencia: SQLite.

## Estructura relevante

- frontend/src/main.jsx: entrada de la app.
- frontend/src/App.jsx: simulador principal UX docente.
- frontend/src/styles.css: sistema visual y layout.
- backend/main.py: endpoints API y generacion con IA.
- backend/db.py: capa de datos SQLite.

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
- Extenso: 1200-1600 palabras.

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
4. Copiar salida o descargar HTML para clase y material.

## Scripts utiles

- bash scripts/smoke.sh
- bash scripts/stop.sh
- bash scripts/deploy_help.sh

## Notas

- La app esta optimizada para uso pedagogico y apoyo docente.
- Las respuestas abiertas se trabajan localmente en el frontend.
