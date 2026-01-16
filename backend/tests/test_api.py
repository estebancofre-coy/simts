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
    class DummyResp:
        def to_dict(self):
            return {"output": [{"content": [{"text": "Respuesta simulada"}]}]}

    def fake_create(*args, **kwargs):
        return DummyResp()

    # Reemplaza el método create del cliente para no llamar a la API real
    monkeypatch.setattr(main.client.responses, "create", fake_create)

    r = client.post("/api/simulate", json={"case_text": "Caso de prueba"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert "Respuesta simulada" in (data.get("text") or "")


def test_health_check():
    """Test health check endpoint."""
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "healthy"
    assert "db_connected" in data


def test_cors_headers():
    """Test that CORS headers are present."""
    r = client.options("/api/health")
    # CORS headers should be present
    assert r.status_code in [200, 204]


def test_root_endpoint():
    """Test root endpoint returns API info."""
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert "message" in data
    assert "version" in data
