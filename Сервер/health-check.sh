#!/bin/bash
# Daily health check of therunbird.com (cron 08:00, output appended to health.log).
# Sends a Telegram message ONLY when something is wrong (ALERTS>0).
# Telegram credentials: .telegram.env next to this script (TG_BOT_TOKEN, TG_CHAT_ID),
# mode 600, never committed.

DIR=/srv/projects/backups
DB=therunbird_com
URL=https://therunbird.com/
ERRLOG=/var/log/nginx/therunbird.com/error.log
ALERTS=0
OUT=""

ok()    { OUT+="OK    $1"$'\n'; }
alert() { OUT+="ALERT $1"$'\n'; ALERTS=$((ALERTS+1)); }

# 1. disk
DISK=$(df --output=pcent /srv | tail -1 | tr -dc '0-9')
[ "$DISK" -lt 85 ] && ok "disk ${DISK}%" || alert "disk ${DISK}% (>=85%)"

# 2. MySQL + table integrity
if mysql -N -e "SELECT 1" "$DB" >/dev/null 2>&1; then
  ok "mysql reachable"
  BAD=$(mysql -N -e "CHECK TABLE cscart_orders, cscart_products, cscart_product_prices" "$DB" 2>&1 \
        | awk '$3=="status" && $4!="OK"' )
  [ -z "$BAD" ] && ok "tables OK" || alert "CHECK TABLE: $BAD"
else
  alert "mysql NOT reachable"
fi

# 3. site responds
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$URL")
[ "$CODE" = "200" ] && ok "site HTTP $CODE" || alert "site HTTP $CODE"

# 4. backup freshness (newest DB dump must be < 8 days old)
LAST=$(ls -1t "$DIR"/db_*.sql.gz 2>/dev/null | head -1)
if [ -n "$LAST" ] && [ -n "$(find "$LAST" -mtime -8)" ]; then
  ok "last backup $(basename "$LAST")"
else
  alert "no backup in the last 8 days"
fi

# 5. SSL expiry (alert if < 14 days left)
END=$(echo | openssl s_client -servername therunbird.com -connect therunbird.com:443 2>/dev/null \
      | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$END" ]; then
  DAYS=$(( ( $(date -d "$END" +%s) - $(date +%s) ) / 86400 ))
  [ "$DAYS" -ge 14 ] && ok "SSL ${DAYS} days left" || alert "SSL expires in ${DAYS} days"
else
  alert "SSL check failed"
fi

# 6. PHP fatal errors in the current site error log
if [ -r "$ERRLOG" ]; then
  FATAL=$(grep -c "PHP Fatal error" "$ERRLOG")
  [ "$FATAL" -eq 0 ] && ok "no PHP fatals" || alert "PHP Fatal errors: $FATAL in $(basename "$ERRLOG")"
else
  alert "error log not readable"
fi

echo "[$(date '+%F %T')] alerts=$ALERTS"
printf '%s' "$OUT"

if [ "$ALERTS" -gt 0 ] && [ -r "$DIR/.telegram.env" ]; then
  . "$DIR/.telegram.env"
  curl -s --max-time 20 "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
       --data-urlencode "chat_id=${TG_CHAT_ID}" \
       --data-urlencode "text=⚠️ therunbird.com: ${ALERTS} alert(s)
$(printf '%s' "$OUT" | grep '^ALERT')" >/dev/null
fi
