"""Authentication and JWT token management for SimTS backend."""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("simts.auth")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Warn if using default secret key
if SECRET_KEY == "CHANGE_ME_IN_PRODUCTION":
    logger.warning(
        "⚠️  Using default JWT_SECRET_KEY! This is insecure for production. "
        "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with expiration.
    
    Args:
        data: Dictionary containing the claims to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict]:
    """Verify and decode a JWT token.
    
    Args:
        token: JWT token string to verify
        
    Returns:
        Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict:
    """Dependency to extract and verify current user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials from request
        
    Returns:
        User data from token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


async def get_current_student(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict:
    """Dependency to extract and verify current student from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials from request
        
    Returns:
        Student data from token payload
        
    Raises:
        HTTPException: If token is invalid, expired, or user is not a student
    """
    payload = await get_current_user(credentials)
    
    # Verify that the token is for a student
    if payload.get("user_type") != "student":
        raise HTTPException(
            status_code=403,
            detail="Not authorized as student"
        )
    
    return payload
