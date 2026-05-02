# 🚀 Deploy Alibaba Cloud - Aethersy.com

## Comandi da eseguire sui server

### Server 1: 47.87.134.105 (Lara AI + Ollama)

```bash
# Connettiti al server
ssh root@47.87.134.105

# Esegui deploy
cd /root/aiforge-pro
git pull origin master
npm install --production
pm2 restart lara
pm2 restart bridge

# Verifica
pm2 status
curl http://localhost:3000/api/health
```

### Server 2: 47.87.141.154 (Frontend + Bridge Telegram)

```bash
# Connettiti al server
ssh root@47.87.141.154

# Esegui deploy
cd /root/aiforge-pro
git pull origin master
npm install --production
npm run build
pm2 restart all

# Verifica
pm2 status
curl http://localhost:3000/api/health
```

### Server 3: 47.87.141.18 (Marketplace - se attivo)

```bash
# Connettiti al server
ssh root@47.87.141.18

# Esegui deploy
cd /root/aiforge-pro
git pull origin master
npm install --production
npm run build
pm2 restart marketplace

# Verifica
pm2 status
```

## Bot Telegram

```bash
# Connettiti al server del bot
ssh root@47.87.134.105

# Esegui script deploy bot
cd /root/aiforge-pro/bot-telegram
chmod +x deploy-on-alibaba.sh
./deploy-on-alibaba.sh
```

## Vercel Deploy

Il deploy su Vercel è già stato eseguito:
- **Production URL**: https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app
- **API Health**: https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app/api/health

Per configurare il dominio `aethersy.com`:
1. Vai su https://vercel.com/dashboard/domains
2. Sposta `aethersy.com` su questo progetto
3. Configura DNS: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`

## Verifica Finale

```bash
# Test API da locale
curl http://localhost:3000/api/tools/registry | jq

# Test Bot Telegram
# Invia /start a @Lara_Aethersy_AI_bot
```

## Stato Aggiornamenti

- ✅ 90 Strumenti AI implementati
- ✅ 10247 Template disponibili
- ✅ API Google Workspace integrata
- ✅ API PDF Generation attiva
- ✅ API Speech (TTS/STT) attiva
- ✅ API Image Generation attiva
- ✅ Registry API centralizzato
- ⏳ Deploy server Alibaba (da eseguire manualmente)
- ⏳ Dominio aethersy.com (da configurare su Vercel)
