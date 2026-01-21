"""
🧪 NOVA v3 - Unit Tests for Agents API
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
class TestAgentsAPI:
    """Test agents management endpoints."""
    
    def test_list_agents(self, client: TestClient):
        """Test listing all agents."""
        response = client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_agent_by_name(self, client: TestClient):
        """Test getting specific agent by name."""
        response = client.get("/api/agents/core")
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert data["name"] == "core"
            assert "status" in data
            assert "capabilities" in data
    
    def test_get_nonexistent_agent(self, client: TestClient):
        """Test getting non-existent agent returns 404."""
        response = client.get("/api/agents/nonexistent")
        assert response.status_code == 404
    
    def test_agent_status_endpoint(self, client: TestClient):
        """Test agent status endpoint."""
        response = client.get("/api/agents/core/status")
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "status" in data
            assert data["status"] in ["active", "inactive", "error"]
