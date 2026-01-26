"""
🛡️ GUARDIAN API Routes
Endpoints für Monitoring, Predictions und Security-Scans
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from app.services.guardian import guardian

router = APIRouter(prefix="/guardian", tags=["guardian"])


@router.get("/metrics")
async def get_system_metrics() -> Dict:
    """Aktuelle System-Metriken abrufen"""
    try:
        return guardian.get_system_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/processes")
async def get_process_list() -> Dict:
    """Liste der Top-Prozesse nach CPU-Nutzung"""
    try:
        processes = guardian.get_process_list()
        return {"processes": processes, "count": len(processes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict")
async def predict_resource_usage(minutes_ahead: int = 5) -> Dict:
    """Vorhersage der Ressourcen-Nutzung"""
    try:
        if minutes_ahead < 1 or minutes_ahead > 60:
            raise HTTPException(status_code=400, detail="minutes_ahead must be between 1 and 60")
        
        return guardian.predict_resource_usage(minutes_ahead)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/security/cve")
async def scan_cve_vulnerabilities() -> Dict:
    """CVE-Schwachstellen-Scan durchführen"""
    try:
        return guardian.scan_cve_vulnerabilities()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/security/docker")
async def check_docker_security() -> Dict:
    """Docker-Sicherheitsprüfung durchführen"""
    try:
        return guardian.check_docker_security()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan")
async def run_security_scan() -> Dict:
    """Run a combined security scan (legacy /scan endpoint)"""
    try:
        result = guardian.scan_cve_vulnerabilities()
        return {"scan_id": "scan-1", "status": "completed", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts")
async def get_alerts() -> Dict:
    """Return current alerts (legacy endpoint)"""
    try:
        # For now return empty list
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> Dict:
    """Umfassender System-Health-Check"""
    try:
        return guardian.health_check()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
