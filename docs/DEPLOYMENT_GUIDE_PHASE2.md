# DEPLOYMENT ANLEITUNG - PHASE 2: SICHERE GPU-ERWEITERUNG

**Ziel:** Nachträgliche, sichere Aktivierung des GPU-Passthroughs für die RTX 5060 Ti, ohne das bestehende System zu beeinträchtigen.

## Voraussetzungen

- Phase 1 wurde erfolgreich abgeschlossen.
- Das System läuft stabil.
- Die eGPU (RTX 5060 Ti) ist korrekt mit dem Mini-PC verbunden.

---

## Schritt 1: Hardware-Profil wechseln

Der entscheidende Schritt ist der Wechsel zum vollständigen Hardware-Profil, das die GPU-Konfiguration enthält. Dies ist eine rein deklarative Änderung und birgt kein Risiko für das laufende System.

**Datei:** `ansible/inventory/production/hosts.yml`

Ändern Sie die Zeile `hardware_profile` wie folgt:

```yaml
# VORHER:
hardware_profile: "{{ lookup('file', playbook_dir + '/inventory/hardware/pve01_nogpu.yml') | from_yaml }}"

# NACHHER:
hardware_profile: "{{ lookup('file', playbook_dir + '/inventory/hardware/pve01.yml') | from_yaml }}"
```

Damit wird das Ansible-Inventar angewiesen, beim nächsten Lauf das vollständige Profil `pve01.yml` zu laden, das alle GPU-Passthrough-Einstellungen enthält.

---

## Schritt 2: GPU-Passthrough-Rolle ausführen (Check-Modus)

Führen Sie nun nur die `gpu_passthrough`-Rolle im Check-Modus aus. Dadurch wird sichergestellt, dass die Konfiguration korrekt geladen wird und alle Änderungen wie erwartet angewendet würden, ohne sie tatsächlich durchzuführen.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ site.yml --tags gpu_passthrough --check
```

**Erwarteter Output:**
- Änderungen an `/etc/default/grub` (Kernel-Parameter)
- Änderungen an `/etc/modprobe.d/` (Blacklisting von Nvidia-Treibern)
- Änderungen an `/etc/modules` (Laden von VFIO-Modulen)

---

## Schritt 3: GPU-Passthrough-Rolle anwenden

Wenn der Check-Modus erfolgreich war, wenden Sie die Änderungen an. Diese Rolle konfiguriert den Proxmox-Host für das Durchreichen der GPU.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ site.yml --tags gpu_passthrough
```

---

## Schritt 4: Proxmox-Host neu starten

Ein Neustart des Proxmox-Hosts ist zwingend erforderlich, damit die neuen Kernel-Parameter und Modul-Konfigurationen geladen werden.

```bash
# Führen Sie dies auf dem Proxmox-Host aus
reboot
```

---

## Schritt 5: GPU-fähige Anwendungen neu deployen

Nach dem Neustart müssen die Anwendungen, die die GPU nutzen sollen (im Profil als `gpu_access: true` markiert), neu deployed werden. Ansible wird die Docker-Compose-Dateien mit den GPU-spezifischen Konfigurationen aktualisieren.

```bash
# Führen Sie dies auf Ihrem Management-Rechner aus
cd /path/to/b-nova-v3/ansible
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --tags n8n,telegram
```

*(Hier n8n und telegram als Beispiel, passen Sie die Tags an die GPU-nutzenden Apps an)*

---

## Validierung

### 1. Host-Validierung:

- Prüfen Sie mit `dmesg | grep -i -e DMAR -e IOMMU`, ob IOMMU korrekt aktiviert ist.
- Prüfen Sie mit `lspci -nnk`, ob die GPU vom `vfio-pci`-Treiber gebunden wird.

### 2. Container-Validierung:

- Starten Sie einen Container, der die GPU nutzen soll.
- Führen Sie im Container `nvidia-smi` aus. Der Befehl sollte die RTX 5060 Ti erkennen und anzeigen.

---

## Troubleshooting

### Problem: IOMMU wird nicht erkannt

**Lösung:**
```bash
# Prüfen Sie die GRUB-Konfiguration
grep -i iommu /boot/grub/grub.cfg

# Falls nicht vorhanden, prüfen Sie /etc/default/grub
grep GRUB_CMDLINE_LINUX_DEFAULT /etc/default/grub

# Nach Änderungen GRUB aktualisieren
update-grub
```

### Problem: GPU wird nicht von VFIO gebunden

**Lösung:**
```bash
# Prüfen Sie die PCI-IDs
lspci -nn | grep NVIDIA

# Prüfen Sie die VFIO-Konfiguration
cat /etc/modprobe.d/vfio.conf

# Prüfen Sie die geladenen Module
lsmod | grep vfio
```

### Problem: Container sehen die GPU nicht

**Lösung:**
```bash
# Prüfen Sie die Docker-Runtime
docker info | grep -i runtime

# Prüfen Sie nvidia-container-runtime
nvidia-container-cli --version

# Container-Test mit GPU-Zugriff
docker run --gpus all nvidia/cuda:11.0-base-ubuntu20.04 nvidia-smi
```

---

**Ihr System ist nun vollständig mit GPU-Unterstützung konfiguriert.** Dieser schrittweise Ansatz stellt sicher, dass das Basis-System zu keinem Zeitpunkt gefährdet wird.