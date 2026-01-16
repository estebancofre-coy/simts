"""Database connection pooling for SimTS backend."""

import sqlite3
from contextlib import contextmanager
from threading import Lock
from typing import Iterator


class DatabasePool:
    """Simple connection pool for SQLite database."""
    
    def __init__(self, db_path: str, max_connections: int = 5):
        """Initialize the database pool.
        
        Args:
            db_path: Path to the SQLite database file
            max_connections: Maximum number of connections to keep in pool
        """
        self.db_path = db_path
        self.connections = []
        self.lock = Lock()
        self.max_connections = max_connections
    
    @contextmanager
    def get_connection(self) -> Iterator[sqlite3.Connection]:
        """Get a database connection from the pool.
        
        This is a context manager that automatically returns the connection
        to the pool when done.
        
        Yields:
            sqlite3.Connection: Database connection from the pool
        """
        conn = None
        with self.lock:
            if self.connections:
                conn = self.connections.pop()
            else:
                conn = sqlite3.connect(self.db_path, check_same_thread=False)
        
        try:
            yield conn
        finally:
            with self.lock:
                if len(self.connections) < self.max_connections:
                    self.connections.append(conn)
                else:
                    conn.close()
    
    def close_all(self):
        """Close all connections in the pool."""
        with self.lock:
            while self.connections:
                conn = self.connections.pop()
                conn.close()


# Global pool instance (will be initialized in main.py)
_pool = None


def init_pool(db_path: str, max_connections: int = 5):
    """Initialize the global connection pool.
    
    Args:
        db_path: Path to the SQLite database file
        max_connections: Maximum number of connections to keep in pool
    """
    global _pool
    _pool = DatabasePool(db_path, max_connections)


def get_pool() -> DatabasePool:
    """Get the global connection pool instance.
    
    Returns:
        DatabasePool instance
        
    Raises:
        RuntimeError: If pool hasn't been initialized
    """
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_pool() first.")
    return _pool
