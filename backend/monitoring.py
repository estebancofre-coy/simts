"""
Monitoring and health check utilities for SimTS backend.

This module provides:
- Detailed health checks
- Prometheus metrics (optional)
- System resource monitoring
"""
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import time

logger = logging.getLogger(__name__)


class HealthChecker:
    """Comprehensive health check for the application."""
    
    @staticmethod
    def check_database(db_path: str) -> Dict[str, Any]:
        """
        Check database connectivity and status.
        
        Args:
            db_path: Path to SQLite database
            
        Returns:
            Dictionary with status information
        """
        try:
            if not os.path.exists(db_path):
                return {
                    "status": "error",
                    "message": "Database file does not exist",
                    "healthy": False
                }
            
            # Check if we can read the database
            import sqlite3
            conn = sqlite3.connect(db_path, timeout=5)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
            table_count = cursor.fetchone()[0]
            conn.close()
            
            return {
                "status": "healthy",
                "message": f"Database accessible with {table_count} tables",
                "healthy": True,
                "table_count": table_count
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "error",
                "message": str(e),
                "healthy": False
            }
    
    @staticmethod
    def check_openai(api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Check OpenAI API configuration.
        
        Args:
            api_key: OpenAI API key
            
        Returns:
            Dictionary with status information
        """
        if not api_key:
            return {
                "status": "warning",
                "message": "OpenAI API key not configured",
                "healthy": True,  # Non-critical for basic operations
                "configured": False
            }
        
        return {
            "status": "healthy",
            "message": "OpenAI API key configured",
            "healthy": True,
            "configured": True
        }
    
    @staticmethod
    def check_disk_space(path: str = ".") -> Dict[str, Any]:
        """
        Check available disk space.
        
        Args:
            path: Path to check disk space
            
        Returns:
            Dictionary with disk space information
        """
        try:
            import shutil
            total, used, free = shutil.disk_usage(path)
            
            # Convert to GB
            total_gb = total / (1024 ** 3)
            free_gb = free / (1024 ** 3)
            used_gb = used / (1024 ** 3)
            percent_used = (used / total) * 100
            
            # Warn if less than 1GB free or > 90% used
            healthy = free_gb > 1.0 and percent_used < 90
            
            return {
                "status": "healthy" if healthy else "warning",
                "message": f"{free_gb:.2f} GB free of {total_gb:.2f} GB",
                "healthy": healthy,
                "total_gb": round(total_gb, 2),
                "used_gb": round(used_gb, 2),
                "free_gb": round(free_gb, 2),
                "percent_used": round(percent_used, 2)
            }
        except Exception as e:
            logger.error(f"Disk space check failed: {e}")
            return {
                "status": "error",
                "message": str(e),
                "healthy": False
            }
    
    @staticmethod
    def get_comprehensive_health(db_path: str, openai_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Get comprehensive health status of all components.
        
        Args:
            db_path: Path to database
            openai_key: OpenAI API key
            
        Returns:
            Dictionary with comprehensive health information
        """
        db_health = HealthChecker.check_database(db_path)
        openai_health = HealthChecker.check_openai(openai_key)
        disk_health = HealthChecker.check_disk_space()
        
        # Overall health is true only if all critical components are healthy
        overall_healthy = db_health["healthy"] and disk_health["healthy"]
        
        return {
            "status": "healthy" if overall_healthy else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "database": db_health,
                "openai": openai_health,
                "disk": disk_health
            },
            "healthy": overall_healthy
        }


class MetricsCollector:
    """Simple metrics collector for monitoring."""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.request_durations = []
        self.start_time = time.time()
    
    def record_request(self, duration: float, success: bool = True):
        """Record a request metric."""
        self.request_count += 1
        if not success:
            self.error_count += 1
        self.request_durations.append(duration)
        
        # Keep only last 1000 durations to prevent memory issues
        if len(self.request_durations) > 1000:
            self.request_durations = self.request_durations[-1000:]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics."""
        uptime = time.time() - self.start_time
        
        avg_duration = sum(self.request_durations) / len(self.request_durations) if self.request_durations else 0
        
        return {
            "uptime_seconds": round(uptime, 2),
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "error_rate": round(self.error_count / self.request_count, 4) if self.request_count > 0 else 0,
            "average_duration_ms": round(avg_duration * 1000, 2),
            "recent_requests": len(self.request_durations)
        }


# Global metrics collector
metrics_collector = MetricsCollector()
