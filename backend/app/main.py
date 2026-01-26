"""
NOVA v3 - Main FastAPI Application
4-Agenten-Architektur: CORE, FORGE, PHOENIX, GUARDIAN
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .api.routes import agents, health, tasks, guardian, wizard

# Ensure models are imported so their tables exist during tests
import app.models

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="NOVA v3 - AI-Agent System for Infrastructure-as-Code",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
# Mount both v1 and legacy /api prefixes for backward compatibility
app.include_router(agents.router, prefix=settings.API_V1_PREFIX, tags=["Agents"])
app.include_router(agents.router, prefix="/api", tags=["Agents (legacy)"])
app.include_router(tasks.router, prefix=settings.API_V1_PREFIX, tags=["Tasks"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks (legacy)"])
app.include_router(guardian.router, prefix=settings.API_V1_PREFIX, tags=["Guardian"])
app.include_router(guardian.router, prefix="/api", tags=["Guardian (legacy)"])
app.include_router(wizard.router, tags=["Wizard"])


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"📂 Debug mode: {settings.DEBUG}")
    print(f"🤖 Agents enabled: CORE={settings.AGENT_CORE_ENABLED}, "
          f"FORGE={settings.AGENT_FORGE_ENABLED}, "
          f"PHOENIX={settings.AGENT_PHOENIX_ENABLED}, "
          f"GUARDIAN={settings.AGENT_GUARDIAN_ENABLED}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print(f"🛑 {settings.APP_NAME} shutting down...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "agents": {
            "core": settings.AGENT_CORE_ENABLED,
            "forge": settings.AGENT_FORGE_ENABLED,
            "phoenix": settings.AGENT_PHOENIX_ENABLED,
            "guardian": settings.AGENT_GUARDIAN_ENABLED,
        }
    }
