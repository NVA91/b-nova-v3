"""
🧙 NOVA v3 - Wizard API Routes
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.services.wizard import wizard_service


router = APIRouter(prefix="/api/wizard", tags=["wizard"])


class WorkflowCreate(BaseModel):
    """Workflow creation model."""
    name: str
    steps: List[Dict]


class WorkflowExecute(BaseModel):
    """Workflow execution model."""
    name: str
    context: Optional[Dict] = None


class AssistanceRequest(BaseModel):
    """Assistance request model."""
    agent: str
    task: Dict


@router.get("/status")
async def get_wizard_status():
    """Get Wizard service status."""
    return await wizard_service.get_status()


@router.get("/workflows")
async def list_workflows():
    """List all registered workflows."""
    return await wizard_service.list_workflows()


@router.post("/workflows")
async def create_workflow(workflow: WorkflowCreate):
    """Register a new workflow."""
    try:
        result = await wizard_service.register_workflow(
            name=workflow.name,
            steps=workflow.steps
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/workflows/execute")
async def execute_workflow(execution: WorkflowExecute):
    """Execute a registered workflow."""
    try:
        result = await wizard_service.execute_workflow(
            name=execution.name,
            context=execution.context
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assist")
async def request_assistance(request: AssistanceRequest):
    """Request Wizard assistance for an agent."""
    agent = request.agent.lower()
    task = request.task
    
    try:
        if agent == "forge":
            result = await wizard_service.assist_forge(task)
        elif agent == "phoenix":
            result = await wizard_service.assist_phoenix(task)
        elif agent == "guardian":
            result = await wizard_service.assist_guardian(task)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown agent: {agent}. Supported: forge, phoenix, guardian"
            )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
