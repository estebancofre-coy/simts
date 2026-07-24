# SimTS

SimTS es un simulador pedagogico para la carrera de Trabajo Social.
Genera casos con IA, objetivos de aprendizaje y preguntas abiertas para analisis docente/estudiantil.

## Alcance actual

- Generacion de casos con IA (Gemini por defecto; OpenAI opcional y Ollama local como alternativa experimental).
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

GEMINI_API_KEY=tu-api-key-gemini
SIMTS_LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-3-flash-preview

Opcional fallback OpenAI:

OPENAI_API_KEY=tu-api-key-openai
OPENAI_MODEL=gpt-4o-mini

Ollama local experimental:

OPENAI_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_BASE_URL=http://127.0.0.1:11434
OPENAI_API_KEY=ollama
OPENAI_MODEL=llama3.2:3b
OLLAMA_MODEL=llama3.2:3b

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
