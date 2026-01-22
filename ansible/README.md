# NOVA v3 - Ansible Playbooks

This directory contains Ansible playbooks and roles for configuring and managing the NOVA v3 ecosystem.

## 1. Samba Playbook

The `samba.yml` playbook installs and configures a Samba server for network shares.

**Usage:**

```bash
ansible-playbook playbooks/samba.yml -i inventory/hosts.yml
```

## 2. YubiKey Playbook

The `yubikey.yml` playbook configures a YubiKey for 2-factor authentication.

**Usage:**

```bash
ansible-playbook playbooks/yubikey.yml -i inventory/hosts.yml
```

## 3. System Setup Playbook

The `system_setup.yml` playbook performs the basic system configuration for Proxmox VE.

**Usage:**

```bash
ansible-playbook playbooks/system_setup.yml -i inventory/hosts.yml
```

**Tags:**

- `system_setup`: All tasks in this role
- `packages`: Package installation
- `configuration`: Configuration
- `firewall`: Firewall configuration
- `logging`: Logging configuration

## 4. User Management Playbook

The `user_management.yml` playbook manages user accounts and SSH keys on target hosts.

**Usage:**

```bash
ansible-playbook playbooks/user_management.yml -i inventory/hosts.yml
```

**Tags:**

- `user_management`: All tasks in this role
- `users`: User management
- `ssh`: SSH configuration
- `sudo`: Sudo configuration
- `hardening`: Security hardening

## 5. Docker Setup Playbook

The `docker_setup.yml` playbook installs and configures Docker and Docker Compose.

**Usage:**

```bash
ansible-playbook playbooks/docker_setup.yml -i inventory/hosts.yml
```

**Tags:**

- `docker_setup`: All tasks in this role
- `docker`: Docker-specific tasks
- `dependencies`: Dependency installation
- `repos`: Repository configuration
- `installation`: Docker installation
- `configuration`: Docker daemon configuration
- `service`: Docker service management
- `users`: Docker user configuration
- `directories`: Docker Compose directory setup
- `validation`: Docker validation

## 6. Installation Classes Playbook

The `installation_classes.yml` playbook groups installation and configuration tasks into logical classes (Core, Apps, Maintenance).

**Usage:**

```bash
# Full installation (all classes)
ansible-playbook playbooks/installation_classes.yml -i inventory/hosts.yml

# Only core infrastructure
ansible-playbook playbooks/installation_classes.yml -i inventory/hosts.yml -e "do_infra=true do_apps=false do_test=false"

# Only applications
ansible-playbook playbooks/installation_classes.yml -i inventory/hosts.yml -e "do_infra=false do_apps=true do_test=false"
```

**Tags:**

- `installation_classes`: All tasks in this role
- `core`: Core infrastructure tasks
- `infrastructure`: Infrastructure tasks
- `apps`: Application tasks
- `applications`: Application tasks
- `maintenance`: Maintenance tasks
- `testing`: Testing tasks
