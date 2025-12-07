import os
import logging
import json
import time
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


@app.post("/api/simulate")
async def simulate(req: SimulateRequest):
    """Recibe el texto del caso y llama al prompt ID preconfigurado en el servidor.

    Nota: el `prompt id` está incrustado aquí según lo provisto; si querés usar
    diferentes prompts por caso, pasalos en `options`.
    """

    PROMPT_ID = "pmpt_692bbe09d0b481968c7281d521eb16760a51d9f0c77edf52"

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
        prompt_input += "\nResponde únicamente con el JSON especificado en tu configuración, sin texto adicional."
        
        api_start = time.time()
        try:
            resp = client.responses.create(
                prompt={"id": PROMPT_ID, "version": "3"},
                input=prompt_input,
            )
        except Exception as e:
            logger.exception("Error llamando a OpenAI para generar caso")
            raise HTTPException(status_code=500, detail=str(e))
        
        api_time = time.time() - api_start
        logger.info(f"OpenAI API call took {api_time:.2f}s")

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

        total_time = time.time() - start_time
        logger.info(f"Total generation time: {total_time:.2f}s (API: {api_time:.2f}s, Processing: {total_time - api_time:.2f}s)")
        
        return {
            "ok": True, 
            "case": case_obj, 
            "saved": saved, 
            "text": text, 
            "raw_response": raw,
            "metrics": {
                "total_time": round(total_time, 2),
                "api_time": round(api_time, 2),
                "processing_time": round(total_time - api_time, 2)
            }
        }

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
async def list_cases_endpoint(theme: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 50, status: Optional[str] = None):
    try:
        items = _db.list_cases(DB_PATH, theme=theme, difficulty=difficulty, limit=limit, status=status)
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
async def get_answers(student_id: Optional[int] = None, case_id: Optional[int] = None, limit: int = 100):
    """Obtiene respuestas (para docentes o estudiante propio)."""
    try:
        sessions = _db.get_student_sessions(DB_PATH, student_id=student_id, case_id=case_id, limit=limit)
        for sess in sessions:
            sess["answers"] = _db.get_session_answers(DB_PATH, sess["session_id"])
        return {"ok": True, "sessions": sessions}
    except Exception as e:
        logger.exception("Error obteniendo respuestas")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/answers/{answer_id}/feedback")
async def update_feedback(answer_id: int, feedback: str, score: Optional[float] = None):
    """Docente agrega feedback y score a una respuesta."""
    try:
        updated = _db.update_answer_feedback(DB_PATH, answer_id, feedback, score)
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