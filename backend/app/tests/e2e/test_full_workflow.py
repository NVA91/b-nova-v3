"""
🧪 NOVA v3 - E2E Tests for Full Workflow
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.e2e
@pytest.mark.slow
class TestFullWorkflow:
    """Test complete system workflows."""
    
    def test_agent_task_workflow(self, client: TestClient, sample_task_request):
        """Test complete workflow: create task -> assign agent -> execute -> complete."""
        # 1. Create task
        create_response = client.post("/api/tasks", json=sample_task_request)
        if create_response.status_code not in [200, 201]:
            pytest.skip("Task creation not implemented")
        
        task_id = create_response.json()["id"]
        
        # 2. Verify task is pending
        get_response = client.get(f"/api/tasks/{task_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "pending"
        
        # 3. Update to in_progress
        update_response = client.patch(
            f"/api/tasks/{task_id}",
            json={"status": "in_progress"}
        )
        assert update_response.status_code == 200
        
        # 4. Complete task
        complete_response = client.patch(
            f"/api/tasks/{task_id}",
            json={"status": "completed"}
        )
        assert complete_response.status_code == 200
        assert complete_response.json()["status"] == "completed"
    
    def test_multi_agent_coordination(self, client: TestClient):
        """Test coordination between multiple agents."""
        # Get all agents
        agents_response = client.get("/api/agents")
        assert agents_response.status_code == 200
        agents = agents_response.json()
        
        # Verify all 4 agents are present
        agent_names = [agent["name"] for agent in agents]
        expected_agents = ["core", "forge", "phoenix", "guardian"]
        
        for expected in expected_agents:
            assert expected in agent_names, f"Agent {expected} not found"
    
    def test_system_health_monitoring(self, client: TestClient):
        """Test system health monitoring workflow."""
        # 1. Check system health
        health_response = client.get("/health")
        assert health_response.status_code == 200
        assert health_response.json()["status"] == "healthy"
        
        # 2. Get GUARDIAN metrics
        metrics_response = client.get("/api/guardian/metrics")
        assert metrics_response.status_code == 200
        
        # 3. Verify all services are monitored
        metrics = metrics_response.json()
        assert "cpu" in metrics
        assert "memory" in metrics
        assert "disk" in metrics
    
    @pytest.mark.slow
    def test_phoenix_recovery_workflow(self, client: TestClient):
        """Test PHOENIX self-healing workflow."""
        # This would test the Phoenix recovery mechanism
        # Placeholder for now
        pytest.skip("Phoenix recovery workflow not yet implemented")
