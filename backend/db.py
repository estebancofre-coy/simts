import sqlite3
import json
import os
from typing import Optional, List, Dict
from datetime import datetime


def init_db(db_path: str):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
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
