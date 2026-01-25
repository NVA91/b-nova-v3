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
