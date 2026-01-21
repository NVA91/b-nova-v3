"""
🧪 NOVA v3 - Integration Tests for GUARDIAN Service
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestGuardianService:
    """Test GUARDIAN monitoring and security service."""
    
    def test_system_metrics(self, client: TestClient):
        """Test getting system metrics."""
        response = client.get("/api/guardian/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert "cpu" in data
        assert "memory" in data
        assert "disk" in data
        
        # Validate metric structure
        assert 0 <= data["cpu"]["percent"] <= 100
        assert data["memory"]["total"] > 0
        assert data["disk"]["total"] > 0
    
    def test_resource_prediction(self, client: TestClient):
        """Test predictive resource management."""
        response = client.get("/api/guardian/predict")
        assert response.status_code == 200
        
        data = response.json()
        assert "prediction" in data
        assert "confidence" in data
        assert 0 <= data["confidence"] <= 1
    
    def test_security_scan(self, client: TestClient):
        """Test security scan functionality."""
        response = client.post("/api/guardian/scan")
        assert response.status_code in [200, 202]
        
        if response.status_code == 200:
            data = response.json()
            assert "scan_id" in data
            assert "status" in data
    
    def test_get_alerts(self, client: TestClient):
        """Test getting security alerts."""
        response = client.get("/api/guardian/alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.slow
    def test_continuous_monitoring(self, client: TestClient):
        """Test continuous monitoring over time."""
        import time
        
        # Get initial metrics
        response1 = client.get("/api/guardian/metrics")
        assert response1.status_code == 200
        
        # Wait a bit
        time.sleep(2)
        
        # Get metrics again
        response2 = client.get("/api/guardian/metrics")
        assert response2.status_code == 200
        
        # Both should be successful
        assert response1.json() is not None
        assert response2.json() is not None
