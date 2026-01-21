"""
🧪 NOVA v3 - Pytest Configuration and Shared Fixtures
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.config import settings


# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def nova_config():
    """NOVA v3 configuration for tests."""
    return {
        "agents": ["core", "forge", "phoenix", "guardian"],
        "api_url": "http://localhost:8000",
        "frontend_url": "http://localhost:3000",
        "database_url": settings.DATABASE_URL,
    }


@pytest.fixture
def mock_agent_response():
    """Mock agent response for testing."""
    return {
        "agent": "core",
        "status": "success",
        "response": "Mock response from CORE agent",
        "timestamp": "2026-01-17T00:00:00Z",
        "metadata": {
            "model": "gpt-4.1-mini",
            "tokens": 100
        }
    }


@pytest.fixture
def sample_task_request():
    """Sample task request for testing."""
    return {
        "title": "Test Task",
        "description": "This is a test task",
        "agent": "forge",
        "priority": "medium",
        "status": "pending"
    }


@pytest.fixture
def sample_agent_data():
    """Sample agent data for testing."""
    return [
        {
            "name": "core",
            "status": "active",
            "description": "Central orchestrator agent",
            "capabilities": ["routing", "coordination", "decision-making"]
        },
        {
            "name": "forge",
            "status": "active",
            "description": "Development and deployment agent",
            "capabilities": ["coding", "deployment", "ci-cd"]
        },
        {
            "name": "phoenix",
            "status": "active",
            "description": "DevOps and self-healing agent",
            "capabilities": ["monitoring", "recovery", "backup"]
        },
        {
            "name": "guardian",
            "status": "active",
            "description": "Security and monitoring agent",
            "capabilities": ["security-scan", "resource-monitoring", "alerts"]
        }
    ]


@pytest.fixture
def auth_headers():
    """Authentication headers for testing."""
    return {
        "Authorization": "Bearer test-token-12345",
        "Content-Type": "application/json"
    }
