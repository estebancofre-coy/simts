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


@pytest.fixture
def isolated_db(monkeypatch, tmp_path):
    db_path = str(tmp_path / "cases.db")
    main._db.init_db(db_path)
    monkeypatch.setattr(main, "DB_PATH", db_path)
    return db_path


@pytest.mark.parametrize("case_length,word_count", [
    ("corto", 300),
    ("medio", 600),
    ("extenso", 1200),
])
def test_generate_retries_short_description(monkeypatch, isolated_db, case_length, word_count):
    calls = []
    descriptions = ["Relato demasiado breve", " ".join(["contexto"] * word_count)]

    def fake_call_llm(prompt_text, expect_json=False):
        calls.append(prompt_text)
        assert expect_json
        return json.dumps({
            "title": "Caso de prueba",
            "description": descriptions[len(calls) - 1],
        }), {}, "gemini"

    monkeypatch.setattr(main, "call_llm", fake_call_llm)
    response = client.post("/api/simulate", json={
        "generate": True, "case_length": case_length,
    })

    assert response.status_code == 200
    data = response.json()
    assert len(data["case"]["description"].split()) == word_count
    assert len(calls) == 2
    assert str(word_count) in calls[0]
    assert "3 palabras" in calls[1]
    assert data["metrics"]["description_words"] == word_count
    assert data["metrics"]["generation_attempts"] == 2
    assert json.loads(data["text"])["description"] == data["case"]["description"]
    saved_cases = main._db.list_cases(isolated_db)
    assert len(saved_cases) == 1
    assert saved_cases[0]["payload"]["description"] == data["case"]["description"]


@pytest.mark.parametrize("case_length,word_count", [
    ("corto", 300), ("corto", 500),
    ("medio", 600), ("medio", 900),
    ("extenso", 1200), ("extenso", 1600),
    (None, 600),
])
def test_generate_accepts_range_boundaries(monkeypatch, isolated_db, case_length, word_count):
    calls = []
    description = "\\n\\n".join([" ".join(["antecedentes"] * (word_count // 2))] * 2)

    def fake_call_llm(prompt_text, expect_json=False):
        calls.append(prompt_text)
        case = {"titulo": "Caso", "relato": description}
        return f"```json\n{json.dumps(case)}\n```", {}, "gemini"

    monkeypatch.setattr(main, "call_llm", fake_call_llm)
    response = client.post("/api/simulate", json={"generate": True, "case_length": case_length})
    assert response.status_code == 200
    data = response.json()
    assert data["case"]["description"] == description
    assert data["metrics"]["description_words"] == word_count
    assert data["metrics"]["generation_attempts"] == 1
    assert len(calls) == 1


@pytest.mark.parametrize("case_length,word_count", [
    ("corto", 299), ("corto", 501),
    ("medio", 599), ("medio", 901),
    ("extenso", 1199), ("extenso", 1601),
])
def test_generate_rejects_outside_range(monkeypatch, isolated_db, case_length, word_count):
    calls = []

    def fake_call_llm(prompt_text, expect_json=False):
        calls.append(prompt_text)
        return json.dumps({"description": " ".join(["relato"] * word_count)}), {}, "gemini"

    monkeypatch.setattr(main, "call_llm", fake_call_llm)
    response = client.post("/api/simulate", json={"generate": True, "case_length": case_length})
    assert response.status_code == 502
    assert "No se guardó el caso" in response.json()["detail"]
    assert len(calls) == 2
    assert main._db.list_cases(isolated_db) == []


@pytest.mark.parametrize("text", [
    '{"description": "JSON truncado', "[]", "null",
    '{"description": ["no es un relato"]}', '{}',
])
def test_generate_rejects_invalid_description(monkeypatch, isolated_db, text):
    calls = []

    def fake_call_llm(prompt_text, expect_json=False):
        calls.append(prompt_text)
        return text, {}, "gemini"

    monkeypatch.setattr(main, "call_llm", fake_call_llm)
    response = client.post("/api/simulate", json={"generate": True})
    assert response.status_code == 502
    assert len(calls) == 2
    assert main._db.list_cases(isolated_db) == []


def test_generate_rejects_unknown_length(monkeypatch):
    def unexpected_call(*args, **kwargs):
        pytest.fail("No debe generar un caso con extension desconocida")

    monkeypatch.setattr(main, "call_llm", unexpected_call)
    response = client.post("/api/simulate", json={"generate": True, "case_length": "enorme"})
    assert response.status_code == 422


@pytest.mark.parametrize("generate", [True, False])
def test_gemini_generation_token_budget(monkeypatch, isolated_db, generate):
    monkeypatch.setattr(main, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(main, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main, "GEMINI_MODEL", "configured-gemini")
    text = json.dumps({"description": " ".join(["contexto"] * 600)}) if generate else "Analisis"
    calls = []

    def fake_post(url, *, params, json, timeout):
        calls.append({"url": url, "payload": json, "timeout": timeout})
        return SimpleNamespace(
            raise_for_status=lambda: None,
            json=lambda: {"candidates": [{"content": {"parts": [{"text": text}]}}]},
        )

    monkeypatch.setattr(main.requests, "post", fake_post)
    payload = {"generate": True} if generate else {"case_text": "Caso"}
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    assert response.json()["provider"] == "gemini"
    assert len(calls) == 1
    assert "configured-gemini:generateContent" in calls[0]["url"]
    config = calls[0]["payload"]["generationConfig"]
    if generate:
        assert config["maxOutputTokens"] == main.CASE_GENERATION_MAX_TOKENS
        assert config["responseMimeType"] == "application/json"
    else:
        assert "maxOutputTokens" not in config
        assert "responseMimeType" not in config


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
        "description": " ".join(["contexto"] * 600),
    }
    text = json.dumps(case) if generate else "Analisis de prueba"
    calls = []

    def fake_create(*, model, input, **kwargs):
        calls.append({"model": model, "input": input, **kwargs})
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
        assert calls[0]["max_output_tokens"] == main.CASE_GENERATION_MAX_TOKENS
        assert data["case"]["title"] == case["title"]
        assert data["saved"] is not None
    else:
        assert calls[0]["input"] == payload["case_text"]
        assert "max_output_tokens" not in calls[0]


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
