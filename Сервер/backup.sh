#!/bin/bash
# Weekly backup of therunbird.com: DB dump + site files (without var/cache).
# Runs from Alexsntu's crontab (Sun 03:00), output appended to backup.log.
# Keeps the last 8 sets (~2 months). DB credentials come from ~/.my.cnf.
set -euo pipefail

DIR=/srv/projects/backups
SITE=/srv/projects/therunbird.com/public_html
DB=therunbird_com
KEEP=8
TS=$(date +%Y-%m-%d_%H%M)
umask 077   # archives contain config.local.php with DB credentials

cd "$DIR"
echo "[$(date '+%F %T')] backup start"

mysqldump --single-transaction --no-tablespaces --quick --routines --triggers "$DB" | gzip > "db_$TS.sql.gz.part"
mv "db_$TS.sql.gz.part" "db_$TS.sql.gz"

tar -czf "files_$TS.tar.gz.part" -C "$SITE" --exclude=./var/cache .
mv "files_$TS.tar.gz.part" "files_$TS.tar.gz"

# rotate: keep the newest $KEEP of each kind
ls -1t db_*.sql.gz    | tail -n +$((KEEP+1)) | xargs -r rm -f
ls -1t files_*.tar.gz | tail -n +$((KEEP+1)) | xargs -r rm -f

echo "[$(date '+%F %T')] backup OK: db $(du -h "db_$TS.sql.gz" | cut -f1), files $(du -h "files_$TS.tar.gz" | cut -f1)"
