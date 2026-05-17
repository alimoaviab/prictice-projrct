#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# EduPlexo — Database Backup Script
# ═══════════════════════════════════════════════════════════════════════════
# Creates compressed PostgreSQL backups with 14-day rotation.
#
# Usage:
#   bash vps/backup.sh
#
# Crontab (daily at 2 AM):
#   0 2 * * * /opt/eduplexo/vps/backup.sh >> /var/log/eduplexo-backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
ENV_FILE="$SCRIPT_DIR/.env.vps"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Load environment
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

DB_NAME="${POSTGRES_DB:-eduplexo_prod}"
DB_USER="${POSTGRES_USER:-eduplexo_app}"
CONTAINER="eduplexo_postgres"

echo "[$(date)] Starting backup of $DB_NAME..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q "$CONTAINER"; then
    echo "[$(date)] ERROR: PostgreSQL container is not running"
    exit 1
fi

# Create compressed SQL backup
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

docker exec "$CONTAINER" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup created: $BACKUP_FILE"
echo "[$(date)] Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Rotate old backups
echo "[$(date)] Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Summary
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "[$(date)] Backup complete! ($BACKUP_COUNT backups, $BACKUP_SIZE total)"
