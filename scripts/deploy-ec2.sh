#!/usr/bin/env bash
# ==============================================================================
# Traveloop V2 — Production EC2 Deployment Script
# Invoked via AWS Systems Manager (SSM) Run Command or run locally on EC2.
# ==============================================================================

set -euo pipefail

APP_DIR="/home/ubuntu/traveloop_V2"
BACKEND_DIR="${APP_DIR}/Backend"
AI_DIR="${APP_DIR}/ai-service"
EXPECTED_REPO="traveloop_V2"
BRANCH="main"
BACKUP_DIR=""

echo "=================================================================="
echo "Starting Traveloop V2 Production Deployment: $(date -u)"
echo "Target Directory: ${APP_DIR}"
echo "Current User: $(whoami) (UID: $(id -u))"
echo "=================================================================="

# Helper function to execute systemctl with appropriate privileges
run_systemctl() {
    if [ "$(id -u)" -eq 0 ]; then
        systemctl "$@"
    else
        sudo systemctl "$@"
    fi
}

# Helper function to execute journalctl with appropriate privileges
run_journalctl() {
    if [ "$(id -u)" -eq 0 ]; then
        journalctl "$@"
    else
        sudo journalctl "$@"
    fi
}

# Cleanup and safety trap on exit
cleanup_on_exit() {
    local exit_code=$?
    if [ "${exit_code}" -ne 0 ]; then
        echo "==================================================================" >&2
        echo "DEPLOYMENT FAILED (Exit Code: ${exit_code})" >&2
        if [ -n "${BACKUP_DIR}" ] && [ -d "${BACKUP_DIR}" ]; then
            echo "Preserving pre-deployment environment backup at: ${BACKUP_DIR}" >&2
            # Restore live environment files if removed or corrupted
            if [ -f "${BACKUP_DIR}/backend.env" ] && [ ! -s "${BACKEND_DIR}/.env" ]; then
                cp -p "${BACKUP_DIR}/backend.env" "${BACKEND_DIR}/.env"
                chmod 600 "${BACKEND_DIR}/.env" 2>/dev/null || true
                echo "Restored Backend/.env from backup." >&2
            fi
            if [ -f "${BACKUP_DIR}/serviceAccountKey.json" ] && [ ! -s "${BACKEND_DIR}/config/serviceAccountKey.json" ]; then
                cp -p "${BACKUP_DIR}/serviceAccountKey.json" "${BACKEND_DIR}/config/serviceAccountKey.json"
                chmod 600 "${BACKEND_DIR}/config/serviceAccountKey.json" 2>/dev/null || true
                echo "Restored Backend/config/serviceAccountKey.json from backup." >&2
            fi
            if [ -f "${BACKUP_DIR}/ai.env" ] && [ ! -s "${AI_DIR}/.env" ]; then
                cp -p "${BACKUP_DIR}/ai.env" "${AI_DIR}/.env"
                chmod 600 "${AI_DIR}/.env" 2>/dev/null || true
                echo "Restored ai-service/.env from backup." >&2
            fi
        fi
        echo "==================================================================" >&2
    fi
}
trap cleanup_on_exit EXIT

# 1. Verify target directory
if [ ! -d "${APP_DIR}" ]; then
    echo "ERROR: Target directory ${APP_DIR} does not exist on this system." >&2
    exit 1
fi

cd "${APP_DIR}"

# Ensure git trusts directory regardless of which user SSM runs as
git config --global --add safe.directory "${APP_DIR}" 2>/dev/null || true

# 2. Verify git repository and remote configuration
if [ ! -d "${APP_DIR}/.git" ]; then
    echo "ERROR: ${APP_DIR} is not a valid git repository." >&2
    exit 1
fi

REMOTE_URL=$(git config --get remote.origin.url || true)
if [[ "${REMOTE_URL}" != *"${EXPECTED_REPO}"* ]]; then
    echo "ERROR: Git remote origin '${REMOTE_URL}' does not match expected repository '${EXPECTED_REPO}'." >&2
    exit 1
fi

echo "Git remote verified: ${REMOTE_URL}"

# 3. Fetch latest origin/main
echo "Fetching latest changes from origin/${BRANCH}..."
git fetch origin "${BRANCH}"

# 4. Strict Preflight Checks
echo "Performing pre-deployment guards..."

# Check for uncommitted modifications in tracked files
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: Working tree has uncommitted modifications to tracked files!" >&2
    git status --short >&2
    echo "Deployment aborted to protect local modifications. Manual review is required." >&2
    exit 1
fi

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/${BRANCH}")
MERGE_BASE=$(git merge-base HEAD "origin/${BRANCH}")

echo "Local Commit:  ${LOCAL_COMMIT}"
echo "Remote Commit: ${REMOTE_COMMIT}"
echo "Merge Base:    ${MERGE_BASE}"

if [ "${LOCAL_COMMIT}" = "${REMOTE_COMMIT}" ]; then
    echo "Checkout is already up to date with origin/${BRANCH}."
    IS_UP_TO_DATE=true
elif [ "${LOCAL_COMMIT}" = "${MERGE_BASE}" ]; then
    echo "Checkout can safely fast-forward to origin/${BRANCH}."
    IS_UP_TO_DATE=false
else
    echo "ERROR: Local git checkout has diverged from origin/${BRANCH}!" >&2
    echo "Fast-forward merge is not possible. Manual reconciliation required on EC2." >&2
    exit 1
fi

# Detect affected components between current checkout and target commit
BACKEND_CHANGED=false
AI_CHANGED=false
BACKEND_DEPS_CHANGED=false
AI_DEPS_CHANGED=false

if [ "${IS_UP_TO_DATE}" = "false" ]; then
    CHANGED_FILES=$(git diff --name-only "${LOCAL_COMMIT}" "${REMOTE_COMMIT}")
    if echo "${CHANGED_FILES}" | grep -q "^Backend/"; then
        BACKEND_CHANGED=true
    fi
    if echo "${CHANGED_FILES}" | grep -q "^Backend/package.*json"; then
        BACKEND_DEPS_CHANGED=true
    fi
    if echo "${CHANGED_FILES}" | grep -q "^ai-service/"; then
        AI_CHANGED=true
    fi
    if echo "${CHANGED_FILES}" | grep -q "^ai-service/requirements\.txt"; then
        AI_DEPS_CHANGED=true
    fi
fi

# Apply manual override flags (e.g. from workflow_dispatch inputs)
if [ "${FORCE_RESTART_BACKEND:-false}" = "true" ] || [ "${FORCE_DEPLOY:-false}" = "true" ]; then
    BACKEND_CHANGED=true
fi
if [ "${FORCE_RESTART_AI:-false}" = "true" ] || [ "${FORCE_DEPLOY:-false}" = "true" ]; then
    AI_CHANGED=true
fi
if [ "${FORCE_DEP_INSTALL:-false}" = "true" ]; then
    BACKEND_DEPS_CHANGED=true
    AI_DEPS_CHANGED=true
fi

echo "Change detection summary:"
echo " - Backend changed:      ${BACKEND_CHANGED}"
echo " - Backend deps changed: ${BACKEND_DEPS_CHANGED}"
echo " - AI service changed:   ${AI_CHANGED}"
echo " - AI deps changed:      ${AI_DEPS_CHANGED}"

# 5. Permission-restricted backup of local production environment and credential files
BACKUP_DIR="/tmp/traveloop_pre_deploy_$(date +%s)"
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

if [ -f "${BACKEND_DIR}/.env" ]; then
    cp -p "${BACKEND_DIR}/.env" "${BACKUP_DIR}/backend.env"
    chmod 600 "${BACKUP_DIR}/backend.env"
    echo "Backed up local Backend/.env to ${BACKUP_DIR} (chmod 600)"
fi
if [ -f "${BACKEND_DIR}/config/serviceAccountKey.json" ]; then
    cp -p "${BACKEND_DIR}/config/serviceAccountKey.json" "${BACKUP_DIR}/serviceAccountKey.json"
    chmod 600 "${BACKUP_DIR}/serviceAccountKey.json"
    echo "Backed up local Backend/config/serviceAccountKey.json to ${BACKUP_DIR} (chmod 600)"
fi
if [ -f "${AI_DIR}/.env" ]; then
    cp -p "${AI_DIR}/.env" "${BACKUP_DIR}/ai.env"
    chmod 600 "${BACKUP_DIR}/ai.env"
    echo "Backed up local ai-service/.env to ${BACKUP_DIR} (chmod 600)"
fi

# 6. Perform fast-forward merge (never using hard reset or forced checkout)
if [ "${IS_UP_TO_DATE}" = "false" ]; then
    echo "Executing fast-forward merge to origin/${BRANCH} (${REMOTE_COMMIT})..."
    git merge --ff-only "origin/${BRANCH}"
fi

# 7. Restore and verify local production environment and credential files
if [ -f "${BACKUP_DIR}/backend.env" ] && [ ! -f "${BACKEND_DIR}/.env" ]; then
    cp -p "${BACKUP_DIR}/backend.env" "${BACKEND_DIR}/.env"
    echo "Restored production Backend/.env from backup."
fi
if [ -f "${BACKUP_DIR}/serviceAccountKey.json" ] && [ ! -f "${BACKEND_DIR}/config/serviceAccountKey.json" ]; then
    cp -p "${BACKUP_DIR}/serviceAccountKey.json" "${BACKEND_DIR}/config/serviceAccountKey.json"
    echo "Restored Backend/config/serviceAccountKey.json from backup."
fi
if [ -f "${BACKUP_DIR}/ai.env" ] && [ ! -f "${AI_DIR}/.env" ]; then
    cp -p "${BACKUP_DIR}/ai.env" "${AI_DIR}/.env"
    echo "Restored production ai-service/.env from backup."
fi

# Ensure existing environment files retain strict 600 permissions
[ -f "${BACKEND_DIR}/.env" ] && chmod 600 "${BACKEND_DIR}/.env" 2>/dev/null || true
[ -f "${AI_DIR}/.env" ] && chmod 600 "${AI_DIR}/.env" 2>/dev/null || true
[ -f "${BACKEND_DIR}/config/serviceAccountKey.json" ] && chmod 600 "${BACKEND_DIR}/config/serviceAccountKey.json" 2>/dev/null || true

# Ensure repository files are owned by ubuntu user if script executed as root
if [ "$(id -u)" -eq 0 ]; then
    chown -R ubuntu:ubuntu "${APP_DIR}" 2>/dev/null || true
fi

# 8. Backend dependency installation
if [ "${BACKEND_DEPS_CHANGED}" = "true" ] || [ ! -d "${BACKEND_DIR}/node_modules" ]; then
    echo "Backend dependencies require update. Running npm ci --omit=dev..."
    cd "${BACKEND_DIR}"
    if [ "$(id -u)" -eq 0 ]; then
        sudo -u ubuntu npm ci --omit=dev
    else
        npm ci --omit=dev
    fi
    cd "${APP_DIR}"
else
    echo "Backend dependencies unchanged; skipping npm install."
fi

# 9. AI Service dependency installation (deliberate, only when requirements.txt changes)
if [ "${AI_DEPS_CHANGED}" = "true" ]; then
    echo "AI requirements changed. Locating Python virtual environment..."
    AI_VENV=""
    for candidate in "${AI_DIR}/venv" "${AI_DIR}/.venv" "/home/ubuntu/venv" "/home/ubuntu/traveloop-venv"; do
        if [ -d "${candidate}" ] && [ -f "${candidate}/bin/pip" ]; then
            AI_VENV="${candidate}"
            break
        fi
    done

    if [ -n "${AI_VENV}" ]; then
        echo "Updating AI dependencies in virtual environment (${AI_VENV})..."
        if [ "$(id -u)" -eq 0 ]; then
            sudo -u ubuntu "${AI_VENV}/bin/pip" install --no-cache-dir -r "${AI_DIR}/requirements.txt"
        else
            "${AI_VENV}/bin/pip" install --no-cache-dir -r "${AI_DIR}/requirements.txt"
        fi
    else
        echo "WARNING: Python virtualenv not found in standard paths. Skipping pip update."
    fi
else
    echo "AI dependencies unchanged; skipping pip install."
fi

# 10. Restart Backend systemd service if affected
if [ "${BACKEND_CHANGED}" = "true" ]; then
    echo "Restarting traveloop-backend.service..."
    run_systemctl restart traveloop-backend.service
fi

# 11. Restart AI systemd service if affected
if [ "${AI_CHANGED}" = "true" ]; then
    echo "Restarting traveloop-ai.service..."
    run_systemctl restart traveloop-ai.service
fi

# 12. Bounded Retry Health Checks
echo "Verifying service health..."

# Backend Health Check (bounded 60-second retry loop)
echo "Checking Backend health at http://127.0.0.1:5000/api/health..."
BACKEND_HEALTHY=false
for i in $(seq 1 30); do
    HTTP_CODE=$(curl -s -o /tmp/backend_health.json -w "%{http_code}" http://127.0.0.1:5000/api/health 2>/dev/null || true)
    if [ "${HTTP_CODE}" = "200" ]; then
        echo "Backend health check PASSED on attempt ${i} (HTTP 200)."
        cat /tmp/backend_health.json
        echo ""
        BACKEND_HEALTHY=true
        break
    fi
    echo "Backend warming up (attempt ${i}/30, HTTP: ${HTTP_CODE}). Retrying in 2s..."
    sleep 2
done

if [ "${BACKEND_HEALTHY}" != "true" ]; then
    echo "ERROR: Backend health check failed after 60s timeout!" >&2
    echo "=== Service Status ===" >&2
    run_systemctl status traveloop-backend.service --no-pager >&2 || true
    echo "=== Recent Backend Logs ===" >&2
    run_journalctl -u traveloop-backend.service -n 50 --no-pager >&2 || true
    exit 1
fi

# AI Service Health Check (bounded 90-second retry loop to allow embedding model loading)
if [ "${AI_CHANGED}" = "true" ]; then
    echo "Checking AI service health at http://127.0.0.1:8000/health..."
    AI_HEALTHY=false
    for i in $(seq 1 30); do
        HTTP_CODE=$(curl -s -o /tmp/ai_health.json -w "%{http_code}" http://127.0.0.1:8000/health 2>/dev/null || true)
        if [ "${HTTP_CODE}" = "200" ]; then
            echo "AI service health check PASSED on attempt ${i} (HTTP 200)."
            cat /tmp/ai_health.json
            echo ""
            AI_HEALTHY=true
            break
        fi
        echo "AI service warming up (attempt ${i}/30, HTTP: ${HTTP_CODE}). Retrying in 3s..."
        sleep 3
    done

    if [ "${AI_HEALTHY}" != "true" ]; then
        echo "ERROR: AI service health check failed after 90s timeout!" >&2
        echo "=== AI Service Status ===" >&2
        run_systemctl status traveloop-ai.service --no-pager >&2 || true
        echo "=== Recent AI Logs ===" >&2
        run_journalctl -u traveloop-ai.service -n 50 --no-pager >&2 || true
        exit 1
    fi
fi

# 13. Clean up temporary backup only after successful and verified deployment
if [ -n "${BACKUP_DIR}" ] && [ -d "${BACKUP_DIR}" ]; then
    rm -rf "${BACKUP_DIR}"
    echo "Cleaned up pre-deployment temporary backup after successful deployment."
fi

DEPLOYED_SHA=$(git rev-parse HEAD)
echo "=================================================================="
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "Deployed Commit SHA: ${DEPLOYED_SHA}"
echo "Deployment Finished: $(date -u)"
echo "=================================================================="
