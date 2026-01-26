"""
NOVA v3 - Tasks API Endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4

router = APIRouter()

# In-memory task storage (TODO: Replace with database)
TASKS = {}


class TaskCreate(BaseModel):
    """Task creation model"""
    agent_id: str
    action: str
    parameters: Optional[Dict] = {}


class TaskResponse(BaseModel):
    """Task response model"""
    task_id: str
    agent_id: str
    action: str
    parameters: Dict
    status: str
    created_at: str
    updated_at: str
    result: Optional[Dict] = None


@router.post("/tasks")
async def create_task(task: dict):
    """
    Create a new task for an agent
    Supports legacy payloads (title/agent/description) and new schema (agent_id/action/parameters)
    """
    # Normalize payload
    if "agent_id" not in task and "agent" in task:
        agent_id = task.get("agent")
    else:
        agent_id = task.get("agent_id")

    if "action" not in task and "title" in task:
        action = task.get("title")
    else:
        action = task.get("action")

    parameters = task.get("parameters", {})
    # Include legacy fields for traceability
    if "description" in task:
        parameters["description"] = task.get("description")

    task_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    
    task_data = {
        "task_id": task_id,
        "agent_id": agent_id,
        "action": action,
        "parameters": parameters,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "result": None
    }
    
    TASKS[task_id] = task_data
    # Return legacy response shape expected by tests
    return {
        "id": task_id,
        "title": action,
        "agent": agent_id,
        "parameters": parameters,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "result": None,
    }


@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(agent_id: Optional[str] = None, status: Optional[str] = None):
    """
    List all tasks with optional filters
    """
    tasks = list(TASKS.values())
    
    if agent_id:
        tasks = [t for t in tasks if t["agent_id"] == agent_id]
    
    if status:
        tasks = [t for t in tasks if t["status"] == status]
    
    return [TaskResponse(**t) for t in tasks]


@router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """
    Get specific task details (legacy response shape)
    """
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    t = TASKS[task_id]
    return {
        "id": task_id,
        "title": t["action"],
        "agent": t["agent_id"],
        "parameters": t["parameters"],
        "status": t["status"],
        "created_at": t["created_at"],
        "updated_at": t["updated_at"],
        "result": t.get("result"),
    }


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """
    Delete a task
    """
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    
    del TASKS[task_id]
    return {"message": f"Task '{task_id}' deleted"}


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, payload: dict):
    """Update a task (e.g., status) - legacy support"""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    task = TASKS[task_id]
    if "status" in payload:
        task["status"] = payload["status"]
        task["updated_at"] = datetime.utcnow().isoformat()
    return {
        "id": task_id,
        "title": task["action"],
        "agent": task["agent_id"],
        "parameters": task["parameters"],
        "status": task["status"],
        "created_at": task["created_at"],
        "updated_at": task["updated_at"],
        "result": task.get("result"),
    }


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    """
    Cancel a running task
    """
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    
    task = TASKS[task_id]
    if task["status"] in ["completed", "failed", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel task with status '{task['status']}'"
        )
    
    task["status"] = "cancelled"
    task["updated_at"] = datetime.utcnow().isoformat()
    
    return TaskResponse(**task)
