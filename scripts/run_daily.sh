#!/usr/bin/env bash
# KhouyaFX — Daily Office des Changes Scraper
# ─────────────────────────────────────────────────────────────────────────────
# Schedule with cron (runs every day at 07:15 Morocco time):
#   15 7 * * * /path/to/KhouyaFX/scripts/run_daily.sh >> /var/log/khouyafx_scraper.log 2>&1
#
# Usage:
#   ./run_daily.sh           # Normal run
#   ./run_daily.sh --force   # Reprocess all docs
#   ./run_daily.sh --test    # Dry run
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
LOG_DIR="$SCRIPT_DIR/data"
NOTIFY_EMAIL="${OC_NOTIFY_EMAIL:-}"   # Set this env var to receive email alerts

echo ""
echo "═══════════════════════════════════════════════════"
echo " KhouyaFX — Office des Changes Scraper"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════"

# ─── 1. Ensure virtual environment exists ─────────────────────────────────────
if [ ! -f "$PYTHON" ]; then
    echo "[SETUP] Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install --quiet --upgrade pip
    "$VENV_DIR/bin/pip" install --quiet -r "$SCRIPT_DIR/requirements.txt"
    echo "[SETUP] Dependencies installed."
fi

# ─── 2. Ensure data directory exists ──────────────────────────────────────────
mkdir -p "$LOG_DIR"

# ─── 3. Run the scraper ───────────────────────────────────────────────────────
echo "[RUN] Starting scraper..."
OUTPUT=$("$PYTHON" "$SCRIPT_DIR/scraper.py" "$@" 2>&1)
EXIT_CODE=$?

echo "$OUTPUT"

if [ $EXIT_CODE -ne 0 ]; then
    echo "[ERROR] Scraper exited with code $EXIT_CODE"
    exit $EXIT_CODE
fi

# ─── 4. Alert on new documents ────────────────────────────────────────────────
# Check if JSON output was emitted (new docs found)
if echo "$OUTPUT" | grep -q '"new_count"'; then
    NEW_COUNT=$(echo "$OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['new_count'])" 2>/dev/null || echo "?")

    echo ""
    echo "🔔 ALERT: $NEW_COUNT new OC regulation(s) detected!"

    # Email notification (requires mailutils or similar)
    if [ -n "$NOTIFY_EMAIL" ]; then
        SUBJECT="[KhouyaFX] $NEW_COUNT New Office des Changes Regulation(s)"
        BODY="New regulatory documents detected by the KhouyaFX scraper.\n\n$OUTPUT"
        echo -e "$BODY" | mail -s "$SUBJECT" "$NOTIFY_EMAIL" 2>/dev/null || \
            echo "[WARN] Could not send email notification (mailutils not configured)."
    fi

    # If WEBHOOK_URL is set, POST a JSON summary
    if [ -n "${WEBHOOK_URL:-}" ]; then
        SUMMARY=$(echo "$OUTPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(json.dumps({'text': f':rotating_light: {data[\"new_count\"]} new OC circulaire(s) detected at $(date \"+%Y-%m-%d\")!', 'data': data}))
" 2>/dev/null || echo '{"text":"New OC docs found"}')
        curl -s -X POST "$WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "$SUMMARY" > /dev/null || \
            echo "[WARN] Webhook delivery failed."
    fi
fi

echo ""
echo "[DONE] Scraper finished at $(date '+%H:%M:%S')"
