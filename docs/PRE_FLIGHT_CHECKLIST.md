# PRE-FLIGHT CHECKLISTE & VALIDIERUNG

**Ziel:** Sicherstellen, dass das System vor dem Deployment korrekt vorbereitet ist und nach dem Deployment wie erwartet funktioniert.

---

## TEIL 1: PRE-FLIGHT CHECKLISTE (Vor dem Deployment)

Führen Sie diese Prüfungen vor dem Ausführen des ersten Ansible-Playbooks durch.

### ✅ Hardware & Netzwerk

| Prüfung | Befehl / Aktion | Erwartetes Ergebnis |
|---------|-----------------|-------------------|
| **Netzwerkkonnektivität** | `ping 8.8.8.8` | Erfolgreiche Pings, keine Paketverluste. |
| **Proxmox Host IP** | `ip a` | Die IP-Adresse des Proxmox-Hosts ist bekannt und im Ansible Inventory (`hosts.yml`) korrekt eingetragen. |
| **SSH-Zugang** | `ssh root@<proxmox_ip>` | Erfolgreicher Login ohne Passwort (idealerweise mit SSH-Key). |
| **eGPU-Verbindung (für Phase 2)** | Physische Überprüfung | Die eGPU ist korrekt via OCuLink verbunden und mit Strom versorgt. |
| **OCuLink Power-Sequence** | Host aus → Dock/PSU an → OCuLink verbinden → Host starten | PCIe‑Gerät wird stabil erkannt (kein Renumbering). |
| **GPU-Modell** | `nvidia-smi --query-gpu=name --format=csv,noheader` | **RTX 5060 Ti** erkannt. |
| **PCIe Link (eGPU)** | `lspci -vv -s $(lspci | grep -i nvidia | cut -d' ' -f1) | egrep -i 'LnkCap|LnkSta'` | PCIe Gen4 ×4 (OCuLink) sichtbar. |

### ✅ Software & System

| Prüfung | Befehl / Aktion | Erwartetes Ergebnis |
|---------|-----------------|-------------------|
| **Proxmox Version** | `pveversion` | Proxmox VE 8.x wird angezeigt. |
| **Subscription-Status** | `pveversion -v` | Idealerweise eine gültige Subscription, ansonsten das no-subscription Repository. |
| **System-Updates** | `apt update && apt dist-upgrade -y` | Das System ist auf dem neuesten Stand. |
| **Ansible-Konnektivität** | `ansible -i inventory/production/ all -m ping` | Alle Hosts im Inventory antworten mit `"ping": "pong"`. |
| **Sensible Variablen** | Überprüfen Sie `host_vars/pve01.yml` | Alle `changeme`-Werte wurden durch sichere, eindeutige Passwörter ersetzt. |

---

## TEIL 2: VALIDIERUNGSSCHRITTE (Nach dem Deployment)

Führen Sie diese Prüfungen nach den jeweiligen Deployment-Phasen durch.

### ✅ Validierung nach Phase 1 (Basis-Deployment)

| Komponente | Befehl / Aktion | Erwartetes Ergebnis |
|------------|-----------------|-------------------|
| **VM-Status** | `qm list` auf dem Proxmox-Host | Die provisionierten VMs (z.B. nova-v3) werden als `running` angezeigt. |
| **Docker-Dienste** | `docker ps` in der nova-v3 VM | Alle Kern-Container (traefik, backend, frontend) laufen. |
| **Traefik Dashboard** | `http://<nova-v3_ip>:8080` im Browser | Das Traefik-Dashboard ist erreichbar und zeigt die konfigurierten Router an. |
| **Erweiterte Dienste** | `docker ps` in der nova-v3 VM | Container für N8N, Grafana, Prometheus etc. laufen. |
| **N8N UI** | `http://<nova-v3_ip>/n8n` | Die N8N-Login-Seite wird angezeigt. |
| **Grafana UI** | `http://<nova-v3_ip>/grafana` | Die Grafana-Login-Seite wird angezeigt. |

### ✅ Validierung nach Phase 2 (GPU-Erweiterung)

| Komponente | Befehl / Aktion | Erwartetes Ergebnis |
|------------|-----------------|-------------------|
| **IOMMU-Status** | `dmesg \| grep -i -e DMAR -e IOMMU` auf dem Proxmox-Host | IOMMU wird korrekt erkannt und aktiviert. |
| **VFIO-Treiber** | `lspci -nnk -d 10de:2d04` auf dem Proxmox-Host | Der `vfio-pci` Treiber wird für die GPU verwendet (`Kernel driver in use: vfio-pci`). |
| **GPU im Container** | `docker exec -it <ai_container_name> nvidia-smi` | `nvidia-smi` erkennt die RTX 5060 Ti und zeigt deren Status an. |
| **KI-Dienst Funktionalität** | Testen Sie eine GPU-beschleunigte Anfrage an den AI-Service | Die Anfrage wird erfolgreich und performant verarbeitet. |

---

## TEIL 3: DETAILLIERTE PRÜFKOMMANDOS

### Netzwerk-Diagnose

```bash
# Basis-Konnektivität
ping -c 4 8.8.8.8
ping -c 4 <proxmox_host_ip>

# DNS-Auflösung
nslookup google.com
dig @8.8.8.8 google.com

# Ports prüfen (von Management-Rechner)
telnet <proxmox_host_ip> 22
nc -zv <proxmox_host_ip> 8006  # Proxmox Web-UI
```

### SSH-Setup validieren

```bash
# SSH-Key-Authentication testen
ssh -o PasswordAuthentication=no root@<proxmox_host_ip>

# SSH-Config prüfen
ssh -vvv root@<proxmox_host_ip>

# Ansible SSH-Test
ansible -i inventory/production/ all -m setup --limit pve01
```

### Proxmox-System prüfen

```bash
# System-Status
systemctl status pveproxy
systemctl status pvedaemon
systemctl status pve-cluster

# Storage-Status
pvesm status

# VM-Template prüfen (falls verwendet)
qm list | grep template

# Cluster-Status (falls Cluster)
pvecm status
```

### Docker-Umgebung validieren

```bash
# Docker-Status auf Guest-VM
systemctl status docker
docker version
docker info

# Network-Setup
docker network ls
docker network inspect nova-network

# Volume-Status
docker volume ls
docker volume inspect <volume_name>

# Registry-Konnektivität (falls private Registry)
docker pull hello-world
```

### Service-spezifische Checks

```bash
# N8N
curl -I http://<vm_ip>:5678/healthz
curl -u admin:<password> http://<vm_ip>:5678/rest/active

# Grafana
curl -I http://<vm_ip>:3000/api/health

# Prometheus
curl http://<vm_ip>:9090/api/v1/query?query=up

# Traefik
curl http://<vm_ip>:8080/api/rawdata
```

---

## TEIL 4: CHECKLISTEN-TEMPLATES

### Pre-Deployment Checklist (Kopiervorlage)

```
□ Hardware-Setup abgeschlossen
□ Proxmox installiert und aktuell (Version: ______)
□ Netzwerk-Konnektivität bestätigt (IP: ______)
□ SSH-Key-Authentication funktioniert
□ Ansible-Ping erfolgreich
□ host_vars/pve01.yml mit sicheren Passwörtern konfiguriert
□ Repository geklont und requirements installiert
□ --check Modus erfolgreich durchgelaufen

Datum: ____________
Durchgeführt von: ____________
```

### Phase 1 Validation Checklist

```
□ VMs erfolgreich provisioniert
□ Docker läuft auf allen VMs
□ Traefik Dashboard erreichbar
□ Kern-Services laufen (Backend, Frontend)
□ N8N-Interface erreichbar
□ Grafana-Interface erreichbar
□ Prometheus sammelt Metriken
□ System stabil für >24h

Datum: ____________
Bemerkungen: ____________
```

### Phase 2 Validation Checklist

```
□ Hardware-Profil auf GPU-Version gewechselt
□ IOMMU aktiviert und erkannt
□ GPU von vfio-pci gebunden
□ nvidia-smi in Containern funktional
□ AI-Services nutzen GPU-Acceleration
□ Performance-Tests erfolgreich
□ System stabil nach GPU-Integration

Datum: ____________
Bemerkungen: ____________
```

---

## TEIL 5: AUTOMATISIERTE VALIDIERUNG

### Validation Script (Optional)

Erstellen Sie ein Skript zur automatischen Prüfung:

```bash
#!/bin/bash
# validate-deployment.sh

echo "=== NOVA v3 Deployment Validation ==="

# Phase 1 Checks
echo "Checking VM Status..."
qm list | grep running || echo "WARNING: VMs not running"

echo "Checking Docker Services..."
docker ps | grep -E "(traefik|backend|frontend)" || echo "WARNING: Core services missing"

echo "Checking Web UIs..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200" || echo "WARNING: Traefik not accessible"

# Phase 2 Checks (nur wenn GPU aktiv)
if lspci | grep -q NVIDIA; then
    echo "Checking GPU Integration..."
    lspci -nnk | grep -A2 NVIDIA | grep -q "vfio-pci" || echo "WARNING: GPU not bound to vfio-pci"
    docker run --rm --gpus all nvidia/cuda:11.0-base-ubuntu20.04 nvidia-smi || echo "WARNING: GPU not accessible in containers"
fi

echo "Validation completed."
```

---

**Nach erfolgreicher Validierung ist Ihr NOVA v3 System deployment-bereit. Bewahren Sie diese Checklisten für zukünftige Deployments und Wartungen auf.**