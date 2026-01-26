# Controller (AWX) Setup Guide 🧭

## Goal

Provide a secure, isolated Controller environment for testing and automation using AWX (Ansible Tower upstream).

## Components

- Inventory: `ansible/inventory/controller/hosts.yml`
- Role that installs AWX: `ansible/roles/controller/awx_setup`
- Controller playbook to configure AWX: `ansible/playbooks/controller.yml`
- Environment compose: `environments/controller/docker-compose.yml`

## Quickstart (recommended)

1. Copy .env example:

   ```bash
   cd environments/controller
   cp .env.example .env
   # edit .env: set AWX_SECRET_KEY, AWX_ADMIN_PASSWORD, POSTGRES_PASSWORD
   # (and ensure SSH_KEY_PATH is an absolute path)
   ```

2. Start AWX stack (on controller host):

   ```bash
   docker-compose -f environments/controller/docker-compose.yml up -d
   ```

   or use the `awx_setup` role to install/configure:

   ```bash
   # from control machine
   ansible-playbook -i ansible/inventory/controller/hosts.yml \
     -l awx-controller \
     -t awx_install \
     ansible/playbooks/controller.yml
   ```

3. Install AWX Ansible Collection (if using the controller playbook tasks):

   ```bash
   ansible-galaxy collection install -r ansible/requirements.yml
   ```

4. Configure AWX (projects, inventories, credentials):

   ```bash
   cd ansible/playbooks
   ansible-playbook controller.yml
   ```

## Security & Best Practices

- Mount the Ansible project read-only in AWX (configured in docker-compose and role templates).
- Provide AWX with dedicated credentials (SSH keys, vault) and avoid sharing production credentials between test & prod inventories.
- Harden AWX containers: `no-new-privileges: true`, `cap_drop: [ALL]`, minimal capabilities for networking.

## Notes

- The repository uses the AWX collection under the `awx.awx` namespace; if you see resolution issues, install from GitHub per `ansible/requirements.yml`.
- Controller playbook (`ansible/playbooks/controller.yml`) expects to be run from `ansible/playbooks/` (contains a local `ansible.cfg` pointing to the controller inventory).

## Verification

- Check AWX API: `curl http://<awx-host>:8080/api/v2/ping/`
- Once AWX is configured, verify that Projects (git) and Inventories are imported and that Job Templates appear as expected.

---
Last updated: 2026-01-25
