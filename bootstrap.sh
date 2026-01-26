#!/usr/bin/env bash
# 🐦‍🔥 NOVA v3 Bootstrap Script - Phoenix Moment
# Erweckt NOVA v3 von 0 auf 100

set -euo pipefail
IFS=$'\n\t'

# Defaults
TARGET="local"            # use 'controller' to target environments/controller
NONINTERACTIVE=${NONINTERACTIVE:-false}
BACKEND_HEALTH_URL=${BACKEND_HEALTH_URL:-"http://localhost:8000/health"}
BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME:-"backend"}
MAX_ATTEMPTS=${MAX_ATTEMPTS:-30}
WAIT_SLEEP=${WAIT_SLEEP:-2}
# Backup/Recover defaults
DO_BACKUP=${DO_BACKUP:-false}
DO_RECOVER=${DO_RECOVER:-false}
BACKUP_DIR_ARG=${BACKUP_DIR_ARG:-""}
INCLUDE_REDIS=${INCLUDE_REDIS:-false}
FORCE_OPERATION=${FORCE_OPERATION:-false}
CONTINUE_AFTER_RECOVER=${CONTINUE_AFTER_RECOVER:-false}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

usage() {
    cat <<EOF
Usage: $0 [--target controller] [--noninteractive] [--health-url URL]

Options:
  --target <local|controller>   Choose compose environment (default: local)
  --noninteractive              Don't prompt when creating .env
  --health-url <URL>            Override backend health check URL
  --backup                      Create a backup of DB (and Redis if --include-redis)
  --backup-dir <dir>            Use specified directory for backup/restore
  --include-redis               Include Redis dump in backup/restore
  --recover                     Restore from a backup (--backup-dir required or latest used)
  --continue-after-recover      After recover, continue to start services
  --force                       Force overwrites (use with care)
  --help                        Show this message
EOF
}

# parse args
while [ "$#" -gt 0 ]; do
    case "$1" in
        --target)
            TARGET="$2"; shift 2;;
        --noninteractive)
            NONINTERACTIVE=true; shift;;
        --health-url)
            BACKEND_HEALTH_URL="$2"; shift 2;;
        --backup)
            DO_BACKUP=true; shift;;
        --recover)
            DO_RECOVER=true; shift;;
        --backup-dir)
            BACKUP_DIR_ARG="$2"; shift 2;;
        --include-redis)
            INCLUDE_REDIS=true; shift;;
        --force)
            FORCE_OPERATION=true; shift;;
        --continue-after-recover)
            CONTINUE_AFTER_RECOVER=true; shift;;
        --help)
            usage; exit 0;;
        *)
            log_error "Unknown argument: $1"; usage; exit 1;;
    esac
done

log_info "NOVA v3 Bootstrap - Phoenix Moment"
log_info "Target: ${TARGET}"
[ "$NONINTERACTIVE" = true ] && log_info "Running non-interactive"
log_info "Health URL: ${BACKEND_HEALTH_URL}"

# detect docker and compose command
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed. Aborting."
    exit 1
fi

DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    log_error "Neither 'docker compose' nor 'docker-compose' is available. Aborting."
    exit 1
fi
log_info "Using compose command: ${DOCKER_COMPOSE_CMD}"

# determine compose directory
COMPOSE_DIR="."
if [ "${TARGET}" = "controller" ]; then
    COMPOSE_DIR="environments/controller"
fi

# Ensure we are in repo root
if [ ! -f "${COMPOSE_DIR}/Dockerfile" ] && [ ! -f "${COMPOSE_DIR}/docker-compose.yml" ] && [ ! -f "docker-compose.yml" ]; then
    log_warn "Compose files not found in expected locations. Make sure you're running this from the repo root. (checked: ${COMPOSE_DIR}/docker-compose.yml and docker-compose.yml)"
fi

# copy .env if missing
ENV_FILE_PATH="${COMPOSE_DIR}/.env"
ENV_EXAMPLE_PATH="${COMPOSE_DIR}/.env.example"
if [ ! -f "${ENV_FILE_PATH}" ]; then
    if [ -f "${ENV_EXAMPLE_PATH}" ]; then
        log_warn "${ENV_FILE_PATH} not found. Creating from ${ENV_EXAMPLE_PATH}..."
        cp "${ENV_EXAMPLE_PATH}" "${ENV_FILE_PATH}"
        if [ "${NONINTERACTIVE}" = false ]; then
            log_warn "Please edit ${ENV_FILE_PATH} and fill required values (press Enter to continue when ready)"
            read -r
        else
            log_info "NONINTERACTIVE set; continuing with copied .env (please edit values if necessary)."
        fi
    else
        log_warn "No .env.example found at ${ENV_EXAMPLE_PATH}. Skipping .env creation."
    fi
fi

# If target controller, ensure essential vars exist
if [ "${TARGET}" = "controller" ]; then
    # check minimal required keys
    REQUIRED_KEYS=("AWX_SECRET_KEY" "AWX_ADMIN_PASSWORD" "POSTGRES_PASSWORD")
    missing=()
    for k in "${REQUIRED_KEYS[@]}"; do
        if ! grep -q "^${k}=" "${ENV_FILE_PATH}" 2>/dev/null; then
            missing+=("${k}")
        fi
    done
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required controller env keys in ${ENV_FILE_PATH}: ${missing[*]}"
        log_error "Please set them before continuing or re-run with --noninteractive=false after editing. Aborting."
        exit 1
    else
        log_info "Controller env variables present"
    fi
fi

# --- Backup & Restore helpers ---

# perform_backup: create a timestamped backup directory and collect Postgres (and optionally Redis) dumps
perform_backup() {
    dst_dir="backups/$(date -u +%Y%m%dT%H%M%SZ)"
    mkdir -p "${dst_dir}"

    # find postgres service
    PSVC=$(echo "${SERVICES}" | grep -E 'postgres|awx-postgres|db|postgresql' | head -n1 || true)
    if [ -n "${PSVC}" ]; then
        log_info "Creating Postgres dump (service: ${PSVC})"
        cid=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} ps -q ${PSVC}) 2>/dev/null || true)
        if [ -n "${cid}" ]; then
            docker exec -i "${cid}" bash -lc "pg_dumpall -U \"${POSTGRES_USER:-postgres}\"" > "${dst_dir}/postgres_dump.sql" || {
                log_error "Postgres dump failed"
            }
        else
            log_warn "Postgres container not running; skipping Postgres dump"
        fi
    else
        log_warn "No Postgres service detected in compose; skipping Postgres dump"
    fi

    if [ "${INCLUDE_REDIS}" = "true" ]; then
        RSVC=$(echo "${SERVICES}" | grep -E 'redis' | head -n1 || true)
        if [ -n "${RSVC}" ]; then
            log_info "Collecting Redis dump (service: ${RSVC})"
            rcid=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} ps -q ${RSVC}) 2>/dev/null || true)
            if [ -n "${rcid}" ]; then
                # attempt BGSAVE + copy dump.rdb
                docker exec -i "${rcid}" redis-cli -a "${REDIS_PASSWORD:-}" BGSAVE >/dev/null 2>&1 || true
                docker cp "${rcid}:/data/dump.rdb" "${dst_dir}/redis_dump.rdb" >/dev/null 2>&1 || log_warn "Could not copy Redis dump (file may not exist)"
            fi
        fi
    fi

    log_info "Backup written to ${dst_dir}"
}

# perform_restore: validate dump, ensure roles/extensions, and import into Postgres
perform_restore() {
    src_dir="$1"
    if [ -z "${src_dir}" ] || [ ! -d "${src_dir}" ]; then
        log_error "Invalid backup directory: ${src_dir}"
        exit 1
    fi

    PG_DUMP_FILE="${src_dir}/postgres_dump.sql"
}

# handle recover if requested (stop containers & restore before starting)
if [ "${DO_RECOVER}" = true ]; then
    SRC_DIR="${BACKUP_DIR_ARG}"
    if [ -z "${SRC_DIR}" ]; then
        # pick latest backup if available
        if [ -d "backups" ]; then
            LATEST=$(ls -1 backups | sort | tail -n1 || true)
            if [ -n "${LATEST}" ]; then
                SRC_DIR="backups/${LATEST}"
                log_info "No --backup-dir given; using latest backup: ${SRC_DIR}"
            fi
        fi
    fi
    if [ -z "${SRC_DIR}" ]; then
        log_error "No backup directory provided or found. Use --backup-dir <dir> or run backup first. Aborting recover."
        exit 1
    fi
    log_info "Recover requested from ${SRC_DIR}"
    log_info "Ensuring containers are stopped for restore"
    set +e
    (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} down -v)
    set -e

    # Complete perform_restore implementation: start postgres only, validate, create roles/extensions, and import
    perform_restore_body() {
        src_dir="$1"
        PG_DUMP_FILE="${src_dir}/postgres_dump.sql"

        SERVICES_LOCAL=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} config --services) 2>/dev/null || true)
        PSVC=$(echo "${SERVICES_LOCAL}" | grep -E 'postgres|awx-postgres|db|postgresql' | head -n1 || true)
        if [ -z "${PSVC}" ]; then
            log_error "No Postgres service found in compose stack to restore into"
            exit 1
        fi

        log_info "Starting Postgres service ${PSVC} for restore"
        (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} up -d ${PSVC}) || true
        cid=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} ps -q ${PSVC}) 2>/dev/null || true)
        if [ -z "${cid}" ]; then
            log_error "Could not determine Postgres container id for ${PSVC}"
            exit 1
        fi

        # wait for Postgres ready
        attempt=0
        until docker exec -i "${cid}" pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; do
            attempt=$((attempt + 1))
            if [ $attempt -ge ${MAX_ATTEMPTS} ]; then
                log_error "Postgres did not become ready in time"
                exit 1
            fi
            echo "Waiting for Postgres to become ready... (attempt ${attempt}/${MAX_ATTEMPTS})"
            sleep ${WAIT_SLEEP}
        done

        # detect dump PG version
        dumped_version=$(grep -m1 -E "Dumped from database version|PostgreSQL" "${PG_DUMP_FILE}" | sed -n 's/.*version \([0-9]\+\.[0-9]\+\).*/\1/p' || true)
        if [ -n "${dumped_version}" ]; then
            log_info "Dump claims Postgres version: ${dumped_version}"
            server_version=$(docker exec -i "${cid}" psql -U "${POSTGRES_USER:-postgres}" -d "postgres" -Atc "show server_version;" 2>/dev/null || true)
            server_major=$(echo "${server_version}" | sed -n 's/\([0-9]\+\.[0-9]\+\).*/\1/p' || true)
            dump_major=$(echo "${dumped_version}" | sed -n 's/\([0-9]\+\.[0-9]\+\).*/\1/p' || true)
            if [ -n "${server_major}" ] && [ "${server_major}" != "${dump_major}" ]; then
                log_warn "Server PG version ${server_major} differs from dump version ${dump_major}"
                if [ "${FORCE_OPERATION}" != "true" ]; then
                    log_error "Version mismatch detected. Use --force to override (risky). Aborting restore."
                    exit 1
                else
                    log_warn "Proceeding despite version mismatch because --force was given"
                fi
            fi
        else
            log_warn "Could not detect PG version from dump header; cannot verify compatibility"
        fi

        # run CREATE ROLE statements first
        role_lines=$(grep -nE "^[[:space:]]*CREATE ROLE" "${PG_DUMP_FILE}" || true)
        if [ -n "${role_lines}" ]; then
            log_info "Found role definitions in dump; applying missing roles before DB import"
            echo "${role_lines}" | while IFS= read -r line; do
                sql=$(echo "$line" | sed -n 's/^[0-9]\+://p')
                role=$(echo "$sql" | sed -E 's/CREATE ROLE "?([^"; ]+)"?.*/\1/I')
                if [ -n "$role" ]; then
                    exists=$(docker exec -i "${cid}" psql -U "${POSTGRES_USER:-postgres}" -d "postgres" -Atc "SELECT 1 FROM pg_roles WHERE rolname='${role}';" 2>/dev/null || true)
                    if [ "$exists" != "1" ]; then
                        log_info "Creating role ${role}"
                        docker exec -i "${cid}" psql -U "${POSTGRES_USER:-postgres}" -d "postgres" -c "$sql" >/dev/null 2>&1 || {
                            log_warn "Failed to create role ${role}; role creation may require superuser privileges or additional attributes"
                            if [ "${FORCE_OPERATION}" != "true" ]; then
                                log_error "Role creation failed; aborting restore to avoid inconsistent state"
                                exit 1
                            fi
                        }
                    else
                        log_info "Role ${role} already exists"
                    fi
                fi
            done
        fi

        # detect extensions required by dump
        extensions=$(grep -Eoi "CREATE EXTENSION IF NOT EXISTS \"?[a-z0-9_]+\"?" "${PG_DUMP_FILE}" | sed -E 's/CREATE EXTENSION IF NOT EXISTS "?([^"; ]+)"?.*/\1/' | sort -u || true)
        if [ -n "${extensions}" ]; then
            log_info "Dump requires extensions: ${extensions}"
            for ext in ${extensions}; do
                available=$(docker exec -i "${cid}" psql -U "${POSTGRES_USER:-postgres}" -d "postgres" -Atc "SELECT 1 FROM pg_available_extensions WHERE name='${ext}';" 2>/dev/null || true)
                if [ "$available" != "1" ]; then
                    log_error "Extension ${ext} is not available on the Postgres server (package not installed)."
                    if [ "${FORCE_OPERATION}" != "true" ]; then
                        log_error "Install the '${ext}' extension on the server or set --force to proceed at your own risk. Aborting."
                        exit 1
                    else
                        log_warn "--force set: proceeding despite missing extension ${ext}"
                    fi
                else
                    # attempt to create extension in postgres DB (safe if already exists)
                    docker exec -i "${cid}" psql -U "${POSTGRES_USER:-postgres}" -d "postgres" -c "CREATE EXTENSION IF NOT EXISTS \"${ext}\";" >/dev/null 2>&1 || {
                        log_warn "Could not create extension ${ext} automatically (you may need to install the contrib package)"
                        if [ "${FORCE_OPERATION}" != "true" ]; then
                            log_error "Failed to ensure extension ${ext}; aborting"
                            exit 1
                        fi
                    }
                fi
            done
        fi

        # import dump
        if docker exec -i "${cid}" psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" < "${PG_DUMP_FILE}"; then
            log_info "Database restore completed"
        else
            log_error "Database restore failed. Check dump and server logs"
            (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} logs --no-color --tail=200 ${PSVC} 2>/dev/null) || true
            exit 1
        fi

        # optional Redis restore
        if [ "${INCLUDE_REDIS}" = "true" ] && [ -f "${src_dir}/redis_dump.rdb" ]; then
            RSVC=$(echo "${SERVICES_LOCAL}" | grep -E 'redis' | head -n1 || true)
            if [ -n "${RSVC}" ]; then
                log_info "Restoring Redis RDB into service ${RSVC}"
                # ensure redis container running
                (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} up -d ${RSVC}) || true
                rcid=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} ps -q ${RSVC}) 2>/dev/null || true)
                if [ -n "${rcid}" ]; then
                    docker cp "${src_dir}/redis_dump.rdb" "${rcid}:/data/dump.rdb" >/dev/null 2>&1 || log_warn "Failed to copy redis dump into container"
                    # restart redis to load RDB
                    (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} restart ${RSVC}) || true
                fi
            fi
        fi
    }

    perform_restore_body "${SRC_DIR}" || {
        log_error "perform_restore failed"
        exit 1
    }

    if [ "${CONTINUE_AFTER_RECOVER}" != "true" ]; then
        log_info "Recover complete; exiting as --continue-after-recover not set"
        exit 0
    fi
    log_info "Continuing startup after recover"
fi

# if backup only requested and there are running containers, do not stop them — just backup and exit
if [ "${DO_BACKUP}" = true ] && [ "${DO_RECOVER}" != "true" ] && [ "${CONTINUE_AFTER_RECOVER}" != "true" ]; then
    running_containers=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} ps -q) 2>/dev/null || true)
    if [ -n "${running_containers}" ]; then
        log_info "Detected running containers; performing live backup and exiting"
        # refresh services variable for detection inside perform_backup
        SERVICES=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} config --services) 2>/dev/null || true)
        perform_backup
        exit 0
    fi
fi

# bring down existing containers (best effort)
log_info "Stopping existing containers (if any)..."
set +e
(cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} down -v)
set -e
log_info "Containers stopped"

# build images
log_info "Building Docker images..."
(cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} build)
log_info "Docker images built"

# start services
log_info "Starting services..."
(cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} up -d)
log_info "Services started"

# verify compose services contain backend (optional)
SERVICES=$((cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} config --services) 2>/dev/null || true)
if echo "${SERVICES}" | grep -qw "${BACKEND_SERVICE_NAME}"; then
    BACKEND_PRESENT=true
else
    BACKEND_PRESENT=false
    log_warn "Backend service '${BACKEND_SERVICE_NAME}' not found in compose services; skipping seed and health checks unless a custom health URL is provided."
fi

# perform backup if requested
if [ "${DO_BACKUP}" = true ]; then
    log_info "Backup requested (--backup)"
    perform_backup
    log_info "Backup finished"
    # if only backup was requested, exit
    if [ "${DO_RECOVER}" != "true" ] && [ "${CONTINUE_AFTER_RECOVER}" != "true" ]; then
        log_info "Backup completed; exiting as no further actions requested"
        exit 0
    fi
fi

# helper: read env value from compose .env or from environment
get_env_value() {
    var="$1"
    local val=""
    if [ -f "${ENV_FILE_PATH}" ]; then
        val=$(grep -m1 "^${var}=" "${ENV_FILE_PATH}" 2>/dev/null | sed -e "s/^${var}=//" -e 's/^"//;s/"$//') || true
    fi
    if [ -z "${val}" ]; then
        val=$(printenv "${var}" || true)
    fi
    echo "${val}"
}

# helper: wait for TCP port to be open
wait_for_port() {
    host="$1"; port="$2"; desc="$3"; attempt=0
    if [ -z "${host}" ] || [ -z "${port}" ]; then
        log_warn "Skipping wait for ${desc} (host/port not set)"
        return
    fi
    log_info "Waiting for ${desc} at ${host}:${port}"
    while ! timeout 1 bash -c "cat < /dev/null > /dev/tcp/${host}/${port}" >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -ge ${MAX_ATTEMPTS} ]; then
            log_error "${desc} at ${host}:${port} did not become available after ${MAX_ATTEMPTS} attempts"
            # try to fetch logs for likely service names
            PSVC=$(echo "${SERVICES}" | grep -E 'postgres|awx-postgres|db|postgresql' | head -n1 || true)
            if [ -n "${PSVC}" ]; then
                log_warn "Fetching logs for ${PSVC}..."
                (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} logs --no-color --tail=200 ${PSVC} 2>/dev/null) || true
            fi
            exit 1
        fi
        echo "Waiting for ${desc}... (attempt ${attempt}/${MAX_ATTEMPTS})"
        sleep ${WAIT_SLEEP}
    done
    log_info "${desc} is reachable"
}

# wait for Postgres if configured
PG_HOST=$(get_env_value "POSTGRES_HOST")
PG_PORT=$(get_env_value "POSTGRES_PORT")
if [ -n "${PG_HOST}" ]; then
    wait_for_port "${PG_HOST}" "${PG_PORT:-5432}" "Postgres"
else
    log_warn "No POSTGRES_HOST detected; skipping Postgres wait"
fi

# wait for Redis if configured
REDIS_HOST=$(get_env_value "REDIS_HOST")
REDIS_PORT=$(get_env_value "REDIS_PORT")
if [ -n "${REDIS_HOST}" ]; then
    wait_for_port "${REDIS_HOST}" "${REDIS_PORT:-6379}" "Redis"
else
    log_info "No Redis configured (skipping Redis wait)"
fi

# run DB migrations in backend container (if requested)
RUN_MIGRATIONS=${RUN_MIGRATIONS:-true}
if [ "${RUN_MIGRATIONS}" = "true" ] && [ "${BACKEND_PRESENT}" = true ]; then
    log_info "Running DB migrations (alembic upgrade head)"
    (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} exec -T ${BACKEND_SERVICE_NAME} alembic upgrade head) || {
        log_warn "Migrations failed or alembic not available in container; please run migrations manually if needed."
    }
fi

# wait for backend health if applicable
if [ "$BACKEND_PRESENT" = true ] || [ -n "${BACKEND_HEALTH_URL}" ]; then
    log_info "Checking backend health at ${BACKEND_HEALTH_URL}"
    attempt=0
    until curl -fsS "${BACKEND_HEALTH_URL}" >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -ge ${MAX_ATTEMPTS} ]; then
            log_error "Backend failed to become healthy after ${MAX_ATTEMPTS} attempts"
            log_warn "Fetching logs for troubleshooting..."
            (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} logs --no-color --tail=200 ${BACKEND_SERVICE_NAME} 2>/dev/null) || true
            exit 1
        fi
        echo "Waiting for backend... (attempt ${attempt}/${MAX_ATTEMPTS})"
        sleep ${WAIT_SLEEP}
    done
    log_info "Backend is healthy"
else
    log_warn "Skipping backend health check (no backend service and no health URL)."
fi

# seed DB if backend present
if [ "$BACKEND_PRESENT" = true ]; then
    log_info "Seeding database via service '${BACKEND_SERVICE_NAME}'"
    (cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} exec -T ${BACKEND_SERVICE_NAME} python -m app.seed) || {
        log_warn "Database seeding failed or not applicable; check service logs if necessary."
    }
fi

# final status
log_info "Service status (brief):"
(cd "${COMPOSE_DIR}" && ${DOCKER_COMPOSE_CMD} ps)

log_info "NOVA v3 Bootstrap completed"
log_info "Access points (adjust if using controller):"
log_info "  Frontend:       http://localhost"
log_info "  Backend API:    http://localhost:8000"
log_info "  API Docs:       http://localhost:8000/api/docs"

if [ "${TARGET}" = "controller" ]; then
    log_info "Controller target completed"
fi
