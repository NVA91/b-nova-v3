---
applyTo: 'backend/**'
description: Backend-Reparatur und Test-Guidelines für Python/FastAPI
---

# Backend Fix Guidelines

Beim Arbeiten am Backend-Code beachte folgende Richtlinien:

## Dependencies
- Alle Python-Dependencies sind in backend/requirements.txt definiert
- Installiere mit pip install -r backend/requirements.txt

## Testing
- Tests befinden sich in backend/tests/
- Führe Tests aus mit pytest backend/tests/ -v
- Vor Tests: .env temporär umbenennen um Konflikte zu vermeiden

## API-Struktur
- FastAPI-Router befinden sich in backend/app/routers/
- Jeder Router sollte korrekte Response-Models verwenden
- Legacy-APIs unter /api/agents und /api/tasks

## Code-Stil
- Verwende Type Hints für alle Funktionen
- HTTPException für Fehler (400 für Client-Fehler, 500 für Server-Fehler)
- Alle Endpoints sollten JSON zurückgeben
