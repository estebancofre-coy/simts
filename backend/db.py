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
        created_at TEXT
    )
    """)
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
    cur.execute(
        "INSERT INTO cases (case_id, title, theme, difficulty, payload, created_at) VALUES (?,?,?,?,?,?)",
        (case_id, title, theme, difficulty, payload, created_at),
    )
    conn.commit()
    rowid = cur.lastrowid
    cur.execute("SELECT id, case_id, title, theme, difficulty, payload, created_at FROM cases WHERE id = ?", (rowid,))
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
    }


def list_cases(db_path: str, theme: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 50) -> List[Dict]:
    conn = _connect(db_path)
    cur = conn.cursor()
    query = "SELECT id, case_id, title, theme, difficulty, payload, created_at FROM cases"
    params = []
    where = []
    if theme:
        where.append("theme = ?")
        params.append(theme)
    if difficulty:
        where.append("difficulty = ?")
        params.append(difficulty)
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
            }
        )
    return results
