# 🚀 NOVA v3 - AI Agent Dashboard

Ein komplettes Re-Build von NOVA v3 mit einer modernen Architektur: FastAPI Backend, React/TypeScript Frontend und Tailwind CSS.

## 🎯 Projektziele

- **Moderne Architektur:** FastAPI + React + TypeScript + Tailwind CSS
- **4-Agenten-System:** CORE, FORGE, PHOENIX, GUARDIAN
- **Docker-basiert:** Einfaches Setup und Deployment
- **Ressourcenschonend:** Optimiert für Mini-PCs
- **Erweiterbar:** Saubere Trennung von Backend und Frontend

## 📁 Projektstruktur

```
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

- **Frontend:** http://localhost
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs

## 🎮 Makefile-Kommandos

- `make build`: Baut alle Docker-Images
- `make up`: Startet alle Services
- `make down`: Stoppt alle Services
- `make logs`: Zeigt Logs an
- `make clean`: Löscht alle Container und Volumes
- `make test`: Führt Backend-Tests aus

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
