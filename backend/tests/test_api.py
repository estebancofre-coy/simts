import sys
import os
import json
from types import SimpleNamespace

import pytest
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


@pytest.mark.parametrize("provider", ["openai", "gemini"])
@pytest.mark.parametrize("generate", [True, False])
def test_simulate_openai_sends_model(monkeypatch, tmp_path, provider, generate):
    monkeypatch.setattr(main, "LLM_PROVIDER", provider)
    monkeypatch.setattr(main, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(main, "GEMINI_API_KEY", None)
    monkeypatch.setattr(main, "OPENAI_MODEL", "configured-model")
    db_path = str(tmp_path / "cases.db")
    main._db.init_db(db_path)
    monkeypatch.setattr(main, "DB_PATH", db_path)

    case = {
        "case_id": "test-case",
        "title": "Caso de prueba",
        "description": "Relato de prueba",
    }
    text = json.dumps(case) if generate else "Analisis de prueba"
    calls = []

    def fake_create(*, model, input):
        calls.append({"model": model, "input": input})
        return SimpleNamespace(output_text=text)

    monkeypatch.setattr(main, "client", SimpleNamespace(
        responses=SimpleNamespace(create=fake_create),
    ))
    payload = {"generate": True, "theme": "familia"} if generate else {"case_text": "Caso de prueba"}

    response = client.post("/api/simulate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["provider"] == "openai"
    assert data["text"] == text
    assert len(calls) == 1
    assert calls[0]["model"] == "configured-model"
    if generate:
        assert "familia" in calls[0]["input"]
        assert data["case"]["title"] == case["title"]
        assert data["saved"] is not None
    else:
        assert calls[0]["input"] == payload["case_text"]


def test_simulate_openai_rejects_empty_model(monkeypatch):
    monkeypatch.setattr(main, "LLM_PROVIDER", "openai")
    monkeypatch.setattr(main, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(main, "OPENAI_MODEL", "")

    def unexpected_create(**kwargs):
        pytest.fail("No debe llamar a OpenAI con un modelo vacio")

    monkeypatch.setattr(main, "client", SimpleNamespace(
        responses=SimpleNamespace(create=unexpected_create),
    ))

    response = client.post("/api/simulate", json={"generate": True})

    assert response.status_code == 500
    assert "OPENAI_MODEL" in response.json()["detail"]
