# 🛡️ Hardware-Sicherheit (Proxmox + eGPU)

Diese Checkliste fokussiert Hardware-nahe Risiken (PCIe/eGPU/IOMMU) und sichere Defaults.

## 1) Physische Sicherheit (KRITISCH)

- BIOS/UEFI Passwort setzen (Setup + Boot)
- Boot von USB/externen Medien deaktivieren
- Secure Boot nur aktivieren, wenn kompatibel (Proxmox/GPU-Passthrough beachten)
- Gerät gegen Zugriff absichern (Rack/abschließbarer Raum)

### OCuLink/eGPU (KRITISCH)
- OCuLink ist in der Regel **nicht** hotplug‑fähig → feste Power‑Sequenz einhalten:
  - Host **aus** → Dock/PSU **an** → OCuLink verbinden → Host **starten**
- DEG1 ist Open‑Frame: mechanische Fixierung der GPU sicherstellen (Kontaktstress vermeiden)
- PCIe‑Bus‑Renumbering vermeiden: Dock beim Boot **immer** aktiv

## 2) IOMMU & Passthrough-Isolation (KRITISCH)

- BIOS: SVM + IOMMU aktivieren (AMD)
- Kernel-Parameter (typisch): `amd_iommu=on iommu=pt`
- Prüfen, dass GPU und Audio in isolierten IOMMU-Gruppen liegen

### Quick-Checks (auf pve01)

- Kernel cmdline:
  - `cat /proc/cmdline`
- IOMMU Gruppen:
  - `ls -1 /sys/kernel/iommu_groups | head`
- PCI Devices anzeigen:
  - `lspci -nn | grep -i nvidia`
  - `lspci -nnk | grep -A3 -i 'vga\|3d\|audio'`

## 3) GPU Hookscript (KRITISCH)

- Keine hartcodierten PCI IDs verwenden.
- Invalid/missing PCI IDs müssen kontrolliert abbrechen (kein Blind-Write nach sysfs).
- Logging aktivieren, um Start/Stop-Phasen nachzuverfolgen.

### Ansible: Validation-only

Das Projekt enthält ein optionales Validation-Play, das ausschließlich prüft und nichts ändert:

- Run:
  - `ansible-playbook ansible/site.yml -i ansible/inventory/hosts.yml -l pve01 --tags hardware_security`

## 4) Docker/Container Hardening (WICHTIG)

- Keine `privileged: true` Container (bereits gefixt)
- `cap_drop: [ALL]` + nur nötige Caps gezielt hinzufügen
- `no-new-privileges:true` aktivieren

## 5) Hinweis: XMG Neo M21

Der XMG Neo M21 (RTX 3080 intern) ist **nicht** Teil des Proxmox/eGPU Setups.
