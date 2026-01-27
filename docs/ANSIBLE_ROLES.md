# Neue Ansible-Rollen

Es wurden vier neue Rollen erstellt, die jeweils einen der erweiterten Dienste abdecken:

- apps/n8n_deployment
- apps/telegram_voice_assistant
- monitoring/monitoring_stack
- infrastructure/wireguard_setup

## group_vars für erweiterte Dienste

Die Datei `ansible/inventory/production/group_vars/all/extended_services.yml` wurde erstellt, um die Aktivierung der Dienste und globale Konfigurationen zu steuern.

**Wichtige Variablen:**

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| extended_services_n8n_enabled | N8N aktivieren | true |
| extended_services_telegram_enabled | Telegram Voice Assistant aktivieren | true |
| extended_services_monitoring_enabled | Monitoring-Stack aktivieren | true |
| extended_services_wireguard_enabled | WireGuard VPN aktivieren | false |
| n8n_basic_auth_user | N8N Basic Auth User | admin |
| n8n_basic_auth_password | N8N Basic Auth Passwort (MUSS überschrieben werden!) | changeme |
| n8n_db_type | N8N Datenbank-Typ | postgresdb |
| n8n_db_name | N8N Datenbank Name | n8n |
| n8n_db_user | N8N Datenbank User | n8n |
| n8n_db_password | N8N Datenbank Passwort (MUSS überschrieben werden!) | changeme |
| n8n_telegram_bot_token | N8N Telegram Bot Token | "" |
| telegram_bot_token | Telegram Voice Bot Token (ERFORDERLICH!) | "" |
| telegram_voice_whisper_mode | Whisper-Modus | local |
| telegram_voice_whisper_model | Whisper-Modell | base |
| telegram_voice_openai_api_key | OpenAI API Key | "" |
| grafana_admin_user | Grafana Admin User | admin |
| grafana_admin_password | Grafana Admin Passwort (MUSS überschrieben werden!) | changeme |
| prometheus_retention_time | Prometheus Retention | 30d |
| monitoring_internal_targets | Interne Monitoring-Ziele | [backend:8000, frontend:80, ai-service:8000] |
| monitoring_http_targets | Externe HTTP-Ziele | [https://www.google.com, https://github.com] |
| monitoring_icmp_targets | ICMP-Ziele | [8.8.8.8, 1.1.1.1] |
| wireguard_serverurl | WireGuard Server URL | auto |
| wireguard_port | WireGuard Port | 51820 |
| wireguard_peers | WireGuard Peers | 3 |
| wireguard_peerdns | WireGuard DNS | auto |
| wireguard_subnet | WireGuard Subnet | 10.13.13.0 |
| wireguard_allowedips | WireGuard AllowedIPs | 0.0.0.0/0 |
| wireguard_firewall_interface | Firewall Interface | eno1 |
| n8n_traefik_enabled | N8N Traefik aktivieren | true |
| prometheus_traefik_enabled | Prometheus Traefik aktivieren | true |
| grafana_traefik_enabled | Grafana Traefik aktivieren | true |
| n8n_traefik_tls_enabled | N8N HTTPS aktivieren | false |
| prometheus_traefik_tls_enabled | Prometheus HTTPS aktivieren | false |
| grafana_traefik_tls_enabled | Grafana HTTPS aktivieren | false |
| n8n_systemd_enabled | N8N Systemd aktivieren | true |
| telegram_voice_systemd_enabled | Telegram Voice Systemd aktivieren | true |

## Optimierung und Integration

- **Modulare Struktur:** Jede Rolle ist eigenständig und kann separat deployed werden.
- **Tags:** Ermöglichen selektives Deployment einzelner Dienste.
- **when-Bedingungen:** Dienste können über group_vars oder host_vars aktiviert/deaktiviert werden.
- **Idempotenz:** Alle Rollen sind idempotent, d.h., sie können mehrfach ausgeführt werden, ohne unerwünschte Nebenwirkungen zu haben.
- **Check-Modus-Support:** Das Playbook kann mit `--check` ausgeführt werden, um potenzielle Änderungen zu simulieren.

## Playbook für erweiterte Dienste

Ein neues Playbook `extended_services.yml` wurde erstellt, um alle neuen Rollen zu orchestrieren.

**Pfad:** ansible/playbooks/extended_services.yml

**Struktur:**
```yaml
- name: "NOVA v3 - Extended Services Deployment"
  hosts: nova_guests
  become: no
  gather_facts: yes

  pre_tasks:
    # Preflight-Checks für Docker, Docker Compose, nova-network

  roles:
    - role: apps/n8n_deployment
      tags: [extended, automation, n8n]
      when: extended_services_n8n_enabled | default(true)

    - role: apps/telegram_voice_assistant
      tags: [extended, automation, telegram]
      when: extended_services_telegram_enabled | default(true)

    - role: monitoring/monitoring_stack
      tags: [extended, monitoring, prometheus, grafana]
      when: extended_services_monitoring_enabled | default(true)

    - role: infrastructure/wireguard_setup
      tags: [extended, infrastructure, vpn, wireguard]
      when: extended_services_wireguard_enabled | default(false)

  post_tasks:
    # Validierung und Zusammenfassung des Deployments
```

**Verwendung:**
```bash
# Alle erweiterten Dienste deployen
ansible-playbook -i inventory/production/ extended_services.yml

# Nur N8N deployen
ansible-playbook -i inventory/production/ extended_services.yml --tags n8n

# Nur Monitoring deployen
ansible-playbook -i inventory/production/ extended_services.yml --tags monitoring

# Im Check-Modus ausführen (keine Änderungen)
ansible-playbook -i inventory/production/ extended_services.yml --check
```

## 3. Deployment-Szenarien

### 3.1. Check-Modus (Dry-Run)
Simulieren Sie das Deployment ohne Änderungen:
```bash
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --check
```

### 3.2. Alle erweiterten Dienste deployen
```bash
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ playbooks/extended_services.yml
```

### 3.3. Einzelne Dienste deployen
Nur N8N:
```bash
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --tags n8n
```

Nur Telegram Voice Assistant:
```bash
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --tags telegram
```

Nur Monitoring:
```bash
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --tags monitoring
```

Nur WireGuard:
```bash
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --tags wireguard
```

## 1.1. apps/n8n_deployment

**Zweck:** Bereitstellung und Konfiguration des N8N Workflow-Automatisierungs-Tools.

**Verzeichnis:** ansible/roles/apps/n8n_deployment

**Wichtige Dateien:**
- defaults/main.yml: Standardwerte für N8N-Konfiguration (Ports, Basic Auth, Datenbank, Traefik-Integration).
- tasks/main.yml: Haupt-Tasks für Verzeichnis-Erstellung, Datenbank-Vorbereitung, Docker Compose-Rendering und Service-Start.
- templates/docker-compose.yml.j2: Jinja2-Template für die N8N Docker Compose-Datei.
- templates/n8n.env.j2: Jinja2-Template für die N8N .env-Datei.
- templates/n8n.service.j2: Systemd Service-Template für Autostart.
- handlers/main.yml: Handler für Systemd-Reload und N8N-Neustart.

### Konfigurierbare Variablen (vollständig)

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| n8n_base_path | Base-Pfad für N8N Installation | /opt/docker-compose/n8n |
| n8n_data_path | Data-Pfad für N8N | /opt/docker-data/n8n |
| n8n_version | N8N Docker Image Version | latest |
| n8n_port | N8N Port | 5678 |
| n8n_host | N8N Host | ansible_fqdn |
| n8n_protocol | Protokoll (http/https) | http |
| n8n_webhook_url | Webhook URL | `http://host/n8n/` |
| n8n_basic_auth_active | Basic Auth aktivieren | true |
| n8n_basic_auth_user | Basic Auth Benutzer | admin |
| n8n_basic_auth_password | Basic Auth Passwort (MUSS überschrieben werden!) | changeme |
| n8n_timezone | Zeitzone | Europe/Berlin |
| n8n_db_type | Datenbank-Typ | postgresdb |
| n8n_db_host | Datenbank Host | db |
| n8n_db_port | Datenbank Port | 5432 |
| n8n_db_name | Datenbank Name | n8n |
| n8n_db_user | Datenbank Benutzer | n8n |
| n8n_db_password | Datenbank Passwort (MUSS überschrieben werden!) | n8n_password |
| n8n_telegram_bot_token | Telegram Bot Token für Workflows | "" |
| n8n_security_opts | Security Options | ["seccomp:unconfined", "no-new-privileges:true"] |
| n8n_cap_drop | Dropped Capabilities | ["ALL"] |
| n8n_traefik_enabled | Traefik Integration aktivieren | true |
| n8n_traefik_entrypoint | Traefik Entrypoint | web |
| n8n_traefik_rule | Traefik Routing Rule | Host(host) && PathPrefix(/n8n) |
| n8n_traefik_tls_enabled | HTTPS aktivieren | false |
| n8n_traefik_certresolver | Let's Encrypt Resolver | letsencrypt |
| n8n_systemd_enabled | Systemd Service aktivieren | true |
| n8n_restart_policy | Docker Restart Policy | unless-stopped |
| n8n_backup_enabled | Backup aktivieren | false |
| n8n_backup_path | Backup-Pfad | /opt/backups/n8n |
| n8n_backup_retention_days | Backup Retention | 30 |

## 1.2. apps/telegram_voice_assistant

**Zweck:** Bereitstellung und Konfiguration des Telegram Voice Assistant, der Sprachnachrichten in Text und Dokumente umwandelt.

**Verzeichnis:** ansible/roles/apps/telegram_voice_assistant

**Wichtige Dateien:**
- defaults/main.yml: Standardwerte für Bot-Token, Whisper-Konfiguration (lokal/Cloud), Backend-Integration.
- tasks/main.yml: Haupt-Tasks für Verzeichnis-Erstellung, Kopieren der Service-Dateien, Docker Compose-Rendering und Service-Start.
- templates/docker-compose.yml.j2: Jinja2-Template für die Docker Compose-Datei des Voice Assistant.
- templates/telegram-voice.env.j2: Jinja2-Template für die .env-Datei des Voice Assistant.
- templates/telegram-voice.service.j2: Systemd Service-Template für Autostart.
- handlers/main.yml: Handler für Systemd-Reload und Service-Neustart.

### Konfigurierbare Variablen (vollständig)

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| telegram_voice_base_path | Base-Pfad für Installation | /opt/docker-compose/telegram-voice-assistant |
| telegram_voice_data_path | Data-Pfad | /opt/docker-data/telegram-voice |
| telegram_voice_build_context | Build-Kontext Pfad | playbook_dir/../services/telegram-voice-assistant |
| telegram_voice_container_name | Docker Container Name | nova-v3-telegram-voice |
| telegram_bot_token | Telegram Bot Token (ERFORDERLICH!) | "" |
| telegram_voice_whisper_mode | Whisper-Modus (local/cloud) | local |
| telegram_voice_whisper_model | Whisper-Modell | base |
| telegram_voice_whisper_device | Whisper-Device (cpu/cuda) | cpu |
| telegram_voice_openai_api_key | OpenAI API Key (für Cloud-Modus) | "" |
| telegram_voice_backend_url | Backend API URL | `http://backend:8000/api` |
| telegram_voice_ai_service_url | AI-Service URL | `http://ai-service:8000` |
| telegram_voice_template_path | Template-Pfad im Container | /app/templates |
| telegram_voice_output_path | Output-Pfad im Container | /app/output |
| telegram_voice_log_level | Log-Level | INFO |
| telegram_voice_security_opts | Security Options | ["seccomp:unconfined", "no-new-privileges:true"] |
| telegram_voice_cap_drop | Dropped Capabilities | ["ALL"] |
| telegram_voice_restart_policy | Docker Restart Policy | unless-stopped |
| telegram_voice_systemd_enabled | Systemd Service aktivieren | true |

## 1.3. monitoring/monitoring_stack

**Zweck:** Bereitstellung und Konfiguration des gesamten Monitoring-Stacks (Prometheus, Grafana, Node Exporter, cAdvisor, Blackbox Exporter).

**Verzeichnis:** ansible/roles/monitoring/monitoring_stack

**Wichtige Dateien:**
- defaults/main.yml: Standardwerte für alle Monitoring-Komponenten (Ports, Passwörter, Retention, Scrape-Intervalle, Targets).
- tasks/main.yml: Haupt-Tasks für Verzeichnis-Erstellung, Kopieren der Konfigurationsdateien, Docker Compose-Rendering und Service-Start.
- templates/docker-compose.yml.j2: Jinja2-Template für die Docker Compose-Datei des Monitoring-Stacks.
- templates/prometheus.yml.j2: Jinja2-Template für die Prometheus-Konfiguration.
- templates/alerts.yml.j2: Jinja2-Template für Prometheus Alert-Regeln.
- templates/blackbox.yml.j2: Jinja2-Template für Blackbox Exporter Probes.
- templates/grafana-datasource.yml.j2: Jinja2-Template für Grafana Datasource Provisioning.
- templates/grafana-dashboard-provisioning.yml.j2: Jinja2-Template für Grafana Dashboard Provisioning.

### Konfigurierbare Variablen (vollständig)

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| monitoring_base_path | Base-Pfad für Monitoring | /opt/docker-compose/monitoring |
| prometheus_config_path | Prometheus Config-Pfad | monitoring_base_path/prometheus |
| prometheus_data_path | Prometheus Data-Pfad | /opt/docker-data/prometheus |
| prometheus_port | Prometheus Port | 9090 |
| prometheus_version | Prometheus Version | latest |
| grafana_data_path | Grafana Data-Pfad | /opt/docker-data/grafana |
| grafana_port | Grafana Port | 3000 |
| grafana_version | Grafana Version | latest |
| grafana_admin_user | Grafana Admin User | admin |
| grafana_admin_password | Grafana Admin Passwort (MUSS überschrieben werden!) | admin |
| node_exporter_port | Node Exporter Port | 9100 |
| node_exporter_version | Node Exporter Version | latest |
| cadvisor_port | cAdvisor Port | 8080 |
| cadvisor_version | cAdvisor Version | latest |
| blackbox_config_path | Blackbox Config-Pfad | monitoring_base_path/blackbox |
| blackbox_port | Blackbox Port | 9115 |
| blackbox_version | Blackbox Version | latest |
| monitoring_security_opts | Security Options | ["seccomp:unconfined", "no-new-privileges:true"] |
| monitoring_cap_drop | Dropped Capabilities | ["ALL"] |
| monitoring_restart_policy | Docker Restart Policy | unless-stopped |

## 1.4. infrastructure/wireguard_setup

**Zweck:** Bereitstellung und Konfiguration des WireGuard VPN-Servers.

**Verzeichnis:** ansible/roles/infrastructure/wireguard_setup

**Wichtige Dateien:**
- defaults/main.yml: Standardwerte für WireGuard-Konfiguration (Port, Peers, Subnet, Server-URL, Firewall).
- tasks/main.yml: Haupt-Tasks für Kernel-Modul-Installation, IP-Forwarding, Firewall-Regeln, Docker Compose-Rendering und Service-Start.
- templates/docker-compose.yml.j2: Jinja2-Template für die WireGuard Docker Compose-Datei.
- handlers/main.yml: Handler für Systemd-Reload und WireGuard-Neustart.

### Konfigurierbare Variablen (Auszug)

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| wireguard_serverurl | Öffentliche IP/Domain des Servers | auto |
| wireguard_port | UDP-Port für WireGuard | 51820 |
| wireguard_peers | Anzahl der zu generierenden Peers | 3 |
| wireguard_firewall_interface | Netzwerk-Interface für NAT-Regel (MUSS angepasst werden!) | eno1 |

## 5. WireGuard Peer-Konfiguration abrufen
Nach dem Deployment von WireGuard können Sie die Peer-Konfigurationen wie folgt abrufen:

### 5.1. QR-Code für mobile Geräte
```bash
ssh <your-host>
docker exec nova-v3-wireguard /app/show-peer 1
```

Scannen Sie den QR-Code mit der WireGuard-App auf Ihrem Smartphone.

### 5.2. Konfigurationsdatei für Desktop
```bash
ssh <your-host>
docker exec nova-v3-wireguard cat /config/peer1/peer1.conf
```

Kopieren Sie den Inhalt und importieren Sie ihn in den WireGuard-Client auf Ihrem Desktop.

## 6. Troubleshooting

### 6.1. Playbook schlägt fehl: "Passwort nicht geändert"
**Symptom:** FEHLER: n8n_basic_auth_password muss in host_vars gesetzt werden!  
**Lösung:** Setzen Sie die Passwörter in host_vars/nova-v3.yml (siehe Abschnitt 2.1).

### 6.2. Telegram Bot antwortet nicht
**Symptom:** Bot ist erreichbar, aber antwortet nicht auf Sprachnachrichten.  
**Lösung:**
```bash
# Prüfe Container-Logs
ssh <your-host>
docker logs nova-v3-telegram-voice --tail 50

# Prüfe ob Bot Token korrekt ist
docker exec nova-v3-telegram-voice env | grep TELEGRAM_BOT_TOKEN
```

### 6.3. Grafana zeigt keine Daten
**Symptom:** Dashboards sind leer.  
**Lösung:**
```bash
# Prüfe Prometheus-Targets
curl http://<your-host>/prometheus/targets

# Prüfe Prometheus-Logs
docker logs nova-v3-prometheus --tail 50
```

### 6.4. WireGuard-Verbindung schlägt fehl
**Symptom:** Client kann sich nicht verbinden.  
**Lösung:**
```bash
# Prüfe Firewall-Regeln
ssh <your-host>
sudo iptables -L -n | grep 51820

# Prüfe WireGuard-Status
docker exec nova-v3-wireguard wg show

# Prüfe IP-Forwarding
sysctl net.ipv4.ip_forward  # Sollte "1" sein
```

## 7. Nützliche Befehle

### 7.1. Status aller Container prüfen
```bash
ssh <your-host>
docker ps --filter "name=nova-v3" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 7.2. Logs eines Dienstes anzeigen
```bash
# N8N
docker logs nova-v3-n8n --tail 50 -f

# Telegram Voice Assistant
docker logs nova-v3-telegram-voice --tail 50 -f

# Prometheus
docker logs nova-v3-prometheus --tail 50 -f

# Grafana
docker logs nova-v3-grafana --tail 50 -f

# WireGuard
docker logs nova-v3-wireguard --tail 50 -f
```

### 7.3. Dienst neu starten
```bash
# N8N
cd /opt/docker-compose/n8n && docker compose restart

# Telegram Voice Assistant
cd /opt/docker-compose/telegram-voice-assistant && docker compose restart

# Monitoring-Stack
cd /opt/docker-compose/monitoring && docker compose restart

# WireGuard
cd /opt/docker-compose/wireguard && docker compose restart
```

### 7.4. Dienst stoppen
```bash
# N8N
cd /opt/docker-compose/n8n && docker compose down

# Alle erweiterten Dienste
cd /opt/docker-compose/monitoring && docker compose down
cd /opt/docker-compose/n8n && docker compose down
cd /opt/docker-compose/telegram-voice-assistant && docker compose down
cd /opt/docker-compose/wireguard && docker compose down
```

## 8. Ansible Vault für sensible Daten (empfohlen)
Für Produktionsumgebungen sollten sensible Daten mit Ansible Vault verschlüsselt werden.

### 8.1. Vault-Datei erstellen
```bash
cd /path/to/b-nova-v3/ansible
ansible-vault create inventory/production/host_vars/nova-v3-vault.yml
```

Inhalt:
```yaml
---
# Verschlüsselte sensible Daten
vault_n8n_basic_auth_password: "IhrSicheresPasswort123!"
vault_n8n_db_password: "n8n_db_secure_password"
vault_telegram_bot_token: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
vault_grafana_admin_password: "GrafanaSecure456!"
```

### 8.2. Vault-Variablen in host_vars referenzieren

Bearbeiten Sie host_vars/nova-v3.yml:
```yaml
---
# Referenziere Vault-Variablen
n8n_basic_auth_password: "{{ vault_n8n_basic_auth_password }}"
n8n_db_password: "{{ vault_n8n_db_password }}"
telegram_bot_token: "{{ vault_telegram_bot_token }}"
grafana_admin_password: "{{ vault_grafana_admin_password }}"
```

### 8.3. Playbook mit Vault ausführen
```bash
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --ask-vault-pass
```
