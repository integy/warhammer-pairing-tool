#!/bin/bash
# OpenClaw Health Check Script
# Re-created 2026-04-13 after evolver deletion

echo "=== OpenClaw Health Check ==="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"

# Gateway status
MEM=$(ps aux | grep -i "[O]penClaw-gateway" | awk '{print $6/1024}' | head -1)
if [ -n "$MEM" ]; then
    echo "Gateway Memory: ${MEM} MB"
else
    echo "Gateway: not found"
fi

# Disk
DISK=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
echo "Disk: ${DISK}% used"

# Cron jobs
CRON=$(crontab -l 2>/dev/null | grep -c "openclaw" || echo "0")
echo "Cron Jobs: ${CRON} active"

# WhatsApp (placeholder - needs gateway status)
echo "WhatsApp: check gateway status"

echo "=== Health Check Complete ==="