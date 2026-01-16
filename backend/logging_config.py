"""Structured JSON logging configuration for SimTS backend."""

import logging
import json
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record):
        """Format log record as JSON.
        
        Args:
            record: LogRecord instance
            
        Returns:
            JSON formatted log string
        """
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)
            
        return json.dumps(log_data)


def setup_logging(name: str = "simts", level: int = logging.INFO):
    """Setup structured JSON logging.
    
    Args:
        name: Logger name
        level: Logging level (default: INFO)
        
    Returns:
        Configured logger instance
    """
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    
    logger = logging.getLogger(name)
    logger.addHandler(handler)
    logger.setLevel(level)
    
    return logger
