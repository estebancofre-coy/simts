"""Tests for authentication and JWT functionality."""

import sys
import os
import pytest
from datetime import datetime, timedelta

# Add parent directory to path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import auth
from security import hash_password, verify_password, is_bcrypt_hash


def test_hash_password():
    """Test that password hashing works."""
    password = "test_password_123"
    hashed = hash_password(password)
    
    # Should be a bcrypt hash
    assert is_bcrypt_hash(hashed)
    assert hashed.startswith(('$2a$', '$2b$', '$2y$'))
    
    # Should be different from the original password
    assert hashed != password


def test_verify_password():
    """Test that password verification works correctly."""
    password = "test_password_123"
    hashed = hash_password(password)
    
    # Correct password should verify
    assert verify_password(password, hashed) is True
    
    # Incorrect password should not verify
    assert verify_password("wrong_password", hashed) is False


def test_verify_password_with_invalid_hash():
    """Test that invalid hash doesn't crash."""
    result = verify_password("password", "invalid_hash")
    assert result is False


def test_create_access_token():
    """Test JWT token creation."""
    data = {"user_id": 1, "username": "testuser", "user_type": "student"}
    token = auth.create_access_token(data)
    
    # Should be a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0


def test_verify_token():
    """Test JWT token verification."""
    data = {"user_id": 1, "username": "testuser", "user_type": "student"}
    token = auth.create_access_token(data)
    
    # Verify the token
    payload = auth.verify_token(token)
    
    # Should contain the original data
    assert payload is not None
    assert payload["user_id"] == 1
    assert payload["username"] == "testuser"
    assert payload["user_type"] == "student"
    
    # Should have an expiration
    assert "exp" in payload


def test_verify_invalid_token():
    """Test that invalid token returns None."""
    result = auth.verify_token("invalid.token.here")
    assert result is None


def test_token_expiration():
    """Test that expired tokens are rejected."""
    data = {"user_id": 1, "username": "testuser"}
    
    # Create token that expires immediately
    expired_delta = timedelta(seconds=-1)
    token = auth.create_access_token(data, expires_delta=expired_delta)
    
    # Should not verify
    result = auth.verify_token(token)
    assert result is None


def test_is_bcrypt_hash():
    """Test bcrypt hash detection."""
    # Valid bcrypt hashes
    assert is_bcrypt_hash("$2a$12$abcdefghijklmnopqrstuvwxyz123456789")
    assert is_bcrypt_hash("$2b$10$abcdefghijklmnopqrstuvwxyz123456789")
    assert is_bcrypt_hash("$2y$12$abcdefghijklmnopqrstuvwxyz123456789")
    
    # Invalid hashes
    assert not is_bcrypt_hash("not_a_bcrypt_hash")
    assert not is_bcrypt_hash("$1$invalidprefix")
    assert not is_bcrypt_hash("")
