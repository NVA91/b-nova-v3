"""
NOVA v3 - Agents API Endpoints
4-Agenten-Architektur: CORE, FORGE, PHOENIX, GUARDIAN
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from ...config import get_settings

router = APIRouter()
settings = get_settings()

# Agent definitions
AGENTS = {
    "core": {
        "id": "core",
        "name": "CORE",
        "emoji": "🧠",
        "role": "Orchestrator",
        "description": "Der Kopf - orchestriert alle anderen Agenten",
        "enabled": settings.AGENT_CORE_ENABLED,
        "capabilities": ["routing", "orchestration", "decision_making"]
    },
    "forge": {
        "id": "forge",
        "name": "FORGE",
        "emoji": "⚒️",
        "role": "Development + Deployment",
        "description": "Entwicklung und Deployment von Services",
        "enabled": settings.AGENT_FORGE_ENABLED,
        "capabilities": ["coding", "deployment", "docker", "ansible"]
    },
    "phoenix": {
        "id": "phoenix",
        "name": "PHOENIX",
        "emoji": "🐦‍🔥",
        "role": "DevOps + Self-Healing",
        "description": "DevOps-Automatisierung und Selbstheilung",
        "enabled": settings.AGENT_PHOENIX_ENABLED,
        "capabilities": ["devops", "backup", "restore", "self_healing"]
    },
    "guardian": {
        "id": "guardian",
        "name": "GUARDIAN",
        "emoji": "🛡️",
        "role": "Monitoring + Security",
        "description": "System-Monitoring und Sicherheit",
        "enabled": settings.AGENT_GUARDIAN_ENABLED,
        "capabilities": ["monitoring", "security", "resource_management"]
    }
}


@router.get("/agents", response_model=List[Dict])
async def list_agents():
    """
    List all available agents (legacy API returns 'name' as id)
    """
    results = []
    for a in AGENTS.values():
        # legacy-friendly: 'name' contains lowercase id, keep 'display_name' for original label
        results.append({
            "id": a["id"],
            "name": a["id"],
            "display_name": a["name"],
            "emoji": a["emoji"],
            "role": a["role"],
            "description": a["description"],
            "enabled": a["enabled"],
            "capabilities": a["capabilities"],
        })
    return results


@router.get("/agents/{agent_id}", response_model=Dict)
async def get_agent(agent_id: str):
    """
    Get specific agent details (legacy: return 'name' as id)
    """
    if agent_id not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    agent = AGENTS[agent_id]
    if not agent["enabled"]:
        raise HTTPException(status_code=503, detail=f"Agent '{agent_id}' is disabled")

    return {
        "id": agent["id"],
        "name": agent["id"],
        "display_name": agent["name"],
        "emoji": agent["emoji"],
        "role": agent["role"],
        "description": agent["description"],
        "enabled": agent["enabled"],
        "status": "active" if agent["enabled"] else "inactive",
        "capabilities": agent["capabilities"],
    }


@router.post("/agents/{agent_id}/execute")
async def execute_agent_task(agent_id: str, task: Dict):
    """
    Execute a task with specific agent
    """
    if agent_id not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    agent = AGENTS[agent_id]
    if not agent["enabled"]:
        raise HTTPException(status_code=503, detail=f"Agent '{agent_id}' is disabled")

    # TODO: Implement actual task execution logic
    return {
        "agent_id": agent_id,
        "agent_name": agent["name"],
        "task": task,
        "status": "queued",
        "message": f"Task queued for {agent['name']}"
    }


@router.get("/agents/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """
    Get agent status and metrics
    """
    if agent_id not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

    agent = AGENTS[agent_id]
    # normalize status to active/inactive/error for legacy tests
    status = "active" if agent["enabled"] else "inactive"
    return {
        "agent_id": agent_id,
        "agent_name": agent["id"],
        "enabled": agent["enabled"],
        "status": status,
        "tasks_running": 0,  # TODO: Implement actual task tracking
        "tasks_completed": 0,
    }
