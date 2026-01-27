# ROLLBACK-STRATEGIE & TROUBLESHOOTING

**Ziel:** Eine klare Anleitung zur Verfügung stellen, um das Deployment sicher zurückzusetzen oder häufige Probleme zu beheben.

---

## TEIL 1: ROLLBACK-STRATEGIE

Diese Strategie ermöglicht es, die durchgeführten Änderungen schrittweise und sicher rückgängig zu machen.

### ✅ Rollback von Phase 2 (GPU-Erweiterung)

Wenn nach der Aktivierung der GPU Probleme auftreten, können Sie sie isoliert deaktivieren, ohne das Basis-System zu beeinträchtigen.

#### 1. Hardware-Profil zurücksetzen:

Ändern Sie in `ansible/inventory/production/hosts.yml` das Profil zurück auf die nogpu-Version:

```yaml
# VORHER:
hardware_profile: "{{ lookup('file', playbook_dir + '/inventory/hardware/pve01.yml') | from_yaml }}"

# NACHHER:
hardware_profile: "{{ lookup('file', playbook_dir + '/inventory/hardware/pve01.yml') | from_yaml }}"
```

**Hinweis:** Da das aktuelle `pve01.yml` bereits Phase 1 (ohne GPU) konfiguriert ist, ist ein separates `pve01_nogpu.yml` nicht erforderlich.

#### 2. GPU-Konfiguration zurücksetzen:

Führen Sie das Playbook erneut mit dem `gpu_passthrough`-Tag aus. Ansible wird die Konfigurationen (GRUB, modprobe) in den Zustand zurückversetzen, der im nogpu-Profil definiert ist (also leer).

```bash
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ site.yml --tags gpu_passthrough
```

#### 3. Proxmox-Host neu starten:

Ein Neustart ist zwingend erforderlich, um die alten Kernel-Parameter wieder zu laden.

```bash
reboot
```

#### 4. GPU-fähige Anwendungen neu deployen:

Deployen Sie die betroffenen Anwendungen neu. Ansible wird die Docker-Compose-Dateien ohne GPU-Konfiguration rendern.

```bash
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --tags n8n,telegram
```

---

### ✅ Rollback von Phase 1 (Basis-Deployment)

Ein vollständiger Rollback ist destruktiv und sollte nur im Notfall durchgeführt werden.

#### 1. VMs und Container zerstören:

Loggen Sie sich auf dem Proxmox-Host ein und zerstören Sie die erstellten VMs manuell.

```bash
qm stop <VM_ID> && qm destroy <VM_ID>
```

#### 2. Konfigurationsdateien entfernen:

Die Ansible-Rollen überschreiben Systemdateien. Ein manuelles Zurücksetzen ist komplex. Die sicherste Methode ist eine Neuinstallation von Proxmox, wenn ein vollständig sauberer Zustand erforderlich ist.

#### 3. Verzeichnisse löschen:

Löschen Sie die von Ansible erstellten Anwendungsverzeichnisse (z.B. `/opt/n8n`, `/opt/grafana`).

```bash
rm -rf /opt/n8n /opt/grafana /opt/prometheus
```

---

## TEIL 2: TROUBLESHOOTING-GUIDE

| Problem | Mögliche Ursache | Lösung |
|---------|------------------|--------|
| **Ansible: Connection timed out** | Netzwerkproblem, falsche IP-Adresse, Firewall. | 1. Prüfen Sie die IP in `inventory/production/hosts.yml`.<br>2. Führen Sie `ansible -i inventory/production/ all -m ping` aus.<br>3. Prüfen Sie die Firewall-Regeln auf dem Proxmox-Host und im Netzwerk. |
| **Ansible: Permission denied** | Falscher SSH-Benutzer, fehlender SSH-Key. | 1. Stellen Sie sicher, dass `ansible_user: root` gesetzt ist.<br>2. Kopieren Sie Ihren öffentlichen SSH-Key mit `ssh-copy-id root@<proxmox_ip>` auf den Host. |
| **VM startet nicht** | Fehler bei der Provisionierung, Storage-Problem. | 1. Versuchen Sie, die VM manuell über die Proxmox-UI zu starten und prüfen Sie die Logs.<br>2. Führen Sie das Provisioning-Playbook erneut aus: `ansible-playbook ... --tags provision`. |
| **IOMMU-Fehler im dmesg-Log** | BIOS/UEFI-Einstellung falsch. | 1. Starten Sie den Proxmox-Host neu und gehen Sie ins BIOS/UEFI.<br>2. Aktivieren Sie IOMMU, VT-d oder AMD-V. Die Bezeichnung variiert je nach Hersteller. |
| **Container startet nicht** | Docker-Problem, Port-Konflikt, fehlendes Verzeichnis. | 1. Prüfen Sie die Container-Logs mit `docker logs <container_name>`.<br>2. Stellen Sie sicher, dass alle gemappten Ports frei sind.<br>3. Führen Sie die entsprechende Ansible-Rolle erneut aus, um Verzeichnisse und Konfigurationen zu korrigieren. |
| **Web-UI nicht erreichbar** | Traefik-Fehler, Container nicht im nova-network. | 1. Prüfen Sie die Traefik-Logs: `docker logs traefik`.<br>2. Prüfen Sie das Traefik-Dashboard auf Fehlermeldungen.<br>3. Stellen Sie sicher, dass der Ziel-Container im `nova-network` Docker-Netzwerk ist. |
| **GPU im Container nicht erkannt** | vfio-pci Treiber nicht geladen, falsche PCI-IDs. | 1. Prüfen Sie mit `lspci -nnk`, ob der vfio-pci Treiber die GPU bindet.<br>2. Verifizieren Sie die PCI-IDs im Hardware-Profil `pve01.yml`.<br>3. Stellen Sie sicher, dass der Proxmox-Host nach der GPU-Konfiguration neu gestartet wurde. |

---

## TEIL 3: ERWEITERTE DIAGNOSTIK

### Netzwerk-Debugging

```bash
# Prüfen Sie die Netzwerkkonnektivität
ping <proxmox_host_ip>

# SSH-Verbindung testen
ssh -v root@<proxmox_host_ip>

# Ansible-Verbindung testen
ansible -i inventory/production/ all -m setup
```

### Docker-Debugging

```bash
# Docker-Status prüfen
systemctl status docker

# Docker-Netzwerke prüfen
docker network ls
docker network inspect nova-network

# Container-Status und Logs
docker ps -a
docker logs --tail 50 <container_name>

# Speicherplatz prüfen
df -h
docker system df
```

### GPU-Debugging (nur Phase 2)

```bash
# IOMMU-Status prüfen
dmesg | grep -i -e DMAR -e IOMMU

# PCI-Geräte und Treiber-Binding prüfen
lspci -nnk | grep -A3 NVIDIA

# VFIO-Module prüfen
lsmod | grep vfio

# GPU-Sichtbarkeit im Container testen
docker run --rm --gpus all nvidia/cuda:11.0-base-ubuntu20.04 nvidia-smi
```

### Log-Dateien

Wichtige Log-Dateien für die Problemanalyse:

```bash
# System-Logs
journalctl -xe
journalctl -u docker.service

# Ansible-Logs (falls konfiguriert)
tail -f /var/log/ansible/ansible.log

# Container-spezifische Logs
docker logs traefik
docker logs grafana
docker logs n8n
```

---

## TEIL 4: NOTFALL-PROZEDUREN

### Kompletter System-Reset

**⚠️ Warnung:** Dies zerstört alle Daten und Konfigurationen!

1. **Backup erstellen** (falls möglich):
   ```bash
   tar -czf emergency-backup-$(date +%Y%m%d).tar.gz /etc/ /opt/ /root/
   ```

2. **Proxmox neu installieren:**
   - Boot von Proxmox-ISO
   - Vollständige Neuinstallation durchführen

3. **Von Phase 1 neu beginnen:**
   - Folgen Sie der `DEPLOYMENT_GUIDE_PHASE1.md`

### Ansible-State zurücksetzen

```bash
# Ansible-Facts-Cache löschen
rm -rf ~/.ansible/facts/

# SSH-Known-Hosts löschen
ssh-keygen -R <proxmox_host_ip>

# SSH-Connection neu etablieren
ssh-copy-id root@<proxmox_host_ip>
```

---

## TEIL 5: PRÄVENTIVE MASSNAHMEN

### Regelmäßige Backups

```bash
# Proxmox-Konfiguration sichern
tar -czf proxmox-config-$(date +%Y%m%d).tar.gz /etc/pve/

# VM-Backups über Proxmox-UI oder CLI erstellen
vzdump <VM_ID> --storage <backup_storage>
```

### Monitoring einrichten

- Nutzen Sie das Grafana-Dashboard zur Überwachung
- Richten Sie Alerting für kritische Services ein
- Überwachen Sie System-Ressourcen (CPU, RAM, Storage)

### Dokumentation aktuell halten

- Dokumentieren Sie alle manuellen Änderungen
- Halten Sie die `host_vars`-Dateien aktuell
- Versionieren Sie Ihre Ansible-Konfigurationen

---

**Bei kritischen Problemen: Stoppen Sie alle laufenden Deployments und konsultieren Sie diese Anleitung systematisch, bevor Sie destruktive Aktionen durchführen.**