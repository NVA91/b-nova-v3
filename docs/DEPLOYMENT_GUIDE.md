# 🚀 NOVA v3 - Deployment Guide (mit Traefik)

Diese Anleitung beschreibt, wie du NOVA v3 auf einem Hostinger VPS (oder einem anderen Server) mit Traefik als Reverse Proxy deployen kannst.

## Voraussetzungen

- Ein Server mit Docker & Docker Compose
- SSH-Zugriff auf den Server
- Git installiert
- Eine Domain, die auf die IP deines Servers zeigt

## 1. Repository klonen

```bash
ssh user@your-server

git clone <repository-url>
cd nova-v3
```

## 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
nano .env
```

**Wichtig:**
- Ändere `SECRET_KEY` zu einem sicheren, zufälligen Wert!
- Setze `DOMAIN` auf deine Domain (z.B. `nova.example.com`)
- Setze `ACME_EMAIL` auf deine E-Mail-Adresse für Let's Encrypt

## 3. Anwendung starten

```bash
make build
make up
```

**Das war's!** Traefik kümmert sich automatisch um:
- ✅ Routing zum Frontend und Backend
- ✅ SSL-Zertifikate von Let's Encrypt
- ✅ HTTP zu HTTPS Redirect

NOVA v3 ist jetzt unter `https://your-domain.com` erreichbar.

## 4. Traefik Dashboard

Das Traefik Dashboard ist unter `http://your-domain.com:8080` erreichbar (aus Sicherheitsgründen nicht standardmäßig über HTTPS).

## 5. Updates

```bash
cd nova-v3
git pull
make build
make up
```
