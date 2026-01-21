# NOVA v3 - Testing Guide

This guide provides instructions on how to run the tests for NOVA v3.

## 1. Prerequisites

- Python 3.11+
- Docker
- `requirements.txt` installed

## 2. Running Tests

To run all tests, use the following command from the `backend/` directory:

```bash
pytest
```

### Running Specific Tests

You can run specific tests using markers:

- **Unit tests:** `pytest -m unit`
- **Integration tests:** `pytest -m integration`
- **E2E tests:** `pytest -m e2e`

### Test Coverage

To generate a test coverage report, run:

```bash
pytest --cov=app
```

This will generate a report in the terminal and an HTML report in the `htmlcov/` directory.

## 3. Test Structure

- `tests/unit/`: Unit tests for individual components.
- `tests/integration/`: Integration tests for services and external dependencies.
- `tests/e2e/`: End-to-end tests for full system workflows.

## 4. Wizard Service

The Wizard service is a support service for the main KI agents. It provides pre-defined workflows to reduce the load on the agents.

### Wizard API

- `GET /api/wizard/status`: Get the status of the Wizard service.
- `GET /api/wizard/workflows`: List all registered workflows.
- `POST /api/wizard/workflows`: Create a new workflow.
- `POST /api/wizard/workflows/execute`: Execute a workflow.
- `POST /api/wizard/assist`: Request assistance for an agent.
