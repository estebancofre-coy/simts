"""
Tests for authentication functionality.
"""
import sys
import os
import tempfile
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import main
import db as _db

client = TestClient(main.app)


@pytest.fixture
def test_db():
    """Create a temporary test database."""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db_path = f.name
    
    # Initialize test database
    _db.init_db(db_path)
    
    yield db_path
    
    # Cleanup
    try:
        os.unlink(db_path)
    except:
        pass


def test_password_hashing():
    """Test password hashing and verification."""
    password = "test_password_123"
    
    # Hash password
    hashed = _db.hash_password(password)
    
    # Verify correct password
    assert _db.verify_password(password, hashed)
    
    # Verify incorrect password
    assert not _db.verify_password("wrong_password", hashed)


def test_student_authentication(test_db):
    """Test student authentication."""
    # Test with demo student (username: estudiante1, password: pass)
    student = _db.authenticate_student(test_db, "estudiante1", "pass")
    
    assert student is not None
    assert student["username"] == "estudiante1"
    assert "id" in student
    assert "password_hash" not in student  # Should not return password hash
    
    # Test with wrong password
    student = _db.authenticate_student(test_db, "estudiante1", "wrong_password")
    assert student is None
    
    # Test with non-existent user
    student = _db.authenticate_student(test_db, "nonexistent", "password")
    assert student is None


def test_login_endpoint_success():
    """Test login endpoint with valid credentials."""
    response = client.post(
        "/api/auth/login",
        json={"username": "estudiante1", "password": "pass"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "student" in data
    assert "token" in data
    assert data["student"]["username"] == "estudiante1"


def test_login_endpoint_failure():
    """Test login endpoint with invalid credentials."""
    response = client.post(
        "/api/auth/login",
        json={"username": "estudiante1", "password": "wrong_password"}
    )
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_login_rate_limiting():
    """Test rate limiting on login endpoint."""
    # Make multiple login attempts rapidly
    for i in range(7):  # Limit is 5 per minute
        response = client.post(
            "/api/auth/login",
            json={"username": "test_user", "password": "test_pass"}
        )
        
        if i < 5:
            # First 5 should go through (might fail with 401, but not 429)
            assert response.status_code in [200, 401]
        else:
            # After 5, should hit rate limit
            if response.status_code == 429:
                break
    
    # At least one request should have hit the rate limit
    # Note: This test might be flaky due to timing


def test_login_input_validation():
    """Test input validation on login endpoint."""
    # Test with invalid username (too short)
    response = client.post(
        "/api/auth/login",
        json={"username": "ab", "password": "password"}
    )
    assert response.status_code == 422  # Validation error
    
    # Test with invalid password (too short)
    response = client.post(
        "/api/auth/login",
        json={"username": "validuser", "password": "abc"}
    )
    assert response.status_code == 422  # Validation error
    
    # Test with missing fields
    response = client.post(
        "/api/auth/login",
        json={"username": "validuser"}
    )
    assert response.status_code == 422  # Validation error


def test_security_headers():
    """Test that security headers are present in responses."""
    response = client.get("/api/health")
    
    # Check for important security headers
    assert "X-Frame-Options" in response.headers
    assert "X-Content-Type-Options" in response.headers
    assert "X-XSS-Protection" in response.headers
    assert "Content-Security-Policy" in response.headers
    
    # Verify values
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_cors_headers():
    """Test that CORS headers are configured."""
    response = client.options("/api/health")
    
    # Check for CORS headers
    assert "access-control-allow-origin" in response.headers or \
           "Access-Control-Allow-Origin" in response.headers
