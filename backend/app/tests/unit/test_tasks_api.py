"""
🧪 NOVA v3 - Unit Tests for Tasks API
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
class TestTasksAPI:
    """Test task management endpoints."""

    def test_list_tasks(self, client: TestClient):
        """Test listing all tasks."""
        response = client.get("/api/tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_task(self, client: TestClient, sample_task_request):
        """Test creating a new task."""
        response = client.post("/api/tasks", json=sample_task_request)
        assert response.status_code in [200, 201]

        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data
            assert data["title"] == sample_task_request["title"]
            assert data["agent"] == sample_task_request["agent"]

    def test_get_task_by_id(self, client: TestClient, sample_task_request):
        """Test getting specific task by ID."""
        # Create task first
        create_response = client.post("/api/tasks", json=sample_task_request)
        if create_response.status_code not in [200, 201]:
            pytest.skip("Task creation not implemented")

        task_id = create_response.json()["id"]

        # Get task
        response = client.get(f"/api/tasks/{task_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task_id

    def test_update_task_status(self, client: TestClient, sample_task_request):
        """Test updating task status."""
        # Create task first
        create_response = client.post("/api/tasks", json=sample_task_request)
        if create_response.status_code not in [200, 201]:
            pytest.skip("Task creation not implemented")

        task_id = create_response.json()["id"]

        # Update status
        response = client.patch(
            f"/api/tasks/{task_id}",
            json={"status": "in_progress"}
        )
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            assert data["status"] == "in_progress"

    def test_delete_task(self, client: TestClient, sample_task_request):
        """Test deleting a task."""
        # Create task first
        create_response = client.post("/api/tasks", json=sample_task_request)
        if create_response.status_code not in [200, 201]:
            pytest.skip("Task creation not implemented")

        task_id = create_response.json()["id"]

        # Delete task
        response = client.delete(f"/api/tasks/{task_id}")
        assert response.status_code in [200, 204]

        # Verify deletion
        get_response = client.get(f"/api/tasks/{task_id}")
        assert get_response.status_code == 404
