import os
import logging
import json
import time
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import db as _db

# Carga variables de entorno desde .env en desarrollo
load_dotenv()

logger = logging.getLogger("simts.backend")
logging.basicConfig(level=logging.INFO)


class DummyResponses:
    def create(self, *args, **kwargs):
        raise RuntimeError("Cliente OpenAI no configurado. Establece OPENAI_API_KEY o usa Gemini con GEMINI_API_KEY.")


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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
LLM_PROVIDER = os.getenv("SIMTS_LLM_PROVIDER", "gemini").strip().lower()
client = ClientWrapper(api_key=OPENAI_API_KEY)

app = FastAPI(title="Simulador Trabajo Social - Backend")

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes (simplifica para desarrollo/producción)
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, etc.
    allow_headers=["*"],  # Permite todos los headers
)

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
    llm_provider = get_active_llm_provider()
    return {
        "status": "healthy",
        "service": "simts-backend",
        "db_connected": os.path.exists(DB_PATH),
        "openai_configured": bool(OPENAI_API_KEY),
        "gemini_configured": bool(GEMINI_API_KEY),
        "llm_provider": llm_provider,
        "llm_configured": llm_provider is not None
    }


class SimulateRequest(BaseModel):
    # Si `generate` es True, se generará un caso nuevo según tema y dificultad.
    generate: Optional[bool] = False
    theme: Optional[str] = None
    difficulty: Optional[str] = None  # 'basico'|'intermedio'|'avanzado'
    
    # Nuevos parámetros para mayor control
    age_group: Optional[str] = None  # 'primera_infancia'|'niñez'|'adolescencia'|'adultez'|'adulto_mayor'
    context: Optional[str] = None  # 'urbano'|'rural'|'rural_extremo'
    case_length: Optional[str] = None  # 'corto'|'medio'|'extenso'
    focus_area: Optional[str] = None  # 'derechos_humanos'|'enfoque_genero'|'determinantes_sociales'|'comunitario'|'sistemico_familiar'
    competency: Optional[str] = None  # 'diagnostico_social'|'diseño_intervencion'|'articulacion_redes'|'entrevista_vinculacion'|'evaluacion'

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


def extract_text_from_gemini_response(response_data) -> Optional[str]:
    """Extrae texto de la respuesta REST de Gemini."""
    if not isinstance(response_data, dict):
        return None

    parts = []
    for candidate in response_data.get("candidates", []):
        if not isinstance(candidate, dict):
            continue
        content = candidate.get("content") or {}
        for part in content.get("parts", []):
            if not isinstance(part, dict):
                continue
            text = part.get("text")
            if text:
                parts.append(text)

    if parts:
        return "\n".join(parts)

    return None


def get_active_llm_provider() -> Optional[str]:
    """Resuelve el proveedor activo de LLM con fallback seguro."""
    if LLM_PROVIDER == "openai":
        return "openai" if OPENAI_API_KEY else ("gemini" if GEMINI_API_KEY else None)

    if LLM_PROVIDER == "gemini":
        return "gemini" if GEMINI_API_KEY else ("openai" if OPENAI_API_KEY else None)

    if GEMINI_API_KEY:
        return "gemini"
    if OPENAI_API_KEY:
        return "openai"
    return None


def call_llm(prompt_text: str, expect_json: bool = False):
    """Llama al proveedor configurado y devuelve (texto, raw_response, provider)."""
    provider = get_active_llm_provider()
    if provider == "gemini":
        api_key = GEMINI_API_KEY
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY no configurada")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "temperature": 0.2,
            },
        }
        if expect_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        try:
            response = requests.post(url, params={"key": api_key}, json=payload, timeout=120)
            response.raise_for_status()
            raw = response.json()
        except requests.RequestException as exc:
            logger.exception("Error llamando a Gemini")
            detail = getattr(getattr(exc, "response", None), "text", None) or str(exc)
            raise RuntimeError(f"Error llamando a Gemini: {detail}") from exc

        text = extract_text_from_gemini_response(raw) or ""
        return text, raw, "gemini"

    if provider == "openai":
        try:
            resp = client.responses.create(
                input=prompt_text,
            )
        except Exception as exc:
            logger.exception("Error llamando a OpenAI")
            raise RuntimeError(str(exc)) from exc

        text = extract_text_from_response(resp) or ""
        try:
            raw = resp.to_dict() if hasattr(resp, "to_dict") else getattr(resp, "__dict__", repr(resp))
        except Exception:
            raw = repr(resp)
        return text, raw, "openai"

    raise RuntimeError("No hay proveedor de IA configurado. Define GEMINI_API_KEY o OPENAI_API_KEY.")


def normalize_case_object(case_obj: dict, requested_theme: str, requested_difficulty: str) -> dict:
    """Normaliza la salida del LLM al esquema consumido por el frontend."""
    if not isinstance(case_obj, dict):
        return {}

    title = case_obj.get("title") or case_obj.get("titulo") or case_obj.get("case_id")
    description = case_obj.get("description") or case_obj.get("text") or case_obj.get("relato") or ""
    theme = case_obj.get("eje") or case_obj.get("theme") or case_obj.get("tema") or requested_theme
    difficulty = case_obj.get("nivel") or case_obj.get("difficulty") or requested_difficulty

    if not title:
        if isinstance(description, str) and description.strip():
            title = description.strip().split(".")[0][:80]
        else:
            title = f"Caso {theme}"

    raw_questions = (
        case_obj.get("questions")
        or case_obj.get("preguntas")
        or case_obj.get("preguntas_evaluacion")
        or []
    )
    questions = []
    if isinstance(raw_questions, list):
        for q in raw_questions:
            if not isinstance(q, dict):
                continue
            q_text = q.get("question") or q.get("text") or q.get("pregunta")
            if not q_text:
                continue
            questions.append(
                {
                    "question": q_text,
                    "options": [],
                    "correct_index": None,
                    "justification": q.get("justification") or q.get("explanation") or q.get("justificacion") or q.get("explicacion") or "",
                }
            )

    if not questions:
        questions = [
            {
                "question": "¿Cuáles son los factores de riesgo y de protección más relevantes del caso?",
                "options": [],
                "correct_index": None,
                "justification": "Se espera identificar factores individuales, familiares y comunitarios con enfoque de derechos.",
            },
            {
                "question": "¿Qué red institucional debiera activarse en primera respuesta y por qué?",
                "options": [],
                "correct_index": None,
                "justification": "La respuesta debe articular servicios de salud, educación, municipio y protección social según pertinencia.",
            },
            {
                "question": "Propón un plan de intervención breve con objetivos, acciones y criterios de seguimiento.",
                "options": [],
                "correct_index": None,
                "justification": "La propuesta debe incluir objetivos medibles y coordinación intersectorial.",
            },
        ]

    objectives = (
        case_obj.get("learning_objectives")
        or case_obj.get("checklist")
        or case_obj.get("objetivos_aprendizaje")
        or []
    )
    if not isinstance(objectives, list):
        objectives = []

    suggested_questions = case_obj.get("suggested_questions") or case_obj.get("preguntas_sugeridas") or []
    if not isinstance(suggested_questions, list):
        suggested_questions = []

    suggested_interventions = case_obj.get("suggested_interventions") or case_obj.get("intervenciones_sugeridas") or []
    if not isinstance(suggested_interventions, list):
        suggested_interventions = []

    meta = case_obj.get("meta") or case_obj.get("ficha") or f"Tema: {theme}. Nivel: {difficulty}."

    return {
        "case_id": case_obj.get("case_id") or case_obj.get("id") or title,
        "title": title,
        "eje": theme,
        "nivel": difficulty,
        "meta": meta,
        "description": description,
        "learning_objectives": objectives,
        "questions": questions,
        "suggested_questions": suggested_questions,
        "suggested_interventions": suggested_interventions,
    }


@app.post("/api/simulate")
async def simulate(req: SimulateRequest):
    """Recibe el texto del caso y llama al prompt ID preconfigurado en el servidor.

    Nota: el proveedor de IA se resuelve por `SIMTS_LLM_PROVIDER`.
    """

    # Si solicita generar un caso nuevo, construimos una instrucción clara para el prompt
    if req.generate:
        start_time = time.time()
        
        theme = req.theme or "temas de trabajo social general"
        difficulty = (req.difficulty or "basico").lower()
        
        # MAPEO DE PARÁMETROS FRONTEND -> PROMPT
        # Mapeo de grupo etario
        age_group_map = {
            'primera_infancia': 'primera infancia',
            'niñez': 'niñez',
            'adolescencia': 'adolescencia',
            'adultez': 'adultez',
            'adulto_mayor': 'adulto mayor'
        }
        age_group_str = age_group_map.get(req.age_group, req.age_group) if req.age_group else None
        
        # Mapeo de contexto territorial
        context_map = {
            'urbano': 'urbano',
            'rural': 'rural',
            'rural_extremo': 'rural extremo'
        }
        context_str = context_map.get(req.context, req.context) if req.context else None
        
        # Mapeo de enfoque principal
        focus_map = {
            'derechos_humanos': 'derechos humanos',
            'enfoque_genero': 'enfoque de género',
            'determinantes_sociales': 'determinantes sociales',
            'comunitario': 'comunitario',
            'sistemico_familiar': 'sistémico familiar'
        }
        focus_str = focus_map.get(req.focus_area, req.focus_area) if req.focus_area else None
        
        # Mapeo de competencia objetivo
        competency_map = {
            'diagnostico_social': 'diagnóstico social',
            'diseño_intervencion': 'diseño de intervención',
            'articulacion_redes': 'articulación de redes',
            'entrevista_vinculacion': 'entrevista/vinculación',
            'evaluacion': 'evaluación'
        }
        competency_str = competency_map.get(req.competency, req.competency) if req.competency else None
        
        # Mapeo de nivel de dificultad
        difficulty_map = {
            'basico': 'bajo',
            'intermedio': 'medio',
            'avanzado': 'alto'
        }
        difficulty_prompt = difficulty_map.get(difficulty, difficulty)
        
        # Construir instrucción para el prompt con los parámetros
        prompt_input = f"Genera un caso con los siguientes parámetros:\n\n"
        prompt_input += f"- eje: {theme}\n"
        prompt_input += f"- nivel: {difficulty_prompt}\n"
        
        if age_group_str:
            prompt_input += f"- grupoEtario: {age_group_str}\n"
        
        if context_str:
            prompt_input += f"- tipoTerritorio: {context_str}\n"
        
        if focus_str:
            prompt_input += f"- enfoquePrincipal: {focus_str}\n"
        
        if competency_str:
            prompt_input += f"- competenciaObjetivo: {competency_str}\n"
        
        # Extensión del caso
        case_length = req.case_length or 'medio'
        length_map = {
            'corto': '4 párrafos',
            'medio': '5 párrafos',
            'extenso': '6 párrafos'
        }
        prompt_input += f"\nUsa {length_map.get(case_length, '5 párrafos')} para el relato.\n"
        prompt_input += """

Devuelve SOLO JSON válido (sin markdown) con este esquema exacto:
{
    "case_id": "string",
    "title": "string",
    "eje": "string",
    "nivel": "bajo|medio|alto",
    "meta": "string",
    "description": "string",
    "learning_objectives": ["string", "string"],
    "questions": [
        {
            "question": "string",
            "options": [],
            "correct_index": null,
            "justification": "string"
        }
    ],
    "suggested_questions": ["string"],
    "suggested_interventions": ["string"]
}

Reglas:
- Incluye entre 4 y 6 preguntas en total.
- Todas las preguntas deben ser abiertas.
- Usa siempre options = [] y correct_index = null.
- Asegura coherencia entre relato, objetivos y preguntas.
- No agregues texto fuera del JSON.
"""
        
        api_start = time.time()
        try:
            text, raw, provider = call_llm(prompt_input, expect_json=True)
        except Exception as e:
            logger.exception("Error llamando a Gemini para generar caso")
            raise HTTPException(status_code=500, detail=str(e))
        
        api_time = time.time() - api_start
        logger.info(f"{provider.capitalize()} API call took {api_time:.2f}s")

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

        if case_obj:
            case_obj = normalize_case_object(case_obj, requested_theme=theme, requested_difficulty=difficulty_prompt)

        # Guardar automáticamente el caso si pudimos parsear un objeto
        saved = None
        if case_obj:
            try:
                saved = _db.save_case(DB_PATH, case_obj)
            except Exception:
                logger.exception("Error guardando caso en DB")

        total_time = time.time() - start_time
        logger.info(f"Total generation time: {total_time:.2f}s (API: {api_time:.2f}s, Processing: {total_time - api_time:.2f}s)")
        
        return {
            "ok": True, 
            "case": case_obj, 
            "saved": saved, 
            "text": text, 
            "raw_response": raw,
            "provider": provider,
            "metrics": {
                "total_time": round(total_time, 2),
                "api_time": round(api_time, 2),
                "processing_time": round(total_time - api_time, 2)
            }
        }

    # Si llega texto libre para analizar
    if req.case_text:
        try:
            text, raw, provider = call_llm(req.case_text)
        except Exception as e:
            logger.exception("Error llamando a Gemini")
            raise HTTPException(status_code=500, detail=str(e))

        return {"ok": True, "text": text, "raw_response": raw, "provider": provider}

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
async def list_cases_endpoint(theme: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 50, status: Optional[str] = None, created_by: Optional[int] = None):
    try:
        items = _db.list_cases(DB_PATH, theme=theme, difficulty=difficulty, limit=limit, status=status, created_by=created_by)
    except Exception as e:
        logger.exception("Error leyendo casos de DB")
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True, "cases": items}


@app.get("/api/cases/{case_id}")
async def get_case_endpoint(case_id: int):
    """Obtiene un caso específico por ID."""
    try:
        case = _db.get_case(DB_PATH, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")
        return {"ok": True, "case": case}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error obteniendo caso")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/cases/{case_id}")
async def update_case_endpoint(case_id: int, updates: dict):
    """Actualiza un caso existente."""
    try:
        updated = _db.update_case(DB_PATH, case_id, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Caso no encontrado")
        return {"ok": True, "case": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error actualizando caso")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/cases/{case_id}")
async def delete_case_endpoint(case_id: int):
    """Elimina un caso (soft delete)."""
    try:
        deleted = _db.delete_case(DB_PATH, case_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Caso no encontrado")
        return {"ok": True, "message": "Caso eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error eliminando caso")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/statistics")
async def get_statistics_endpoint():
    """Obtiene estadísticas de los casos para el panel de docentes."""
    try:
        stats = _db.get_statistics(DB_PATH)
        return {"ok": True, "statistics": stats}
    except Exception as e:
        logger.exception("Error obteniendo estadísticas")
        raise HTTPException(status_code=500, detail=str(e))


# ===== Endpoints de Colecciones =====

@app.post("/api/collections")
async def create_collection_endpoint(data: dict):
    """Crea una nueva colección."""
    try:
        name = data.get("name")
        description = data.get("description", "")
        if not name:
            raise HTTPException(status_code=400, detail="El nombre es requerido")
        collection = _db.create_collection(DB_PATH, name, description)
        return {"ok": True, "collection": collection}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error creando colección")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/collections")
async def list_collections_endpoint():
    """Lista todas las colecciones."""
    try:
        collections = _db.list_collections(DB_PATH)
        return {"ok": True, "collections": collections}
    except Exception as e:
        logger.exception("Error listando colecciones")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/collections/{collection_id}")
async def get_collection_endpoint(collection_id: int):
    """Obtiene una colección con sus casos."""
    try:
        collection = _db.get_collection(DB_PATH, collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Colección no encontrada")
        return {"ok": True, "collection": collection}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error obteniendo colección")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/collections/{collection_id}")
async def update_collection_endpoint(collection_id: int, data: dict):
    """Actualiza una colección."""
    try:
        name = data.get("name")
        description = data.get("description")
        collection = _db.update_collection(DB_PATH, collection_id, name, description)
        if not collection:
            raise HTTPException(status_code=404, detail="Colección no encontrada")
        return {"ok": True, "collection": collection}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error actualizando colección")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/collections/{collection_id}")
async def delete_collection_endpoint(collection_id: int):
    """Elimina una colección."""
    try:
        deleted = _db.delete_collection(DB_PATH, collection_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Colección no encontrada")
        return {"ok": True, "message": "Colección eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error eliminando colección")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/collections/{collection_id}/cases/{case_id}")
async def add_case_to_collection_endpoint(collection_id: int, case_id: int):
    """Agrega un caso a una colección."""
    try:
        added = _db.add_case_to_collection(DB_PATH, collection_id, case_id)
        if not added:
            raise HTTPException(status_code=400, detail="El caso ya está en la colección o no existe")
        return {"ok": True, "message": "Caso agregado a la colección"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error agregando caso a colección")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/collections/{collection_id}/cases/{case_id}")
async def remove_case_from_collection_endpoint(collection_id: int, case_id: int):
    """Remueve un caso de una colección."""
    try:
        removed = _db.remove_case_from_collection(DB_PATH, collection_id, case_id)
        if not removed:
            raise HTTPException(status_code=404, detail="Caso no encontrado en la colección")
        return {"ok": True, "message": "Caso removido de la colección"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error removiendo caso de colección")
        raise HTTPException(status_code=500, detail=str(e))





class LoginRequest(BaseModel):
    username: str
    password: str


class SubmitAnswersRequest(BaseModel):
    case_id: int
    answers: list  # [{"question_index": 0, "selected_option": 1, "open_answer": "texto"}]
    duration_seconds: Optional[int] = None


class FeedbackRequest(BaseModel):
    feedback: str
    score: Optional[float] = None


@app.post("/api/auth/login")
async def student_login(req: LoginRequest):
    """Login para estudiantes."""
    try:
        student = _db.authenticate_student(DB_PATH, req.username, req.password)
        if not student:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        return {"ok": True, "student": student, "token": f"student-{student['id']}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error en login de estudiante")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/answers")
async def submit_answers(req: SubmitAnswersRequest):
    """Estudiante envía sus respuestas para un caso. Requiere autenticación."""
    try:
        student_id = 1  # TODO: extraer de token
        session_id = _db.create_session(DB_PATH, student_id, req.case_id)
        
        case = _db.get_case(DB_PATH, req.case_id)
        questions = case.get("payload", {}).get("questions", []) if case else []
        
        score = 0
        total = 0
        
        for ans in req.answers:
            q_idx = ans.get("question_index")
            selected = ans.get("selected_option")
            open_ans = ans.get("open_answer")
            
            is_correct = None
            if selected is not None and q_idx < len(questions):
                q = questions[q_idx]
                correct_idx = q.get("correct_index") or q.get("correctIndex")
                if correct_idx is not None:
                    total += 1
                    is_correct = 1 if selected == correct_idx else 0
                    if is_correct:
                        score += 1
            
            _db.save_answer(DB_PATH, session_id, q_idx, selected, open_ans, is_correct)
        
        _db.submit_session(DB_PATH, session_id, req.duration_seconds)
        
        return {
            "ok": True, 
            "session_id": session_id, 
            "score": score,
            "total": total,
            "message": "Respuestas enviadas exitosamente"
        }
    except Exception as e:
        logger.exception("Error guardando respuestas")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/answers")
async def get_answers(student_id: Optional[int] = None, case_id: Optional[int] = None, session_id: Optional[int] = None, limit: int = 100):
    """Obtiene respuestas (para docentes o estudiante propio)."""
    try:
        # Obtener todas las sesiones con filtros básicos
        sessions = _db.get_student_sessions(DB_PATH, student_id=student_id, case_id=case_id, limit=limit)
        
        # Si se solicita una sesión específica, filtrar
        if session_id:
            sessions = [s for s in sessions if s.get("session_id") == session_id]
        
        for sess in sessions:
            # Obtener respuestas de la sesión
            answers = _db.get_session_answers(DB_PATH, sess["session_id"])
            
            # Enriquecer respuestas con información del caso
            case = _db.get_case(DB_PATH, sess["case_id"]) if sess.get("case_id") else None
            questions = case.get("payload", {}).get("questions", []) if case else []
            
            enriched_answers = []
            for answer in answers:
                q_idx = answer["question_index"]
                if q_idx < len(questions):
                    question = questions[q_idx]
                    
                    # Determinar tipo de pregunta
                    is_open = not question.get("options") or len(question.get("options", [])) == 0
                    
                    enriched = {
                        **answer,
                        "question_text": question.get("question") or question.get("text", f"Pregunta {q_idx + 1}"),
                        "answer_type": "open" if is_open else "multiple_choice"
                    }
                    
                    # Si es múltiple opción, agregar la opción seleccionada y la correcta
                    if not is_open:
                        options = question.get("options", [])
                        selected_idx = answer.get("selected_option")
                        
                        if selected_idx is not None and selected_idx < len(options):
                            enriched["student_answer"] = options[selected_idx]
                        else:
                            enriched["student_answer"] = None
                        
                        # Obtener respuesta correcta
                        correct_idx = question.get("correct_index") or question.get("correctIndex")
                        if correct_idx is not None and correct_idx < len(options):
                            enriched["correct_answer"] = options[correct_idx]
                        
                        # Agregar todas las opciones para referencia
                        enriched["options"] = options
                    else:
                        # Para preguntas abiertas, usar el texto guardado
                        enriched["student_answer"] = answer.get("open_answer")
                    
                    enriched_answers.append(enriched)
            
            sess["answers"] = enriched_answers
            
        return {"ok": True, "sessions": sessions}
    except Exception as e:
        logger.exception("Error obteniendo respuestas")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/answers/{answer_id}/feedback")
async def update_feedback(answer_id: int, req: FeedbackRequest):
    """Docente agrega feedback y score a una respuesta."""
    try:
        updated = _db.update_answer_feedback(DB_PATH, answer_id, req.feedback, req.score)
        if not updated:
            raise HTTPException(status_code=404, detail="Respuesta no encontrada")
        return {"ok": True, "message": "Feedback actualizado"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error actualizando feedback")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/students")
async def list_students():
    """Lista estudiantes (para panel docente)."""
    try:
        students = _db.list_students(DB_PATH)
        return {"ok": True, "students": students}
    except Exception as e:
        logger.exception("Error listando estudiantes")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))