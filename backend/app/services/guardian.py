"""
🛡️ GUARDIAN Service - Extended Monitoring & Security
Erweiterte Überwachung, Predictive Resource-Management und Security-Scans
"""
import psutil
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json


class GuardianService:
    """GUARDIAN Agent - Monitoring, Security & Resource Management"""
    
    def __init__(self):
        self.alert_thresholds = {
            "cpu": 80.0,  # %
            "memory": 85.0,  # %
            "disk": 90.0,  # %
        }
        self.prediction_window = 300  # 5 minutes
        self.metrics_history = []
    
    # ===== System Monitoring =====
    
    def get_system_metrics(self) -> Dict:
        """Sammelt aktuelle System-Metriken"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "cpu": {
                "percent": cpu_percent,
                "count": psutil.cpu_count(),
                "freq": psutil.cpu_freq().current if psutil.cpu_freq() else None,
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent,
            },
            "network": self._get_network_stats(),
        }
        
        # Store in history for predictions
        self.metrics_history.append(metrics)
        if len(self.metrics_history) > 100:  # Keep last 100 entries
            self.metrics_history.pop(0)
        
        return metrics
    
    def _get_network_stats(self) -> Dict:
        """Netzwerk-Statistiken"""
        net_io = psutil.net_io_counters()
        return {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv,
        }
    
    def get_process_list(self) -> List[Dict]:
        """Liste aller laufenden Prozesse"""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        # Sort by CPU usage
        processes.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
        return processes[:20]  # Top 20
    
    # ===== Predictive Resource Management =====
    
    def predict_resource_usage(self, minutes_ahead: int = 5) -> Dict:
        """Vorhersage der Ressourcen-Nutzung basierend auf historischen Daten"""
        if len(self.metrics_history) < 10:
            return {"status": "insufficient_data", "message": "Need more historical data"}
        
        # Simple linear prediction based on recent trend
        recent_metrics = self.metrics_history[-10:]
        
        cpu_trend = self._calculate_trend([m["cpu"]["percent"] for m in recent_metrics])
        memory_trend = self._calculate_trend([m["memory"]["percent"] for m in recent_metrics])
        disk_trend = self._calculate_trend([m["disk"]["percent"] for m in recent_metrics])
        
        current = self.get_system_metrics()
        
        prediction = {
            "timestamp": datetime.utcnow().isoformat(),
            "prediction_time": minutes_ahead,
            "current": {
                "cpu": current["cpu"]["percent"],
                "memory": current["memory"]["percent"],
                "disk": current["disk"]["percent"],
            },
            "predicted": {
                "cpu": min(100, current["cpu"]["percent"] + (cpu_trend * minutes_ahead)),
                "memory": min(100, current["memory"]["percent"] + (memory_trend * minutes_ahead)),
                "disk": min(100, current["disk"]["percent"] + (disk_trend * minutes_ahead)),
            },
            "alerts": []
        }
        
        # Check for predicted threshold breaches
        if prediction["predicted"]["cpu"] > self.alert_thresholds["cpu"]:
            prediction["alerts"].append({
                "type": "cpu",
                "severity": "warning",
                "message": f"CPU usage predicted to reach {prediction['predicted']['cpu']:.1f}% in {minutes_ahead} minutes"
            })
        
        if prediction["predicted"]["memory"] > self.alert_thresholds["memory"]:
            prediction["alerts"].append({
                "type": "memory",
                "severity": "warning",
                "message": f"Memory usage predicted to reach {prediction['predicted']['memory']:.1f}% in {minutes_ahead} minutes"
            })
        
        return prediction
    
    def _calculate_trend(self, values: List[float]) -> float:
        """Berechnet den Trend (Steigung) einer Werte-Liste"""
        if len(values) < 2:
            return 0.0
        
        n = len(values)
        x = list(range(n))
        
        # Linear regression: y = mx + b
        x_mean = sum(x) / n
        y_mean = sum(values) / n
        
        numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return 0.0
        
        slope = numerator / denominator
        return slope
    
    # ===== Security Scans =====
    
    def scan_cve_vulnerabilities(self) -> Dict:
        """Scannt nach bekannten CVE-Schwachstellen"""
        # TODO: Integrate with CVE database API
        # For now, return mock data
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "scan_status": "completed",
            "vulnerabilities": [
                {
                    "cve_id": "CVE-2024-EXAMPLE",
                    "severity": "medium",
                    "package": "example-package",
                    "version": "1.0.0",
                    "fixed_version": "1.0.1",
                    "description": "Example vulnerability for demonstration"
                }
            ],
            "summary": {
                "total": 1,
                "critical": 0,
                "high": 0,
                "medium": 1,
                "low": 0,
            }
        }
    
    def check_docker_security(self) -> Dict:
        """Überprüft Docker-Container auf Sicherheitsprobleme"""
        # TODO: Implement Docker security checks
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "containers_checked": 0,
            "issues": [],
            "recommendations": [
                "Run containers as non-root user",
                "Limit container resources",
                "Use read-only filesystems where possible",
            ]
        }
    
    # ===== Health Checks =====
    
    def health_check(self) -> Dict:
        """Umfassender System-Health-Check"""
        metrics = self.get_system_metrics()
        prediction = self.predict_resource_usage()
        
        status = "healthy"
        issues = []
        
        # Check current metrics
        if metrics["cpu"]["percent"] > self.alert_thresholds["cpu"]:
            status = "warning"
            issues.append(f"High CPU usage: {metrics['cpu']['percent']:.1f}%")
        
        if metrics["memory"]["percent"] > self.alert_thresholds["memory"]:
            status = "warning"
            issues.append(f"High memory usage: {metrics['memory']['percent']:.1f}%")
        
        if metrics["disk"]["percent"] > self.alert_thresholds["disk"]:
            status = "critical"
            issues.append(f"High disk usage: {metrics['disk']['percent']:.1f}%")
        
        return {
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": metrics,
            "prediction": prediction,
            "issues": issues,
            "recommendations": self._get_recommendations(metrics, prediction)
        }
    
    def _get_recommendations(self, metrics: Dict, prediction: Dict) -> List[str]:
        """Generiert Empfehlungen basierend auf Metriken"""
        recommendations = []
        
        if metrics["memory"]["percent"] > 70:
            recommendations.append("Consider increasing memory or optimizing memory-intensive processes")
        
        if metrics["disk"]["percent"] > 80:
            recommendations.append("Clean up disk space or expand storage")
        
        if prediction.get("alerts"):
            recommendations.append("Monitor system closely - resource issues predicted")
        
        return recommendations


# Singleton instance
guardian = GuardianService()
