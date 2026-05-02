# 🌐 Configurazione Dominio aethersy.com

## Stato Attuale

✅ **Deploy Vercel**: https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app

✅ **API Registry**: Funzionante (90 tools, 10247 template)

⚠️ **Dominio**: aethersy.com è assegnato a un altro progetto Vercel

## 📋 Azioni Richieste

### 1. Sposta Dominio su Vercel Dashboard

Il dominio `aethersy.com` è attualmente assegnato a un altro progetto Vercel.

**Procedura:**
1. Vai su https://vercel.com/dashboard/domains
2. Trova `aethersy.com` 
3. Clicca "Remove" dal progetto corrente
4. Vai su https://vercel.com/mattiadeblasio94-8016s-projects/aiforge-pro/settings/domains
5. Clicca "Add Domain"
6. Inserisci `aethersy.com` e `www.aethersy.com`

### 2. Configura DNS (se necessario)

Se i nameserver non sono già configurati:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### 3. Verifica Configurazione

```bash
# Verifica dominio
curl -I https://aethersy.com

# Verifica API
curl https://aethersy.com/api/health
```

## 🔧 Deploy Server Alibaba

### Server 1: 47.87.141.154 (Frontend)
```bash
ssh root@47.87.141.154
cd /root/aiforge-pro
git pull origin master
npm install --production
npm run build
pm2 restart all
```

### Server 2: 47.87.134.105 (Lara AI + Ollama)
```bash
ssh root@47.87.134.105
cd /root/aiforge-pro
pm2 restart lara
systemctl restart ollama
```

### Server 3: 47.87.141.18 (Marketplace)
```bash
ssh root@47.87.141.18
# Nota: Questo server ha problemi di rete da risolvere
```

## 📱 Telegram Bot

Token attuale: `7912795396:AAHJmIdu4AmTzD3MhxmmfETNFEb73ZH5R_w`

Configura webhook:
```bash
curl -X POST "https://api.telegram.org/bot7912795396:AAHJmIdu4AmTzD3MhxmmfETNFEb73ZH5R_w/setWebhook?url=https://aethersy.com/api/telegram"
```

## ✅ Checklist Finale

- [ ] Sposta dominio aethersy.com su questo progetto Vercel
- [ ] Configura www.aethersy.com
- [ ] Verifica SSL certificate
- [ ] Aggiorna webhook Telegram
- [ ] Deploy server 47.87.141.154
- [ ] Deploy server 47.87.134.105
- [ ] Risolvi problemi server 47.87.141.18
- [ ] Test completo funzionalità

## 🔗 Link Utili

- Vercel Project: https://vercel.com/mattiadeblasio94-8016s-projects/aiforge-pro
- Vercel Domains: https://vercel.com/dashboard/domains
- Production URL: https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app
- Tools Dashboard: https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app/tools
