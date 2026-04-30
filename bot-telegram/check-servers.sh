#!/bin/bash
# Script per controllare tutti i server Alibaba

KEY="C:\Users\PC\aiforge-pro\alibaba_key.pem"

SERVERS=(
    "47.87.134.105"
    "47.87.141.18"
    "47.87.139.66"
    "47.87.141.154"
)

for IP in "${SERVERS[@]}"; do
    echo "========================================"
    echo "🔍 Checking server: $IP"
    echo "========================================"

    # Cerca processi python/userbot
    ssh -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$IP "
        echo '=== Processi Python/Telegram ==='
        ps aux | grep -E 'python.*telegram|userbot|telethon|pyrogram' | grep -v grep

        echo ''
        echo '=== File .session ==='
        find /root -name '*.session' 2>/dev/null

        echo ''
        echo '=== Directory aiforge-pro ==='
        ls -la /root/aiforge-pro 2>/dev/null || echo 'Non esiste'

        echo ''
        echo '=== Servizi systemd attivi ==='
        systemctl list-units --type=service --all | grep -i telegram
    " 2>&1

    echo ""
done
