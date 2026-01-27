# DEPLOYMENT ANLEITUNG - PHASE 1: BASIS-DEPLOYMENT (OHNE GPU)

**Ziel:** Sichere Inbetriebnahme des NOVA v3 Stacks auf dem Mini-PC ohne GPU-Passthrough.

## Voraussetzungen

- Proxmox VE 8.x ist auf dem Mini-PC installiert.
- SSH-Zugang zum Proxmox-Host ist als root möglich.
- Das b-nova-v3 Repository ist auf Ihrem Management-Rechner geklont.

---

## Schritt 1: Ansible-Vorbereitung

Stellen Sie sicher, dass Ihr Management-Rechner (z.B. Ihr Laptop) Ansible und die benötigten Collections installiert hat.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-galaxy install -r requirements.yml
```

---

## Schritt 2: Inventory anpassen

Passen Sie die `inventory/production/hosts.yml` an, um die IP-Adresse Ihres Proxmox-Hosts einzutragen.

**Datei:** `ansible/inventory/production/hosts.yml`

```yaml
all:
  hosts:
    pve01:
      ansible_host: 192.168.1.100  # <-- IP-Adresse Ihres Proxmox-Hosts eintragen
      ansible_user: root
      hardware_profile: "{{ lookup('file', playbook_dir + '/inventory/hardware/pve01.yml') | from_yaml }}"
```

**WICHTIG:** Wir verwenden hier das Hardware-Profil `pve01.yml`, das die GPU-Konfiguration für Phase 1 explizit deaktiviert hat.

---

## Schritt 3: Sensible Variablen setzen

Erstellen Sie eine host_vars-Datei für Ihren Proxmox-Host und setzen Sie dort alle sensiblen Passwörter und Tokens. **Verwenden Sie niemals die Standardwerte!**

**Datei:** `ansible/inventory/production/host_vars/pve01.yml`

```yaml
# Passwörter & Secrets für pve01

# N8N
n8n_basic_auth_password: "IhrSicheresN8NPasswort"
n8n_db_password: "IhrSicheresN8NDBPasswort"

# Telegram
telegram_bot_token: "IhrTelegramBotToken"

# Grafana
grafana_admin_password: "IhrSicheresGrafanaPasswort"
```

---

## Schritt 4: Pre-Flight Check (Dry-Run)

Führen Sie das Haupt-Playbook im Check-Modus aus. Dies simuliert alle Schritte, ohne Änderungen am System vorzunehmen. So können Sie Konfigurationsfehler frühzeitig erkennen.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ site.yml --check
```

Analysieren Sie den Output sorgfältig. Wenn keine Fehler auftreten, können Sie mit dem eigentlichen Deployment fortfahren.

---

## Schritt 5: Basis-Deployment ausführen

Führen Sie nun das Haupt-Playbook ohne den Check-Modus aus. Dieses Playbook wird:

1. Den Proxmox-Host konfigurieren (`system_setup`, `user_management`).
2. **KEIN** GPU-Passthrough konfigurieren (da im Profil deaktiviert).

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ site.yml
```

---

## Schritt 6: VMs provisionieren

Nachdem der Host konfiguriert ist, provisionieren Sie die Guest-VMs. Dies geschieht mit dem Tag `provision`.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ site.yml --tags provision
```

---

## Schritt 7: Docker & Apps deployen

Installieren Sie Docker auf den neuen VMs und deployen Sie die Kern-Anwendungen.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ site.yml --tags docker_setup,app_deployment
```

---

## Schritt 8: Erweiterte Dienste deployen

Zuletzt deployen Sie die erweiterten Dienste wie N8N, Monitoring und den Telegram-Bot.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ playbooks/extended_services.yml
```

---

## Validierung

Nach Abschluss des Deployments sollten alle Dienste **ohne GPU-Unterstützung** laufen. Überprüfen Sie:

### 1. Service-Status prüfen

```bash
# SSH auf den Proxmox-Host
ssh root@192.168.1.100

# Docker-Container-Status prüfen
docker ps

# System-Load prüfen
htop
```

### 2. Web-UIs testen

- **Traefik Dashboard:** `http://192.168.1.100:8080`
- **Grafana:** `http://192.168.1.100:3000` (admin / IhrSicheresGrafanaPasswort)
- **N8N:** `http://192.168.1.100:5678` (admin / IhrSicheresN8NPasswort)

### 3. Log-Prüfung

```bash
# Ansible-Logs prüfen
tail -f /var/log/ansible/

# Container-Logs prüfen
docker logs <container_name>
```

---

## Troubleshooting

### Problem: Ansible kann sich nicht verbinden

**Lösung:**
```bash
# SSH-Verbindung testen
ssh root@192.168.1.100

# SSH-Keys prüfen
ssh-keyscan 192.168.1.100 >> ~/.ssh/known_hosts
```

### Problem: Container starten nicht

**Lösung:**
```bash
# Docker-Status prüfen
systemctl status docker

# Speicherplatz prüfen
df -h

# Container-Logs analysieren
docker logs <failing_container>
```

### Problem: Services nicht erreichbar

**Lösung:**
```bash
# Firewall-Status prüfen
ufw status

# Port-Binding prüfen
netstat -tuln | grep :8080

# Traefik-Konfiguration prüfen
docker logs traefik
```

---

## Nächste Schritte

**Ihr System ist nun sicher und stabil in Betrieb.** Die GPU kann in Phase 2 als harmlose Erweiterung hinzugefügt werden.

- **Laufzeit-Test:** Lassen Sie das System mindestens 24 Stunden laufen
- **Backup erstellen:** Erstellen Sie ein Backup der funktionierenden Konfiguration
- **Phase 2 vorbereiten:** Wenn alles stabil läuft, können Sie mit der GPU-Erweiterung fortfahren

```bash
# System-Backup (optional)
tar -czf nova-v3-phase1-backup-$(date +%Y%m%d).tar.gz /etc/ansible/ /var/lib/docker/
```