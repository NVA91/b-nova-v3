# Hardware Management ⚙️

## Purpose
This document describes the structure, conventions and processes for managing hardware metadata used by the playbooks and roles in this repository.

## Location
- Canonical hardware data is stored under: `ansible/inventory/hardware/`
  - Host files: `pve01.yml`, `nova-v3.yml`, etc.
  - Templates: `ansible/inventory/hardware/templates/mini_pc_amd.yml.j2` and `egpu_nvidia.yml.j2` for common hardware profiles

## Principles
- Use a single source of truth: host-specific hardware belongs in `ansible/inventory/hardware/*.yml` and global defaults in `group_vars` where appropriate.
- Avoid duplicating hardware configuration across `host_vars` and `group_vars` to prevent drift.

## Ziel-Hardware (Proxmox Server, Stand 2026)
- **Mini‑PC (Host + eGPU‑Anbindung):** AMD Ryzen 7 H255 (ohne NPU)
- **iGPU:** AMD Radeon 780M
- **RAM:** 32 GB DDR5 5600 MT/s
- **Storage:** 1 TB NVMe (System) + 2 TB NVMe (Storage) – WD Black
- **Netzwerk:** 2 × 2.5G LAN (Realtek 8125BG)
- **Wireless:** Wi‑Fi 6E + Bluetooth 5.2
- **OCuLink:** vorhanden (PCIe Gen4 ×4)
- **eGPU‑Dock:** Minisforum DEG1 (OCuLink Gen4 ×4)
- **eGPU:** NVIDIA RTX 5060 Ti 16GB

## Weitere Systeme (getrennt geführt)
- **XMG Neo M21** mit RTX 3080 (intern) ist **nicht** Teil des Proxmox/eGPU‑Setups.
  - Für den XMG wird ein **eigenes, fixes Hardware‑Profil** geführt.

## Zukunfts-Hardware (Regeln)
- Änderungen an Hardware **nicht** im Code „mitziehen“, sondern ausschließlich in
  `ansible/inventory/hardware/<host>.yml` dokumentieren.
- Neue Geräte nur mit einem eigenen Hardware‑Profil aufnehmen (kein Mischprofil).

## How to add/update hardware
1. Add or edit `ansible/inventory/hardware/<host>.yml` with the validated data (CPU, RAM, storage, GPU passthrough IDs).
2. If the hardware matches a template, populate a new file from the appropriate template in `templates/` and adjust fields.
3. Validate the YAML: `python -c "import yaml,sys; yaml.safe_load(open('ansible/inventory/hardware/pve01.yml'))"`

## Integration with Roles
- `ansible/roles/hardware/hardware_validation` performs pre-flight checks (CPU cores, RAM, storage space, GPU presence).
  - Run: `ansible-playbook ansible/playbooks/hardware_audit.yml -l pve01 --tags hardware_validation`
- `ansible/roles/hardware/hardware_security` checks IOMMU groups and PCI isolation for safe GPU passthrough.
  - Run: `ansible-playbook ansible/playbooks/hardware_audit.yml -l pve01 --tags hardware_security`
- `ansible/roles/hardware/gpu_passthrough` contains the hookscript templates and tasks to deploy the hookscript and update VM config. Use only after validation passes.

## GPU Passthrough notes
- Record both PCI address (e.g., `0000:01:00.0`) and device id (e.g., `10de:2d04`) in the host hardware file.
- `vfio-pci.ids` kernel cmdline should use vendor:device pairs (comma separated)
- Only bind devices to `vfio-pci` when IOMMU isolation and group membership are validated

## Testing & Troubleshooting
- Run `ansible-playbook ansible/playbooks/hardware_audit.yml --limit pve01 -vv` to get detailed output
- Check `lspci -nn` and `/sys/kernel/iommu_groups/*/devices/` on target host for device grouping

## Security
- Do not commit sensitive host-specific secrets to the repo. Use Ansible Vault for any credentials required for hardware tests.
- Hardware validation and security checks are validation-only and should not make destructive changes by default (unless explicitly requested).

---
Last updated: 2026-01-25
