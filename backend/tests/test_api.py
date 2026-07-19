import sys
import os
from fastapi.testclient import TestClient

# Asegura que el directorio padre (donde está main.py) esté en sys.path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import main

client = TestClient(main.app)


def test_simulate_mock(monkeypatch):
    def fake_call_llm(prompt_text, expect_json=False):
        return "Respuesta simulada", {"mock": True, "prompt": prompt_text, "expect_json": expect_json}, "gemini"

    # Reemplaza la llamada al LLM para no llamar a la API real
    monkeypatch.setattr(main, "call_llm", fake_call_llm)

    r = client.post("/api/simulate", json={"case_text": "Caso de prueba"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert "Respuesta simulada" in (data.get("text") or "")
