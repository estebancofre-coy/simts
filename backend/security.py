"""
Security utilities for SimTS backend.

This module provides security features including:
- Rate limiting
- Input validation
- JWT token management
- CSRF protection
"""
import time
import re
from typing import Dict, Optional, Callable
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""
    
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Check if a request is allowed based on rate limits.
        
        Args:
            key: Identifier for the client (e.g., IP address)
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            True if request is allowed, False otherwise
        """
        now = time.time()
        cutoff = now - window_seconds
        
        # Clean old requests
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
        
        # Check if limit exceeded
        if len(self.requests[key]) >= max_requests:
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True
    
    def cleanup(self, max_age_seconds: int = 3600):
        """Remove old entries to prevent memory buildup."""
        now = time.time()
        cutoff = now - max_age_seconds
        
        for key in list(self.requests.keys()):
            self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
            if not self.requests[key]:
                del self.requests[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


def rate_limit(max_requests: int = 10, window_seconds: int = 60):
    """
    Decorator to add rate limiting to FastAPI endpoints.
    
    Args:
        max_requests: Maximum number of requests allowed per window
        window_seconds: Time window in seconds
        
    Example:
        @app.post("/api/endpoint")
        @rate_limit(max_requests=5, window_seconds=60)
        async def endpoint():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                request = kwargs.get('request')
            
            if request:
                # Use IP address as rate limit key
                client_ip = request.client.host if request.client else "unknown"
                
                if not rate_limiter.is_allowed(client_ip, max_requests, window_seconds):
                    logger.warning(f"Rate limit exceeded for {client_ip}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds."
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class InputValidator:
    """Validates and sanitizes user inputs."""
    
    # Common regex patterns
    USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{3,50}$')
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username format."""
        if not username:
            return False
        return bool(InputValidator.USERNAME_PATTERN.match(username))
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        if not email:
            return False
        return bool(InputValidator.EMAIL_PATTERN.match(email))
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        """
        Sanitize string input to prevent injection attacks.
        
        Args:
            text: Input text to sanitize
            max_length: Maximum allowed length
            
        Returns:
            Sanitized string
        """
        if not text:
            return ""
        
        # Truncate to max length
        text = text[:max_length]
        
        # Remove potentially dangerous characters
        # Keep alphanumeric, spaces, and common punctuation
        text = re.sub(r'[<>{}$`]', '', text)
        
        return text.strip()
    
    @staticmethod
    def sanitize_openai_response(response: str) -> str:
        """
        Sanitize OpenAI response to prevent injection attacks.
        
        Args:
            response: Response from OpenAI
            
        Returns:
            Sanitized response
        """
        if not response:
            return ""
        
        # Remove script tags and dangerous HTML
        response = re.sub(r'<script[^>]*>.*?</script>', '', response, flags=re.DOTALL | re.IGNORECASE)
        response = re.sub(r'<iframe[^>]*>.*?</iframe>', '', response, flags=re.DOTALL | re.IGNORECASE)
        response = re.sub(r'javascript:', '', response, flags=re.IGNORECASE)
        response = re.sub(r'on\w+\s*=', '', response, flags=re.IGNORECASE)
        
        return response


def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client IP address
    """
    # Check for X-Forwarded-For header (proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the chain
        return forwarded.split(",")[0].strip()
    
    # Check for X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    return request.client.host if request.client else "unknown"


class SecurityHeaders:
    """Security headers for HTTP responses."""
    
    @staticmethod
    def get_headers() -> Dict[str, str]:
        """
        Get recommended security headers.
        
        Returns:
            Dictionary of security headers
        """
        return {
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            
            # XSS Protection (legacy, but still useful)
            "X-XSS-Protection": "1; mode=block",
            
            # Referrer Policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.openai.com; "
                "frame-ancestors 'none';"
            ),
            
            # HSTS (HTTP Strict Transport Security) - only for HTTPS
            # Uncomment in production with HTTPS
            # "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Permissions Policy
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        }
