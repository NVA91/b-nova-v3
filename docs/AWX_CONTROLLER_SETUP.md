# AWX Controller Setup Guide

## 🎯 Konzept: Sichere Test- und Automatisierungs-Zentrale

Die controller-Umgebung ist eine **isolierte Sandbox** mit zwei Hauptzwecken:

1. **Sicheres Testen**: Dedizierte Umgebung für Ansible-Playbook-Tests ohne Risiko für Production
2. **Automatisierungs-Hub**: Zentrale Plattform (AWX/Ansible Tower) zur Verwaltung, Ausführung und Überwachung von Ansible-Jobs

Vollständig getrennt von production mit eigenem Inventory, Variablen und Docker-Compose-Konfiguration.

---

## 📁 Architektur-Komponenten

### 1. Controller-Inventory (`/ansible/inventory/controller/`)

Definiert Test- und Management-Hosts:

- **`hosts.yml`**: 
  - `awx_servers`: AWX-Controller selbst
  - `test_hosts`: Test-Maschinen für sichere Playbook-Ausführung

### 2. AWX-Konfiguration (`/ansible/inventory/controller/group_vars/all/awx.yml`)

**Single Source of Truth** für AWX-Setup:

- **Projekte**: Git-Repositories (production/testing branches)
- **Inventories**: Production/Test Host-Gruppen
- **Credentials**: SSH-Keys, Vault-Passwords
- **Job-Templates**: Vordefinierte Ansible-Jobs (System Setup, VM-Provisioning, etc.)
- **Workflows**: Logische Job-Ketten mit Approval-Gates

### 3. Docker-Compose Stack (`/environments/controller/docker-compose.yml`)

Kompletter AWX-Stack:

- **awx-web**: Web-Interface & API (Port 8080)
- **awx-task**: Ansible Job Worker
- **awx-postgres**: PostgreSQL Database
- **awx-redis**: Redis Cache

**Besonderheiten**:
- Read-only Mount des Ansible-Projekts (`:ro`)
- SSH-Key-Durchreichung für Host-Zugriff
- Security hardening (no-new-privileges, cap_drop)

---

## 🚀 Setup und Inbetriebnahme

### Schritt 1: Umgebungsvariablen konfigurieren

```bash
cd environments/controller/
cp .env.example .env
```

**WICHTIG**: Editiere `.env` und setze:
- `AWX_SECRET_KEY` (generiere mit: `openssl rand -hex 32`)
- `AWX_ADMIN_PASSWORD` (sicheres Passwort)
- `POSTGRES_PASSWORD` (sicheres Passwort)

### Schritt 2: AWX-Stack starten

```bash
# Aus dem Hauptverzeichnis
docker-compose -f environments/controller/docker-compose.yml up -d
```

**Erste Startzeit**: ~5 Minuten (Datenbank-Initialisierung)

Prüfe Status:
```bash
docker-compose -f environments/controller/docker-compose.yml ps
docker logs awx-web
```

### Schritt 3: AWX-Konfiguration anwenden

Nach erfolgreichem AWX-Start:

1. **Installiere AWX-Collection**:
   ```bash
   ansible-galaxy collection install ansible.awx
   ```

2. **Exportiere Credentials** (oder setze in `.env`):
   ```bash
   export AWX_ADMIN_USER=admin
   export AWX_ADMIN_PASSWORD=your_secure_password
   export ANSIBLE_VAULT_PASSWORD=your_vault_password
   export GITHUB_TOKEN=your_github_token  # Optional für private Repos
   ```

3. **Führe Controller-Playbook aus**:
   ```bash
   ansible-playbook ansible/playbooks/controller.yml \
     -i ansible/inventory/controller/hosts.yml
   ```

Das Playbook konfiguriert automatisch:
- ✅ Organizations
- ✅ Projekte (production/testing branches)
- ✅ Inventories mit Git-Sync
- ✅ Credentials (SSH, Vault)
- ✅ 8 Job-Templates
- ✅ 2 Workflow-Templates
- ✅ 2 Schedules (Daily QA, Weekly Hardware Check)

---

## 🎮 Verwendung

### AWX Web-Interface

Öffne: **http://localhost:8080**

Login:
- Username: `admin`
- Password: (aus `.env` > `AWX_ADMIN_PASSWORD`)

### Vordefinierte Job-Templates

| Template | Beschreibung | Tags |
|----------|-------------|------|
| **Hardware Validation** | Pre-Flight Checks (CPU/RAM/Storage/GPU) | `hardware_validation,preflight` |
| **System Setup** | Proxmox Host-Konfiguration | `system_setup` |
| **Provision VMs** | Guest-VMs erstellen | `provision` |
| **Docker Setup** | Docker Engine installieren | `docker_setup` |
| **App Deployment** | Apps deployen | `app_deployment` |
| **QA Smoke Tests** | Smoke Tests ausführen | `qa_smoke` |
| **Deploy GPU Hookscript** | GPU-Passthrough installieren | `gpu_hookscript` |
| **Hardware Security Check** | IOMMU & PCI-Isolation prüfen | `hardware_security` |

### Workflow-Templates

#### 1. **Full Stack Deployment**
Komplette Deployment-Pipeline mit Approval-Gates:

1. Hardware Validation
2. System Setup
3. 🛑 **Approval**: VM Provisioning
4. Provision VMs
5. Docker Setup
6. 🛑 **Approval**: App Deployment
7. App Deployment
8. QA Smoke Tests

#### 2. **GPU Passthrough Setup**
GPU-Konfiguration mit Validierung:

1. Hardware Security Check
2. Deploy GPU Hookscript
3. System Setup (IOMMU Kernel-Params)

### Schedules

- **Daily QA Smoke Tests**: Täglich 02:00 UTC
- **Weekly Hardware Check**: Sonntags 03:00 UTC

---

## 🔒 Sicherheitsfeatures

### Container-Härtung
- ✅ `no-new-privileges: true`
- ✅ `cap_drop: ALL` + minimale Capabilities
- ✅ Read-only Ansible-Projekt-Mount
- ✅ Resource-Limits (CPU/Memory)

### Credential-Management
- ✅ Keine Plaintext-Passwörter in Git
- ✅ Ansible Vault für sensible Daten
- ✅ SSH-Keys read-only gemountet
- ✅ Credentials verschlüsselt in AWX-DB

### Netzwerk-Isolation
- ✅ Eigenes Bridge-Network (`172.25.0.0/16`)
- ✅ Keine Host-Network-Exposition
- ✅ API nur auf localhost

---

## 🛠️ Troubleshooting

### AWX startet nicht

```bash
# Logs prüfen
docker logs awx-web
docker logs awx-postgres

# Datenbank-Status
docker exec awx-postgres pg_isready -U awx

# Neustart
docker-compose -f environments/controller/docker-compose.yml restart
```

### Playbook-Konfiguration schlägt fehl

```bash
# AWX API Erreichbarkeit testen
curl http://localhost:8080/api/v2/ping/

# Credentials prüfen
echo $AWX_ADMIN_PASSWORD

# Verbose-Modus
ansible-playbook ansible/playbooks/controller.yml \
  -i ansible/inventory/controller/hosts.yml -vvv
```

### SSH-Verbindung zu Hosts schlägt fehl

```bash
# SSH-Key-Permissions prüfen
chmod 600 ~/.ssh/id_ansible_service

# Manuelle SSH-Verbindung testen
ssh -i ~/.ssh/id_ansible_service root@192.168.2.77

# AWX-Task-Container SSH-Config prüfen
docker exec awx-task ls -la /root/.ssh/
```

---

## 🔄 Updates und Wartung

### AWX-Version aktualisieren

```bash
# In .env: AWX_VERSION=24.7.0
docker-compose -f environments/controller/docker-compose.yml pull
docker-compose -f environments/controller/docker-compose.yml up -d
```

### AWX-Konfiguration neu anwenden

```bash
# Nach Änderungen in awx.yml
ansible-playbook ansible/playbooks/controller.yml \
  -i ansible/inventory/controller/hosts.yml
```

### Backup

```bash
# PostgreSQL Backup
docker exec awx-postgres pg_dump -U awx awx > awx-backup-$(date +%Y%m%d).sql

# Volume Backup
docker run --rm -v awx-postgres-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/awx-data-$(date +%Y%m%d).tar.gz /data
```

---

## 📚 Weitere Ressourcen

- [AWX Documentation](https://ansible.readthedocs.io/projects/awx/en/latest/)
- [Ansible AWX Collection](https://docs.ansible.com/ansible/latest/collections/ansible/awx/)
- [QUALITY_REPORT.md](../../QUALITY_REPORT.md) - Projekt-Quality-Report
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Production-Deployment

---

## 🤝 Best Practices

### ✅ DO
- Teste Playbooks zuerst in Controller-Umgebung
- Nutze Approval-Gates für kritische Änderungen
- Aktiviere Schedules für regelmäßige Validierung
- Backup AWX-Datenbank vor großen Änderungen
- Verwende separate Git-Branches für Testing

### ❌ DON'T
- Keine Production-Credentials in Test-Umgebung
- Kein direkter Production-Zugriff aus Controller
- Keine manuellen Änderungen in AWX (nutze `awx.yml`)
- Keine `.env` ins Git committen
