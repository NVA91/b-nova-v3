# Test Runner — b-nova-v3

Dieses Verzeichnis enthält den Master Test Runner für den AI-Service.

## Ausführen

Der Runner erwartet ein laufendes Backend und eine Test-Image-Datei.

- Standardwerte:
  - AI_SERVICE_URL: `http://localhost:8000`
  - TEST_IMAGE: `./tests/test-image.jpg`

Beispiel: (im Projekt-Root)

```bash
# 1) Backend (Docker Compose) starten (falls noch nicht):
#    docker compose up -d backend db

# 2) Test image bereitstellen (oder Pfad angeben):
#    cp /path/to/sample.jpg ./tests/test-image.jpg

# 3) Runner starten (Fail-Fast, Timeouts per Test konfiguriert):
AI_SERVICE_URL="http://localhost:8000" TEST_IMAGE="./tests/test-image.jpg" bash tests/run-all-tests.sh
```

## Voraussetzungen

- Docker / Docker Compose installiert und erreichbar
- Backend-Service läuft und ist unter `SERVICE_URL` erreichbar
- Node.js (für lokale Testskripte) — die Testskripte sind Node-Programme (z. B. `test-integration.js`)
- Die Datei `TEST_IMAGE` existiert und ist zugänglich

## Verhalten

- Tests laufen nacheinander mit vorkonfigurierten Timeouts. Beim ersten Fehler bricht der Runner (Fail-Fast).
- Ausgaben zeigen eine kurze Zusammenfassung mit Passed/Failed/Total.

---

Wenn du möchtest, kann ich eine CI‑Job‑Vorlage (GitHub Actions) hinzufügen, die diesen Runner als Step ausführt (nur wenn die Infrastruktur verfügbar ist).
