import sqlite3
import json
import os
from typing import Optional, List, Dict
from datetime import datetime


def init_db(db_path: str):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Tabla de casos
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT,
        title TEXT,
        theme TEXT,
        difficulty TEXT,
        payload TEXT,
        created_at TEXT,
        updated_at TEXT,
        status TEXT DEFAULT 'active',
        rating INTEGER DEFAULT 0,
        tags TEXT,
        notes TEXT
    )
    """)
    
    # Tabla de colecciones
    cur.execute("""
    CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT,
        updated_at TEXT,
        status TEXT DEFAULT 'active'
    )
    """)
    
    # Tabla de relación casos-colecciones (muchos a muchos)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS collection_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL,
        case_id INTEGER NOT NULL,
        added_at TEXT,
        FOREIGN KEY (collection_id) REFERENCES collections(id),
        FOREIGN KEY (case_id) REFERENCES cases(id),
        UNIQUE(collection_id, case_id)
    )
    """)
    
    # Tabla de estudiantes
    cur.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        email TEXT,
        created_at TEXT,
        status TEXT DEFAULT 'active'
    )
    """)
    
    # Tabla de sesiones de estudiantes (cada vez que trabajan con un caso)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS student_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        case_id INTEGER NOT NULL,
        created_at TEXT,
        submitted_at TEXT,
        duration_seconds INTEGER,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (case_id) REFERENCES cases(id)
    )
    """)
    
    # Tabla de respuestas (alternativas y abiertas)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS student_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        question_index INTEGER NOT NULL,
        selected_option INTEGER,
        open_answer TEXT,
        is_correct INTEGER,
        feedback TEXT,
        score REAL,
        created_at TEXT,
        FOREIGN KEY (session_id) REFERENCES student_sessions(id)
    )
    """)
    
    # Migración: agregar columnas si no existen
    try:
        cur.execute("ALTER TABLE cases ADD COLUMN updated_at TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cur.execute("ALTER TABLE cases ADD COLUMN status TEXT DEFAULT 'active'")
    except sqlite3.OperationalError:
        pass
    try:
        cur.execute("ALTER TABLE cases ADD COLUMN rating INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    try:
        cur.execute("ALTER TABLE cases ADD COLUMN tags TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cur.execute("ALTER TABLE cases ADD COLUMN notes TEXT")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    
    # Insertar estudiante de prueba si no existe
    cur.execute("SELECT COUNT(*) FROM students WHERE username = ?", ("estudiante1",))
    if cur.fetchone()[0] == 0:
        # Password hash simple para demo (en producción usar bcrypt)
        import hashlib
        pw_hash = hashlib.sha256("pass".encode()).hexdigest()
        cur.execute(
            "INSERT INTO students (username, password_hash, name, created_at, status) VALUES (?, ?, ?, ?, ?)",
            ("estudiante1", pw_hash, "Estudiante Demo", datetime.utcnow().isoformat(), "active")
        )
        conn.commit()
    
    conn.close()


def _connect(db_path: str):
    return sqlite3.connect(db_path)


def save_case(db_path: str, case_obj: Dict) -> Dict:
    """Guarda el case_obj (dict) como JSON en la DB y devuelve el registro guardado."""
    conn = _connect(db_path)
    cur = conn.cursor()
    case_id = case_obj.get("case_id") or case_obj.get("id") or case_obj.get("title")
    title = case_obj.get("title") or case_obj.get("case_id") or None
    theme = case_obj.get("eje") or case_obj.get("theme") or None
    difficulty = case_obj.get("nivel") or case_obj.get("difficulty") or None
    payload = json.dumps(case_obj, ensure_ascii=False)
    created_at = datetime.utcnow().isoformat()
    updated_at = created_at
    cur.execute(
        "INSERT INTO cases (case_id, title, theme, difficulty, payload, created_at, updated_at, status, rating) VALUES (?,?,?,?,?,?,?,?,?)",
        (case_id, title, theme, difficulty, payload, created_at, updated_at, "active", 0),
    )
    conn.commit()
    rowid = cur.lastrowid
    cur.execute("SELECT id, case_id, title, theme, difficulty, payload, created_at, updated_at, status, rating, tags, notes FROM cases WHERE id = ?", (rowid,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return {}
    return {
        "id": row[0],
        "case_id": row[1],
        "title": row[2],
        "theme": row[3],
        "difficulty": row[4],
        "payload": json.loads(row[5]) if row[5] else None,
        "created_at": row[6],
        "updated_at": row[7],
        "status": row[8],
        "rating": row[9],
        "tags": json.loads(row[10]) if row[10] else [],
        "notes": row[11],
    }


def list_cases(db_path: str, theme: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 50, status: Optional[str] = None) -> List[Dict]:
    conn = _connect(db_path)
    cur = conn.cursor()
    query = "SELECT id, case_id, title, theme, difficulty, payload, created_at, updated_at, status, rating, tags, notes FROM cases"
    params = []
    where = []
    if theme:
        where.append("theme = ?")
        params.append(theme)
    if difficulty:
        where.append("difficulty = ?")
        params.append(difficulty)
    if status:
        where.append("status = ?")
        params.append(status)
    if where:
        query += " WHERE " + " AND ".join(where)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()
    results = []
    for row in rows:
        results.append(
            {
                "id": row[0],
                "case_id": row[1],
                "title": row[2],
                "theme": row[3],
                "difficulty": row[4],
                "payload": json.loads(row[5]) if row[5] else None,
                "created_at": row[6],
                "updated_at": row[7],
                "status": row[8] or "active",
                "rating": row[9] or 0,
                "tags": json.loads(row[10]) if row[10] else [],
                "notes": row[11],
            }
        )
    return results


def get_case(db_path: str, case_id: int) -> Optional[Dict]:
    """Obtiene un caso específico por ID."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, case_id, title, theme, difficulty, payload, created_at, updated_at, status, rating, tags, notes FROM cases WHERE id = ?", (case_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row[0],
        "case_id": row[1],
        "title": row[2],
        "theme": row[3],
        "difficulty": row[4],
        "payload": json.loads(row[5]) if row[5] else None,
        "created_at": row[6],
        "updated_at": row[7],
        "status": row[8] or "active",
        "rating": row[9] or 0,
        "tags": json.loads(row[10]) if row[10] else [],
        "notes": row[11],
    }


def update_case(db_path: str, case_id: int, updates: Dict) -> Optional[Dict]:
    """Actualiza un caso existente."""
    conn = _connect(db_path)
    cur = conn.cursor()
    
    # Construir SET clause dinámicamente
    set_clauses = []
    params = []
    
    if "payload" in updates:
        set_clauses.append("payload = ?")
        params.append(json.dumps(updates["payload"], ensure_ascii=False))
        # Actualizar campos derivados del payload
        if "title" in updates["payload"]:
            set_clauses.append("title = ?")
            params.append(updates["payload"]["title"])
        if "eje" in updates["payload"] or "theme" in updates["payload"]:
            set_clauses.append("theme = ?")
            params.append(updates["payload"].get("eje") or updates["payload"].get("theme"))
        if "nivel" in updates["payload"] or "difficulty" in updates["payload"]:
            set_clauses.append("difficulty = ?")
            params.append(updates["payload"].get("nivel") or updates["payload"].get("difficulty"))
    
    if "status" in updates:
        set_clauses.append("status = ?")
        params.append(updates["status"])
    
    if "rating" in updates:
        set_clauses.append("rating = ?")
        params.append(updates["rating"])
    
    if "tags" in updates:
        set_clauses.append("tags = ?")
        params.append(json.dumps(updates["tags"], ensure_ascii=False))
    
    if "notes" in updates:
        set_clauses.append("notes = ?")
        params.append(updates["notes"])
    
    set_clauses.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())
    
    params.append(case_id)
    
    query = f"UPDATE cases SET {', '.join(set_clauses)} WHERE id = ?"
    cur.execute(query, params)
    conn.commit()
    conn.close()
    
    return get_case(db_path, case_id)


def delete_case(db_path: str, case_id: int) -> bool:
    """Elimina un caso (soft delete - marca como 'deleted')."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("UPDATE cases SET status = ?, updated_at = ? WHERE id = ?", 
                ("deleted", datetime.utcnow().isoformat(), case_id))
    affected = cur.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def get_statistics(db_path: str) -> Dict:
    """Obtiene estadísticas de los casos."""
    conn = _connect(db_path)
    cur = conn.cursor()
    
    # Total de casos
    cur.execute("SELECT COUNT(*) FROM cases WHERE status != 'deleted'")
    total = cur.fetchone()[0]
    
    # Por tema
    cur.execute("SELECT theme, COUNT(*) FROM cases WHERE status != 'deleted' GROUP BY theme")
    by_theme = {row[0]: row[1] for row in cur.fetchall()}
    
    # Por dificultad
    cur.execute("SELECT difficulty, COUNT(*) FROM cases WHERE status != 'deleted' GROUP BY difficulty")
    by_difficulty = {row[0]: row[1] for row in cur.fetchall()}
    
    # Por rating promedio
    cur.execute("SELECT AVG(rating) FROM cases WHERE status != 'deleted' AND rating > 0")
    avg_rating = cur.fetchone()[0] or 0
    
    # Casos recientes (últimos 7 días)
    cur.execute("SELECT COUNT(*) FROM cases WHERE status != 'deleted' AND created_at >= date('now', '-7 days')")
    recent = cur.fetchone()[0]
    
    conn.close()
    
    return {
        "total_cases": total,
        "by_theme": by_theme,
        "by_difficulty": by_difficulty,
        "average_rating": round(avg_rating, 2),
        "recent_cases": recent,
    }


# ===== Funciones de Colecciones =====

def create_collection(db_path: str, name: str, description: str = "") -> Dict:
    """Crea una nueva colección."""
    conn = _connect(db_path)
    cur = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO collections (name, description, created_at, updated_at, status) VALUES (?,?,?,?,?)",
        (name, description, created_at, created_at, "active")
    )
    conn.commit()
    collection_id = cur.lastrowid
    conn.close()
    return {
        "id": collection_id,
        "name": name,
        "description": description,
        "created_at": created_at,
        "updated_at": created_at,
        "status": "active"
    }


def list_collections(db_path: str) -> List[Dict]:
    """Lista todas las colecciones activas con conteo de casos."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id, c.name, c.description, c.created_at, c.updated_at, c.status,
               COUNT(cc.case_id) as case_count
        FROM collections c
        LEFT JOIN collection_cases cc ON c.id = cc.collection_id
        WHERE c.status = 'active'
        GROUP BY c.id
        ORDER BY c.created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        results.append({
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "created_at": row[3],
            "updated_at": row[4],
            "status": row[5],
            "case_count": row[6]
        })
    return results


def get_collection(db_path: str, collection_id: int) -> Optional[Dict]:
    """Obtiene una colección con sus casos."""
    conn = _connect(db_path)
    cur = conn.cursor()
    
    # Obtener info de la colección
    cur.execute("SELECT id, name, description, created_at, updated_at, status FROM collections WHERE id = ?", (collection_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None
    
    collection = {
        "id": row[0],
        "name": row[1],
        "description": row[2],
        "created_at": row[3],
        "updated_at": row[4],
        "status": row[5],
        "cases": []
    }
    
    # Obtener casos de la colección
    cur.execute("""
        SELECT c.id, c.case_id, c.title, c.theme, c.difficulty, c.payload, c.created_at, 
               c.updated_at, c.status, c.rating, c.tags, c.notes, cc.added_at
        FROM cases c
        JOIN collection_cases cc ON c.id = cc.case_id
        WHERE cc.collection_id = ? AND c.status != 'deleted'
        ORDER BY cc.added_at DESC
    """, (collection_id,))
    
    for row in cur.fetchall():
        collection["cases"].append({
            "id": row[0],
            "case_id": row[1],
            "title": row[2],
            "theme": row[3],
            "difficulty": row[4],
            "payload": json.loads(row[5]) if row[5] else None,
            "created_at": row[6],
            "updated_at": row[7],
            "status": row[8],
            "rating": row[9],
            "tags": json.loads(row[10]) if row[10] else [],
            "notes": row[11],
            "added_to_collection_at": row[12]
        })
    
    conn.close()
    return collection


def add_case_to_collection(db_path: str, collection_id: int, case_id: int) -> bool:
    """Agrega un caso a una colección."""
    conn = _connect(db_path)
    cur = conn.cursor()
    added_at = datetime.utcnow().isoformat()
    try:
        cur.execute(
            "INSERT INTO collection_cases (collection_id, case_id, added_at) VALUES (?,?,?)",
            (collection_id, case_id, added_at)
        )
        # Actualizar updated_at de la colección
        cur.execute(
            "UPDATE collections SET updated_at = ? WHERE id = ?",
            (added_at, collection_id)
        )
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False


def remove_case_from_collection(db_path: str, collection_id: int, case_id: int) -> bool:
    """Remueve un caso de una colección."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM collection_cases WHERE collection_id = ? AND case_id = ?",
        (collection_id, case_id)
    )
    affected = cur.rowcount
    if affected > 0:
        cur.execute(
            "UPDATE collections SET updated_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), collection_id)
        )
    conn.commit()
    conn.close()
    return affected > 0


def update_collection(db_path: str, collection_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Dict]:
    """Actualiza una colección."""
    conn = _connect(db_path)
    cur = conn.cursor()
    
    updates = []
    params = []
    
    if name is not None:
        updates.append("name = ?")
        params.append(name)
    
    if description is not None:
        updates.append("description = ?")
        params.append(description)
    
    if not updates:
        conn.close()
        return None
    
    updates.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())
    params.append(collection_id)
    
    query = f"UPDATE collections SET {', '.join(updates)} WHERE id = ?"
    cur.execute(query, params)
    conn.commit()
    conn.close()
    
    return get_collection(db_path, collection_id)


def delete_collection(db_path: str, collection_id: int) -> bool:
    """Elimina una colección (soft delete)."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "UPDATE collections SET status = ?, updated_at = ? WHERE id = ?",
        ("deleted", datetime.utcnow().isoformat(), collection_id)
    )
    affected = cur.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# --- Student authentication and answers ---

def authenticate_student(db_path: str, username: str, password: str) -> Optional[Dict]:
    """Autentica estudiante y devuelve su info si el password es correcto."""
    import hashlib
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, username, name, email, created_at, status FROM students WHERE username = ? AND password_hash = ? AND status = 'active'",
        (username, pw_hash)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row[0],
        "username": row[1],
        "name": row[2],
        "email": row[3],
        "created_at": row[4],
        "status": row[5]
    }


def create_session(db_path: str, student_id: int, case_id: int) -> int:
    """Crea una sesión de estudiante para un caso y devuelve el session_id."""
    conn = _connect(db_path)
    cur = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO student_sessions (student_id, case_id, created_at) VALUES (?,?,?)",
        (student_id, case_id, created_at)
    )
    conn.commit()
    session_id = cur.lastrowid
    conn.close()
    return session_id


def submit_session(db_path: str, session_id: int, duration_seconds: Optional[int] = None):
    """Marca una sesión como enviada."""
    conn = _connect(db_path)
    cur = conn.cursor()
    submitted_at = datetime.utcnow().isoformat()
    cur.execute(
        "UPDATE student_sessions SET submitted_at = ?, duration_seconds = ? WHERE id = ?",
        (submitted_at, duration_seconds, session_id)
    )
    conn.commit()
    conn.close()


def save_answer(db_path: str, session_id: int, question_index: int, selected_option: Optional[int], open_answer: Optional[str], is_correct: Optional[int] = None) -> int:
    """Guarda una respuesta de estudiante."""
    conn = _connect(db_path)
    cur = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO student_answers (session_id, question_index, selected_option, open_answer, is_correct, created_at) VALUES (?,?,?,?,?,?)",
        (session_id, question_index, selected_option, open_answer, is_correct, created_at)
    )
    conn.commit()
    answer_id = cur.lastrowid
    conn.close()
    return answer_id


def get_session_answers(db_path: str, session_id: int) -> List[Dict]:
    """Obtiene todas las respuestas de una sesión."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, question_index, selected_option, open_answer, is_correct, feedback, score, created_at FROM student_answers WHERE session_id = ? ORDER BY question_index",
        (session_id,)
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "question_index": r[1],
            "selected_option": r[2],
            "open_answer": r[3],
            "is_correct": r[4],
            "feedback": r[5],
            "score": r[6],
            "created_at": r[7]
        }
        for r in rows
    ]


def get_student_sessions(db_path: str, student_id: Optional[int] = None, case_id: Optional[int] = None, limit: int = 100) -> List[Dict]:
    """Obtiene sesiones filtradas por estudiante o caso."""
    conn = _connect(db_path)
    cur = conn.cursor()
    query = """
        SELECT s.id, s.student_id, st.username, st.name, s.case_id, c.title, s.created_at, s.submitted_at, s.duration_seconds
        FROM student_sessions s
        JOIN students st ON s.student_id = st.id
        LEFT JOIN cases c ON s.case_id = c.id
        WHERE 1=1
    """
    params = []
    if student_id:
        query += " AND s.student_id = ?"
        params.append(student_id)
    if case_id:
        query += " AND s.case_id = ?"
        params.append(case_id)
    query += " ORDER BY s.created_at DESC LIMIT ?"
    params.append(limit)
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "session_id": r[0],
            "student_id": r[1],
            "student_username": r[2],
            "student_name": r[3],
            "case_id": r[4],
            "case_title": r[5],
            "created_at": r[6],
            "submitted_at": r[7],
            "duration_seconds": r[8]
        }
        for r in rows
    ]


def update_answer_feedback(db_path: str, answer_id: int, feedback: str, score: Optional[float] = None) -> bool:
    """Actualiza el feedback y score de una respuesta."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "UPDATE student_answers SET feedback = ?, score = ? WHERE id = ?",
        (feedback, score, answer_id)
    )
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def list_students(db_path: str, status: str = 'active') -> List[Dict]:
    """Lista estudiantes."""
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, username, name, email, created_at, status FROM students WHERE status = ? ORDER BY name",
        (status,)
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "username": r[1],
            "name": r[2],
            "email": r[3],
            "created_at": r[4],
            "status": r[5]
        }
        for r in rows
    ]
