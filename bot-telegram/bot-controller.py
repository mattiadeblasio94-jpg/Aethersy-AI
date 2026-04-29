#!/usr/bin/env python3
"""
Lara Bot Central Controller
Gestisce tutti i bot Telegram sui server Alibaba
"""
import requests, json

SERVERS = [
    {"name": "Server 1 (BOT)", "ip": "47.87.134.105", "port": 9999},
    {"name": "Server 2", "ip": "47.87.141.18", "port": 9999},
    {"name": "Server 3", "ip": "47.87.139.66", "port": 9999},
    {"name": "Server 4", "ip": "47.87.141.154", "port": 9999},
]

def send_cmd(server, cmd):
    try:
        r = requests.post(f"http://{server['ip']}:{server['port']}",
                         json={"cmd": cmd}, timeout=5)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def status():
    print("\n📊 STATO BOT SU TUTTI I SERVER\n")
    for s in SERVERS:
        r = send_cmd(s, "status")
        status = r.get('status', '❌ OFFLINE') if 'error' not in r else f"❌ {r['error']}"
        print(f"{s['name']} ({s['ip']}): {status}")

def deploy():
    print("\n🚀 Deploy bot su tutti i server...\n")
    for s in SERVERS:
        r = send_cmd(s, "deploy")
        print(f"{s['name']}: {'✅' if 'ok' in r else '❌'}")

def restart():
    print("\n🔄 Riavvio bot su tutti i server...\n")
    for s in SERVERS:
        r = send_cmd(s, "restart")
        print(f"{s['name']}: {'✅' if 'ok' in r else '❌'}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == 'status': status()
        elif cmd == 'deploy': deploy()
        elif cmd == 'restart': restart()
    else:
        print("Uso: python bot-controller.py [status|deploy|restart]")
