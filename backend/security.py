"""Security utilities for password hashing and verification."""

import bcrypt


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password as a string
    """
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        # If hashed_password is not a valid bcrypt hash, return False
        return False


def is_bcrypt_hash(password_hash: str) -> bool:
    """Check if a password hash is a bcrypt hash.
    
    Args:
        password_hash: Password hash to check
        
    Returns:
        True if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$), False otherwise
    """
    return password_hash.startswith(('$2a$', '$2b$', '$2y$'))
