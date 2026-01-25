# Migration Guide 🔁

This guide helps migrating from the old layout to the new repository structure used by b-nova-v3.

## Summary of changes
Old layout (examples):
- Roles at `ansible/roles/*`
- Hardware scattered in `group_vars` and `host_vars`
- Controller & AWX assets mixed in repo root

New layout highlights:
- Roles grouped into `ansible/roles/core`, `ansible/roles/apps`, `ansible/roles/hardware`, `ansible/roles/controller`, `ansible/roles/archived`
- Hardware data in `ansible/inventory/hardware/` with templates
- Controller environment in `environments/controller/` and new `ansible/roles/controller/awx_setup`
- Dedicated playbooks in `ansible/playbooks/` (e.g., `controller.yml`, `hardware_audit.yml`)

## Step-by-step migration checklist
1. Backup current repository (create a branch):
   ```bash
   git checkout -b migration/roles-reorg
   git push -u origin migration/roles-reorg
   ```

2. Create target directories:
   ```bash
   mkdir -p ansible/roles/core ansible/roles/apps ansible/roles/hardware ansible/roles/controller ansible/roles/archived
   ```

3. Move roles with `git mv` to preserve history:
   ```bash
   git mv ansible/roles/system_setup ansible/roles/core/system_setup
   git mv ansible/roles/user_management ansible/roles/core/user_management
   git mv ansible/roles/docker_setup ansible/roles/core/docker_setup
   git mv ansible/roles/provision_guests ansible/roles/core/provision_guests
   git mv ansible/roles/app_deployment ansible/roles/apps/app_deployment
   git mv ansible/roles/app_tests ansible/roles/apps/app_tests
   git mv ansible/roles/gpu_hookscript ansible/roles/hardware/gpu_passthrough
   git mv ansible/roles/hardware_validation ansible/roles/hardware/hardware_validation
   git mv ansible/roles/hardware_security ansible/roles/hardware/hardware_security
   git mv ansible/roles/installation_classes ansible/roles/archived/installation_classes
   ```

4. Update `include_role` references and any `roles:` lists in playbooks and tasks to the new paths (e.g., `core/system_setup`, `apps/app_deployment`, `hardware/gpu_passthrough`)
   - Example `sed` to update automatically:
     ```bash
     grep -R "include_role" -n ansible | cut -d: -f1 | sort -u | xargs -I{} sed -i 's/name: system_setup/name: core\/system_setup/g' {}
     ```

5. Move hardware metadata into `ansible/inventory/hardware/`:
   - Consolidate duplicate hardware entries from `group_vars` and `host_vars`
   - Use templates from `ansible/inventory/hardware/templates/`

6. Add `ansible/playbooks/ansible.cfg` where needed to point to the right inventory for controllers or specialized playbooks.

7. Run syntax and validation checks:
   ```bash
   ansible-playbook ansible/site.yml -i ansible/inventory/hosts.yml --syntax-check
   ansible-playbook ansible/playbooks/controller.yml --syntax-check
   ```

8. Test in Controller sandbox first (AWX), then in isolated test hosts, before deploying to production.

## Rollback plan
- Keep the migration branch available; revert by checking out the old branch and resetting the main branch if needed.
- Before mass changes, create a tag or an archive of the current main branch:
  ```bash
  git tag -a pre-migration-$(date +%Y%m%d) -m "Before role reorg"
  git push origin --tags
  ```

## Notes & Tips
- Preserve commit history by using `git mv`
- Prefer small incremental changes and validate after each change
- Update documentation (`docs/`) as you move items
- Use CI to run `ansible-lint`, `yamllint` and `ansible-playbook --syntax-check`

---
Last updated: 2026-01-25
