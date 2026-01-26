# Docker-Anwendungs-Setup

Diese Rolle installiert und startet folgende Anwendungen:

- Traefik (Reverse Proxy)
- Paperless (Dokumentenverwaltung)
- N8N (Workflow-Automation)

## Konfiguration

Die zu installierenden Anwendungen werden über `docker_apps` definiert.

## Struktur

Dateien liegen in:

- `/opt/<appname>/docker-compose.yml`

## Start / Restart

```bash
docker compose -f /opt/traefik/docker-compose.yml up -d
```