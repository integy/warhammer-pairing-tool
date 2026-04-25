#!/bin/bash
# Extract structured errors from gateway log

echo "=== RECENT ERRORS (last 500 lines) ==="
tail -500 ~/.openclaw/logs/gateway.log 2>/dev/null | grep '⇄ res ✗' | grep -v 'UNAVAILABLE\|models.list\|chat.history' | head -30

echo ""
echo "=== UNAVAILABLE ERRORS BY DAY ==="
grep 'UNAVAILABLE' ~/.openclaw/logs/gateway.log 2>/dev/null | cut -d' ' -f1-2 | sort | uniq -c | tail -20

echo ""
echo "=== SKILL DIRECTORY COUNT ==="
ls ~/.openclaw/workspace/skills/ 2>/dev/null | wc -l

echo ""
echo "=== GATEWAY ERRORS (non-UNAVAILABLE) ==="
grep 'errorCode=' ~/.openclaw/logs/gateway.log 2>/dev/null | grep -v 'UNAVAILABLE' | sed 's/.*errorCode=\([^ ]*\).*errorMessage=\([^)]*\).*/\1: \2/' | sort | uniq -c | sort -rn | head -15