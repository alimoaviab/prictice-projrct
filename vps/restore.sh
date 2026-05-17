#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# EduPlexo — Database Restore Script
# ═══════════════════════════════════════════════════════════════════════════
# Restores database from a compressed backup file.
#
# Usage:
#   bash vps/restore.sh                                    # Lists available backups
#   bash vps/restore.sh backups/eduplexo_prod_20260517.sql.gz  # Restore specific backup

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
ENV_FILE="$SCRIPT_DIR/.env.vps"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.vps.yml"

# Load environment
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

DB_NAME="${POSTGRES_DB:-eduplexo_prod}"
DB_USER="${POSTGRES_USER:-eduplexo_app}"
CONTAINER="eduplexo_postgres"

# If no argument, list available backups
if [ -z "${1:-}" ]; then
    echo "═══════════════════════════════════════════════════════════════════"
    echo "  EduPlexo Database Restore"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Usage: bash vps/restore.sh <backup-file>"
    echo ""
    echo "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  No backups found"
    else
        echo "  Backup directory does not exist"
    fi
    exit 0
fi

BACKUP_FILE="$1"

# Resolve relative path
if [[ ! "$BACKUP_FILE" = /* ]]; then
    BACKUP_FILE="$SCRIPT_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════════"
echo "  WARNING: This will REPLACE the current database!"
echo ""
echo "  Database: $DB_NAME"
echo "  Backup:   $(basename "$BACKUP_FILE")"
echo "  Size:     $(du -h "$BACKUP_FILE" | cut -f1)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
read -p "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Stop backend to prevent writes during restore
echo "[$(date)] Stopping backend..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop backend-go edubot 2>/dev/null || true

# Drop and recreate database
echo "[$(date)] Dropping and recreating database..."
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" 2>/dev/null || true
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Restore
echo "[$(date)] Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" --quiet

# Restart services
echo "[$(date)] Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend-go edubot

echo ""
echo "[$(date)] Restore complete! Services restarted."
