import os
import logging
import json
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import db as _db

# Carga variables de entorno desde .env en desarrollo
load_dotenv()

logger = logging.getLogger("simts.backend")
logging.basicConfig(level=logging.INFO)


class DummyResponses:
    def create(self, *args, **kwargs):
        raise RuntimeError("OPENAI_API_KEY no configurada. Establece la variable de entorno OPENAI_API_KEY o mokea 'client.responses.create' en tests.")


class ClientWrapper:
    def __init__(self, api_key: Optional[str] = None):
        self._client = None
        if api_key:
            # Import tardío para evitar errores en imports de test cuando no hay clave
            from openai import OpenAI as OpenAILib

            self._client = OpenAILib(api_key=api_key)
            # La API moderna de openai presenta un atributo `responses`
            self.responses = getattr(self._client, "responses", None)
            if self.responses is None:
                # Fallback a objeto con create para compatibilidad
                self.responses = DummyResponses()
        else:
            self.responses = DummyResponses()


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = ClientWrapper(api_key=OPENAI_API_KEY)

app = FastAPI(title="Simulador Trabajo Social - Backend")

# Inicializar DB de persistencia
DB_PATH = os.getenv("SIMTS_DB_PATH") or os.path.join(os.path.dirname(__file__), "cases.db")
try:
    _db.init_db(DB_PATH)
    logger.info(f"DB inicializada en {DB_PATH}")
except Exception:
    logger.exception("No se pudo inicializar la base de datos")


@app.get("/")
async def root():
    """Endpoint raíz - redirige a documentación."""
    return {
        "message": "SimTS Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": {
            "health_check": "/api/health",
            "simulate": "/api/simulate",
            "list_cases": "/api/cases",
            "save_case": "/api/cases"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint para verificar que el backend está funcionando."""
    return {
        "status": "healthy",
        "service": "simts-backend",
        "db_connected": os.path.exists(DB_PATH),
        "openai_configured": bool(OPENAI_API_KEY)
    }


class SimulateRequest(BaseModel):
    # Si `generate` es True, se generará un caso nuevo según tema y dificultad.
    generate: Optional[bool] = False
    theme: Optional[str] = None
    difficulty: Optional[str] = None  # 'basico'|'intermedio'|'avanzado'

    # Alternativamente, si se provee `case_text`, se puede usar para analizar/consultar.
    case_id: Optional[str] = None
    case_text: Optional[str] = None
    student_id: Optional[str] = None
    options: dict = {}


def extract_text_from_response(response) -> Optional[str]:
    """Intento conservador de extraer texto desde la estructura que devuelve Responses API."""
    try:
        if hasattr(response, "to_dict"):
            resp_dict = response.to_dict()
        else:
            resp_dict = getattr(response, "__dict__", {})
    except Exception:
        resp_dict = {}

    # Busca una estructura común: {'output': [ {'content': [{'text': '...'}]} ] }
    if isinstance(resp_dict, dict):
        out = resp_dict.get("output")
        if isinstance(out, list):
            parts = []
            for item in out:
                if not isinstance(item, dict):
                    continue
                for content in item.get("content", []):
                    if not isinstance(content, dict):
                        continue
                    t = content.get("text") or content.get("message")
                    if t:
                        parts.append(t)
            if parts:
                return "\n".join(parts)

    # Fallback: si response tiene atributo 'output_text' u 'output', intentarlo
    if hasattr(response, "output_text"):
        return getattr(response, "output_text")

    return None


@app.post("/api/simulate")
async def simulate(req: SimulateRequest):
    """Recibe el texto del caso y llama al prompt ID preconfigurado en el servidor.

    Nota: el `prompt id` está incrustado aquí según lo provisto; si querés usar
    diferentes prompts por caso, pasalos en `options`.
    """

    PROMPT_ID = "pmpt_692bbe09d0b481968c7281d521eb16760a51d9f0c77edf52"

    # Si solicita generar un caso nuevo, construimos una instrucción clara para el prompt
    if req.generate:
        theme = req.theme or "temas de trabajo social general"
        difficulty = (req.difficulty or "basico").lower()
        prompt_input = (
            f"Genera un caso clínico educativo para estudiantes de Trabajo Social. "
            f"Tema: {theme}. Nivel de dificultad: {difficulty}.\n"
            "Entrega la respuesta estrictamente en JSON con las siguientes claves: "
            "'case_id' (string corto), 'title' (string), 'description' (texto del caso), "
            "'learning_objectives' (array de strings), 'suggested_questions' (array de strings), "
            "'suggested_interventions' (array de strings).\n"
            "No incluyas texto adicional fuera del JSON."
        )
        try:
            resp = client.responses.create(
                prompt={"id": PROMPT_ID, "version": "3"},
                input=prompt_input,
            )
        except Exception as e:
            logger.exception("Error llamando a OpenAI para generar caso")
            raise HTTPException(status_code=500, detail=str(e))

        text = extract_text_from_response(resp) or ""
        # Intentamos parsear JSON del texto retornado
        case_obj = None
        try:
            case_obj = json.loads(text)
        except Exception:
            # si no está en formato JSON exacto, intentamos buscar el primer bloque JSON
            try:
                start = text.index('{')
                end = text.rindex('}')
                candidate = text[start:end+1]
                case_obj = json.loads(candidate)
            except Exception:
                case_obj = None

        try:
            raw = resp.to_dict() if hasattr(resp, "to_dict") else getattr(resp, "__dict__", repr(resp))
        except Exception:
            raw = repr(resp)

        # Guardar automáticamente el caso si pudimos parsear un objeto
        saved = None
        if case_obj:
            try:
                saved = _db.save_case(DB_PATH, case_obj)
            except Exception:
                logger.exception("Error guardando caso en DB")

        return {"ok": True, "case": case_obj, "saved": saved, "text": text, "raw_response": raw}

    # Si llega texto libre para analizar
    if req.case_text:
        try:
            resp = client.responses.create(
                prompt={"id": PROMPT_ID, "version": "3"},
                input=req.case_text,
            )
        except Exception as e:
            logger.exception("Error llamando a OpenAI")
            raise HTTPException(status_code=500, detail=str(e))

        text = extract_text_from_response(resp)
        try:
            raw = resp.to_dict() if hasattr(resp, "to_dict") else getattr(resp, "__dict__", repr(resp))
        except Exception:
            raw = repr(resp)

        return {"ok": True, "text": text, "raw_response": raw}

    raise HTTPException(status_code=400, detail="Petición inválida: enviar 'generate' o 'case_text'.")


@app.post("/api/cases")
async def save_case_endpoint(case: dict):
    """Guarda un case object JSON enviado por el cliente."""
    try:
        saved = _db.save_case(DB_PATH, case)
    except Exception as e:
        logger.exception("Error guardando caso desde endpoint")
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True, "saved": saved}


@app.get("/api/cases")
async def list_cases_endpoint(theme: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 50):
    try:
        items = _db.list_cases(DB_PATH, theme=theme, difficulty=difficulty, limit=limit)
    except Exception as e:
        logger.exception("Error leyendo casos de DB")
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True, "cases": items}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
