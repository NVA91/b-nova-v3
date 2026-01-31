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

## 7. App Deployment & Tests (Usage)

Deploy applications and run application tests on a dedicated host group `app_hosts` (a VM/LXC that runs your Docker stacks).

- Add your app host(s) to inventory as `app_hosts` (example below). This should be the VM where docker compose runs your app stack, *not* the Proxmox management node.

Example inventory snippet (in `ansible/inventory/hosts.yml`):

```yaml
app_hosts:
  hosts:
    nova-app:
      ansible_host: 192.168.2.100
      ansible_user: admin
```

Options:
- Option A (simple): Add a task block in `app_deployment` that runs the tests when invoked with `--tags tests`.
- Option B (modular): Include the dedicated role `app_tests` (provided) which runs `tests/run-all-tests.sh` on the app host when you run `--tags tests`.

Invoke in maintenance window:

```bash
ansible-playbook site.yml -l app_hosts --tags app,tests -i inventory/hosts.yml
```

Notes:
- The CI pipeline should not run `site.yml` against a real Proxmox host. CI performs `syntax-check` and `ansible-lint`. Only run `--check` against a dummy inventory or dedicated test host.

CI Safety Recommendation:
- In GitHub Actions run **syntax-check** and **ansible-lint** always.
- Make `--check/--diff` optional and gated (e.g. only for `develop` and when `RUN_ANSIBLE_CHECK=true`) and use a `tests/dummy-inventory.yml` as target to avoid trying to reach your real Proxmox hosts from the runner.
- Example workflow snippet:

```yaml
- name: Ansible syntax-check
  run: ansible-playbook site.yml --syntax-check -i ansible/inventory/hosts.yml

- name: ansible-lint
  run: ansible-lint || true

- name: Ansible check-mode (optional)
  if: github.ref == 'refs/heads/develop' && env.RUN_ANSIBLE_CHECK == 'true'
  run: ansible-playbook site.yml --check -i tests/dummy-inventory.yml --diff -q || true
```


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
