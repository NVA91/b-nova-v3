# Recovery & Backup Guide 🐦‍🔥

This document explains the backup and recover primitives provided by `bootstrap.sh` and recommended restart/healthcheck settings for Docker Compose services.

## Commands

- Create a backup (DB + optional Redis):

  ```bash
  ./bootstrap.sh --backup --backup-dir backups --include-redis
  ```

  If `--backup-dir` is omitted the script will create `backups/<timestamp>/` and store `postgres_dump.sql` and (if requested) `redis_dump.rdb`.

- Recover from a backup:

  ```bash
  ./bootstrap.sh --recover --backup-dir backups/20260126T120000Z --continue-after-recover
  ```

  If `--backup-dir` isn't provided the script will try to use the latest directory under `backups/`.

## How it works

- Backup:
  - Attempts to locate a Postgres service in the Compose stack and use `pg_dumpall` inside the Postgres container to create `postgres_dump.sql`.
  - If `--include-redis` is used, triggers `SAVE` on Redis and copies `/data/dump.rdb` to the backup directory.

- Recover:
  - Stops relevant containers and brings up only the Postgres (and Redis if requested) service to perform the restore safely.
  - Performs *pre-restore checks*:
    - extracts the Postgres version reported in the dump and compares it to the server version (fails unless `--force` is given),
    - extracts `CREATE ROLE` statements from the dump and attempts to create any missing roles (fails unless `--force` is given),
    - extracts `CREATE EXTENSION` lines and checks the server for available extensions; it will attempt to `CREATE EXTENSION` where possible and abort if the extension package is not installed (unless `--force`),
  - Runs `psql` to import the SQL dump into Postgres and (optionally) copies Redis `dump.rdb` into Redis and restarts it so it loads the RDB snapshot.

> Note: The recovery includes several guardrails to avoid common failures (version mismatch, missing extensions, or missing role definitions). Always validate backups regularly and prefer to run restores in a safe environment before applying to production.

## Idempotency & Safety

- Backups are stored in timestamped directories by default — running multiple backups won't overwrite prior backups.
- Recovery requires an existing backup directory; it will not proceed without one.
- Use `--force` to override some safety checks (use with caution).

## Docker restart policies & healthchecks (recommendation)

Add the following to your service definitions to improve robustness:

```yaml
services:
  backend:
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  postgres:
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-postgres} -h localhost"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3
```

Add these snippets into your `docker-compose.yml` or relevant compose files (e.g. `environments/controller/docker-compose.yml`). Healthchecks provide automatic orchestration feedback and restart policies keep services running after transient failures.

## CI / Manual Button

If you want a GitHub `workflow_dispatch` button to run a recovery job, ensure the runner has Docker privileges and then create a workflow that calls `bootstrap.sh --target controller --noninteractive --recover --backup-dir <dir> --continue-after-recover`.

---

If you want, I can open a PR with the updated `bootstrap.sh` and this `docs/RECOVERY.md` file, plus an example GitHub Actions workflow template to trigger a controlled recovery job.

## Tests

A small unit-style test that verifies the dump-parsing utilities (version, roles, extensions extraction) is included at `tests/dump_parsing_tests.sh`. Run it locally with:

```bash
./tests/dump_parsing_tests.sh
```

These tests don't require Docker and validate the parsing regular expressions used by `bootstrap.sh`. For a full integration test (backup → restore) we recommend running the script against a disposable Docker environment with a Postgres service (requires a privileged runner or local Docker).
