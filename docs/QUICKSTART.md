# Quickstart — Kurz & Knapp ⚡

Diese Seite enthält die minimalen Befehle, um schnell loszulegen.

## App (lokal)

1. Environment kopieren:

```bash
cp .env.example .env
# Werte anpassen (POSTGRES_PASSWORD, SECRET_KEY ...)
```

2. Start:

```bash
make build
make up
```

Zugriff:

- Frontend: <http://localhost>
- Backend API: <http://localhost:8000>

---

## AWX Controller (isolierter Automation Hub)

Kurz & Knapp (2 Befehle):

```bash
cd environments/controller
cp .env.example .env   # setze AWX_SECRET_KEY, AWX_ADMIN_PASSWORD, POSTGRES_PASSWORD
make controller-up
```

Controller konfigurieren:

```bash
make controller-deps
make controller-configure
```

AWX UI: <http://localhost:8080>

---

## Tests (Runner)

Schnelltest (lokal):

```bash
AI_SERVICE_URL="http://localhost:8000" TEST_IMAGE="./tests/test-image.jpg" bash tests/run-all-tests.sh
```

Hinweis: Der Runner prüft Health, Integration und Performance-Tests in Reihenfolge (Fail-Fast).

---

## CI Quickstart

- Push auf `main` startet den Quickstart CI (Ansible Syntax, Backend Tests, Frontend Build, Compose-Config-Validation).
- Manuelle Ausführung: GitHub Actions → Workflow `NOVA v3 Quickstart CI` → `Run workflow`.

---

Weitere Details findest du in `docs/CONTROLLER_SETUP.md` und `docs/AWX_CONTROLLER_SETUP.md`.
