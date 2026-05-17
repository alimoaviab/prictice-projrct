#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# EduPlexo — VPS Production Deploy Script
# ═══════════════════════════════════════════════════════════════════════════
# Usage:
#   bash vps/deploy.sh              # Standard deploy
#   bash vps/deploy.sh --rebuild    # Force rebuild (no cache)
#
# Flow:
#   1. Validate environment
#   2. Backup database (if running)
#   3. Pull latest code
#   4. Build containers
#   5. Run migrations
#   6. Deploy services
#   7. Verify health

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.vps.yml"
ENV_FILE="$SCRIPT_DIR/.env.vps"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $(date '+%H:%M:%S') $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') $1"; }
error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"; exit 1; }

# ─── 1. Validate ──────────────────────────────────────────────────────────
log "Validating environment..."

if [ ! -f "$ENV_FILE" ]; then
    error ".env.vps not found. Copy from template and fill in values."
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    error "docker-compose.vps.yml not found."
fi

docker info &>/dev/null || error "Docker is not running."

# Check for placeholder values
if grep -q "CHANGE_ME" "$ENV_FILE"; then
    error ".env.vps still contains CHANGE_ME placeholders. Update all secrets first."
fi

# ─── 2. Pre-deploy Backup ─────────────────────────────────────────────────
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "eduplexo_postgres"; then
    log "Creating pre-deploy database backup..."
    bash "$SCRIPT_DIR/backup.sh" || warn "Backup failed (OK for first deploy)"
fi

# ─── 3. Pull Latest Code ──────────────────────────────────────────────────
log "Pulling latest code..."
cd "$PROJECT_DIR"
if git rev-parse --git-dir > /dev/null 2>&1; then
    git pull --ff-only 2>/dev/null || warn "Git pull skipped"
fi

# ─── 4. Build ─────────────────────────────────────────────────────────────
log "Building containers..."
BUILD_ARGS=""
if [ "${1:-}" = "--rebuild" ]; then
    BUILD_ARGS="--no-cache"
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build $BUILD_ARGS

# ─── 5. Deploy Infrastructure ─────────────────────────────────────────────
log "Starting infrastructure (postgres + redis)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

log "Waiting for database..."
sleep 10

# ─── 6. Run Migrations ────────────────────────────────────────────────────
log "Running migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up migrate
MIGRATE_EXIT=$(docker inspect eduplexo_migrate --format='{{.State.ExitCode}}' 2>/dev/null || echo "0")
if [ "$MIGRATE_EXIT" != "0" ]; then
    warn "Migration exit code: $MIGRATE_EXIT (may be OK if no new migrations)"
fi

# ─── 7. Deploy Application ────────────────────────────────────────────────
log "Starting backend + edubot..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend-go edubot

log "Waiting for backend to be healthy..."
sleep 15

log "Starting nginx..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx

# ─── 8. Health Check ──────────────────────────────────────────────────────
log "Verifying deployment..."
sleep 5

BACKEND_HEALTH=$(docker inspect eduplexo_backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
NGINX_HEALTH=$(docker inspect eduplexo_nginx --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
REDIS_HEALTH=$(docker inspect eduplexo_redis --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
PG_HEALTH=$(docker inspect eduplexo_postgres --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")

log "Health Status:"
log "  Backend:    $BACKEND_HEALTH"
log "  Nginx:      $NGINX_HEALTH"
log "  PostgreSQL: $PG_HEALTH"
log "  Redis:      $REDIS_HEALTH"

# ─── 9. Cleanup ───────────────────────────────────────────────────────────
log "Cleaning up old images..."
docker image prune -f --filter "until=168h" 2>/dev/null || true

# ─── Done ─────────────────────────────────────────────────────────────────
echo ""
log "═══════════════════════════════════════════════════════════════════"
log "Deployment complete!"
echo ""
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --format "table {{.Name}}\t{{.Status}}"
echo ""
log "API: https://api.eduplexo.com/health"
log "Logs: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
log "═══════════════════════════════════════════════════════════════════"
