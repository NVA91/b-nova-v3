# 🚀 NOVA v3 - AI Agent Dashboard

Ein komplettes Re-Build von NOVA v3 mit einer modernen Architektur: FastAPI Backend, React/TypeScript Frontend und Tailwind CSS.

## 🎯 Projektziele

- **Moderne Architektur:** FastAPI + React + TypeScript + Tailwind CSS
- **4-Agenten-System:** CORE, FORGE, PHOENIX, GUARDIAN
- **Docker-basiert:** Einfaches Setup und Deployment
- **Ressourcenschonend:** Optimiert für Mini-PCs
- **Erweiterbar:** Saubere Trennung von Backend und Frontend

## 📁 Projektstruktur

```text
nnova-v3/
├── backend/          # 🐍 FastAPI Backend
│   ├── app/          # App-Logik
│   ├── tests/        # Tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # ⚛️ React Frontend
│   ├── src/          # Source Code
│   ├── public/       # Statische Dateien
│   ├── Dockerfile
│   └── package.json
├── docs/             # 📖 Dokumentation
├── .github/          # CI/CD Workflows
├── docker-compose.yml # Haupt-Setup
├── Makefile          # Einfache Befehle
└── README.md         # Diese Datei
```

## 🐦‍🔥 Phoenix Moment - Quickstart von 0

Mit dem `bootstrap.sh`-Script kannst du NOVA v3 von 0 auf 100 bringen - inklusive Datenbank-Setup und Seed-Daten.

```bash
./bootstrap.sh
```
Für Backup/Recovery‑Primitives und Anweisungen zum schnellen Wiederherstellen (inkl. `--backup`/`--recover`) siehe `docs/RECOVERY.md`.

Hinweis: Es gibt einen kleinen Test zur Überprüfung der Dump‑Parsing‑Logik (Version, Rollen, Extensions) unter `tests/dump_parsing_tests.sh` — führe `./tests/dump_parsing_tests.sh` lokal aus, um die Regex-Parsing-Logik zu validieren.
## ⚡ Kurz & Knapp — Quick Commands

- App starten: `make up`
- App stoppen: `make down`
- AWX Controller starten: `make controller-up`
- AWX Controller konfigurieren: `make controller-configure`
- Schnelltests (Runner): `AI_SERVICE_URL="http://localhost:8000" TEST_IMAGE="./tests/test-image.jpg" bash tests/run-all-tests.sh`


## 🚀 Manueller Quickstart

### Voraussetzungen

- Docker & Docker Compose installiert
- WSL2 (für Windows-Benutzer)

### 1. Repository klonen

```bash
git clone <repository-url>
cd nova-v3
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
nano .env  # Passe die Werte an deine Umgebung an
```

### 3. Anwendung starten

```bash
make build
make up
```

**Das war's!** NOVA v3 ist jetzt erreichbar:

- **Frontend:** <http://localhost>
- **Backend API:** <http://localhost:8000>
- **API Docs:** <http://localhost:8000/api/docs>

## 🎮 Makefile-Kommandos

- `make build`: Baut alle Docker-Images
- `make up`: Startet alle Services
- `make down`: Stoppt alle Services
- `make logs`: Zeigt Logs an
- `make clean`: Löscht alle Container und Volumes
- `make test`: Führt Backend-Tests aus
- `make controller-up`: Startet den AWX-Controller Stack
- `make controller-ps`: Zeigt Status des AWX-Controller Stacks
- `make controller-logs`: Tailed Logs vom AWX-Controller Stack
- `make controller-down`: Stoppt den AWX-Controller Stack
- `make controller-deps`: Installiert Ansible Collections (inkl. `awx.awx`)
- `make controller-configure`: Konfiguriert AWX via Controller-Playbook

Mehr: `docs/QUICKSTART.md`

[![Run Test Runner](https://github.com/NVA91/b-nova-v3/actions/workflows/runner-dispatch.yml/badge.svg)](https://github.com/NVA91/b-nova-v3/actions/workflows/runner-dispatch.yml)  
*Run Test Runner (manual)*

## 🧰 Controller (AWX) Quickstart

Der Controller ist eine isolierte AWX-Sandbox (Web + Task + Postgres + Redis) mit Read-only Projekt-Mount und SSH-Key-Passthrough.

```bash
cp environments/controller/.env.example environments/controller/.env
# setze in environments/controller/.env mindestens:
# - AWX_SECRET_KEY
# - AWX_ADMIN_PASSWORD
# - POSTGRES_PASSWORD

make controller-up
make controller-ps
```

AWX UI: <http://localhost:8080>

Ausführliche Anleitung: `docs/AWX_CONTROLLER_SETUP.md` und `docs/CONTROLLER_SETUP.md`.

## 🏗️ Architektur

- **Backend:** FastAPI, PostgreSQL, SQLAlchemy
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Deployment:** Docker Compose

## 🤖 4-Agenten-System

- **CORE:** 🧠 Orchestrator
- **FORGE:** ⚒️ Development + Deployment
- **PHOENIX:** 🐦‍🔥 DevOps + Self-Healing
- **GUARDIAN:** 🛡️ Monitoring + Security

## 🤝 Contributing

Beiträge sind willkommen! Bitte beachte:

1. Teste alle Änderungen lokal mit `make test`
2. Dokumentiere neue Features in `docs/`
3. Halte die Trennung zwischen `backend/` und `frontend/` ein

## 📜 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Nova
