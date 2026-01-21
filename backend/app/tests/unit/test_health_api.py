"""
🧪 NOVA v3 - Unit Tests for Health API
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
class TestHealthAPI:
    """Test health check endpoints."""
    
    def test_health_check(self, client: TestClient):
        """Test basic health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data
    
    def test_health_check_structure(self, client: TestClient):
        """Test health check response structure."""
        response = client.get("/health")
        data = response.json()
        
        required_fields = ["status", "version", "timestamp", "services"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_health_check_services(self, client: TestClient):
        """Test health check includes service status."""
        response = client.get("/health")
        data = response.json()
        
        assert "services" in data
        services = data["services"]
        assert "database" in services
        assert services["database"] in ["healthy", "unhealthy"]
