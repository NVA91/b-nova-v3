"""
NOVA v3 - Health Check Endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...database import get_db
from ...config import get_settings
import psutil
from datetime import datetime

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint
    Returns system status and database connectivity
    """
    try:
        # Test database connection
        db.execute(text("SELECT 1"))  # <--- Hier ändern!
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Get system metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION,
        "database": db_status,
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
        },
        # Backwards-compatible services block expected by tests
        "services": {
            "database": "healthy" if db_status == "healthy" else "unhealthy",
        }
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes/Docker
    """
    return {"ready": True}


@router.get("/live")
async def liveness_check():
    """
    Liveness check for Kubernetes/Docker
    """
    return {"alive": True}
