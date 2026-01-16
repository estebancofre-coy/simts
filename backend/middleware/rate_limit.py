"""Rate limiting middleware for SimTS backend."""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Create limiter instance with remote address as the key function
limiter = Limiter(key_func=get_remote_address)

# The rate limit exceeded handler can be registered in main.py
__all__ = ['limiter', 'RateLimitExceeded', '_rate_limit_exceeded_handler']
