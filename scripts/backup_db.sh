#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Eduplexo Database Backup Script
# ═══════════════════════════════════════════════════════════════════════════
# Run BEFORE any docker compose down or risky operation.
# Usage: ./scripts/backup_db.sh

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/eduplexo_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "📦 Backing up Eduplexo database..."
docker exec school_postgres pg_dump -U school_user -d school_db --no-owner --no-acl > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup saved: $BACKUP_FILE ($FILESIZE)"
echo ""
echo "To restore: cat $BACKUP_FILE | docker exec -i school_postgres psql -U school_user -d school_db"
