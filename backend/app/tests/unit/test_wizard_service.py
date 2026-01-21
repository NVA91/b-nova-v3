"""
🧪 NOVA v3 - Unit Tests for Wizard Service
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
class TestWizardService:
    """Test Wizard support service."""
    
    def test_wizard_status(self, client: TestClient):
        """Test getting Wizard service status."""
        response = client.get("/api/wizard/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "service" in data
        assert data["service"] == "wizard"
        assert "status" in data
        assert "workflows_registered" in data
    
    def test_list_workflows(self, client: TestClient):
        """Test listing workflows."""
        response = client.get("/api/wizard/workflows")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_workflow(self, client: TestClient):
        """Test creating a new workflow."""
        workflow = {
            "name": "test_workflow",
            "steps": [
                {"type": "check", "name": "Check status"},
                {"type": "command", "name": "Run command", "command": "echo test"}
            ]
        }
        
        response = client.post("/api/wizard/workflows", json=workflow)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "test_workflow"
        assert len(data["steps"]) == 2
    
    def test_execute_workflow(self, client: TestClient):
        """Test executing a workflow."""
        # Create workflow first
        workflow = {
            "name": "test_exec_workflow",
            "steps": [
                {"type": "wait", "duration": 0.1}
            ]
        }
        client.post("/api/wizard/workflows", json=workflow)
        
        # Execute workflow
        execution = {
            "name": "test_exec_workflow",
            "context": {}
        }
        
        response = client.post("/api/wizard/workflows/execute", json=execution)
        assert response.status_code == 200
        
        data = response.json()
        assert data["workflow"] == "test_exec_workflow"
        assert "status" in data
        assert "results" in data
    
    def test_assist_forge(self, client: TestClient):
        """Test Wizard assistance for FORGE agent."""
        request = {
            "agent": "forge",
            "task": {
                "title": "Deploy application",
                "profile": "minimal"
            }
        }
        
        response = client.post("/api/wizard/assist", json=request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["agent"] == "forge"
        assert "assistance" in data
        assert "steps" in data
    
    def test_assist_phoenix(self, client: TestClient):
        """Test Wizard assistance for PHOENIX agent."""
        request = {
            "agent": "phoenix",
            "task": {
                "title": "Service recovery",
                "recovery_type": "service_restart"
            }
        }
        
        response = client.post("/api/wizard/assist", json=request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["agent"] == "phoenix"
        assert "assistance" in data
        assert "steps" in data
    
    def test_assist_guardian(self, client: TestClient):
        """Test Wizard assistance for GUARDIAN agent."""
        request = {
            "agent": "guardian",
            "task": {
                "title": "Collect metrics",
                "monitoring_type": "metrics_collection"
            }
        }
        
        response = client.post("/api/wizard/assist", json=request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["agent"] == "guardian"
        assert "assistance" in data
        assert "steps" in data
    
    def test_assist_unknown_agent(self, client: TestClient):
        """Test Wizard assistance with unknown agent returns error."""
        request = {
            "agent": "unknown",
            "task": {"title": "Test"}
        }
        
        response = client.post("/api/wizard/assist", json=request)
        assert response.status_code == 400
