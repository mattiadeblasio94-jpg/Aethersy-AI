import { answerCallbackQuery } from '../../lib/telegram';
import { conversationAgent, researchAgent, projectAgent, monetizationAgent, memoryAgent } from '../../lib/agents';
import { getSystemStatus } from '../../lib/ads-optimizer';
import { saveTelegramFile, extractTextFromBuffer, downloadTelegramFile, listFiles } from '../../lib/file-manager';
import { getAllProjects, clearHistory, getProject } from '../../lib/memory';
import { searchGitHub, getFinanceData, getCryptoPrice, scrapeUrl, research as doResearch } from '../../lib/research';
import { downloadTelegramAudio, transcribeAudio, textToSpeech, sendVoiceMessage } from '../../lib/voice';
import { isAdmin, grantAccess, revokeAccess, getAllGrants, getStats, trackUsage } from '../../lib/admin';
import { getUserPlan, checkDailyLimit, incrementUsage } from '../../lib/auth-sync';
import { trackTelegramUser, trackTelegramCommand } from '../../lib/tracking';
import { Redis } from '@upstash/redis';

export const config = { api: { bodyParser: true } };

// Bot now open to everyone with plan-based limits
function isAllowed(chatId) {
  return true; // Open to all users
}

// Check if user has access to a feature based on their plan
async function checkAccess(chatId, feature) {
  const plan = await getUserPlan(chatId);
  const limit = await checkDailyLimit(chatId, feature);

  if (!limit.ok) {
    return {
      allowed: false,
      message: `⚠️ Limite giornaliero raggiunto per ${feature}.\n\nPiano attuale: ${plan.toUpperCase()}\nUtilizzo: ${limit.used}/${limit.limit}\n\nUpgrade a /pro per limiti più alti.`
    };
  }

  return { allowed: true, plan, remaining: limit.remaining };
}

async function isDuplicate(updateId) {
  try {
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
    if (!url.startsWith('http')) return false;
    const r = new Redis({ url, token });
    const key = `tg:upd:${updateId}`;
    const exists = await r.get(key);
    if (exists) return true;
    await r.setex(key, 120, '1');
    return false;
  } catch { return false; }
}

async function tgSend(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 4000) }),
  });
}

// Store pending access requests in Redis
async function saveAccessRequest(telegramId, email, name) {
  const r = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  });
  const key = `access:request:${telegramId}`;
  const data = { telegramId, email, name, status: 'pending', createdAt: Date.now() };
  await r.setex(key, 86400 * 7, JSON.stringify(data)); // 7 days
  // Also add to pending list for admin
  await r.sadd('access:pending', telegramId);
  return data;
}

async function getAccessRequest(telegramId) {
  const r = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  });
  const raw = await r.get(`access:request:${telegramId}`);
  return raw ? JSON.parse(raw) : null;
}

async function approveAccessRequest(telegramId, approvedBy) {
  const r = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
  });
  const request = await getAccessRequest(telegramId);
  if (request) {
    await grantAccess(telegramId, 'pro', approvedBy);
    await r.del(`access:request:${telegramId}`);
    await r.srem('access:pending', telegramId);
    // Mark as lead converted
    await r.setex(`lead:telegram:${telegramId}`, 86400 * 30, JSON.stringify({
      email: request.email,
      telegramId,
      convertedAt: Date.now(),
      plan: 'pro'
    }));
  }
  return request;
}

async function handleCommand(chatId, text, userId) {
  const parts = text.trim().split(' ');
  const cmd = parts[0].toLowerCase().split('@')[0];
  const arg = parts.slice(1).join(' ').trim();

  // Track command usage
  await trackTelegramCommand(String(userId), cmd).catch(() => {});

  switch (cmd) {
    case '/start':
    case '/help': {
      const adminSection = isAdmin(userId)
        ? '\n\n🔑 ADMIN:\n/admin — pannello admin\n/grant <id> [piano] — accesso gratuito\n/revoke <id> — revoca accesso\n/stats — statistiche\n/users — lista utenti\n/pending — richieste pendenti\n/approva <id> — approva\n/rifiuta <id> — rifiuta'
        : '';
      const userSection = !isAdmin(userId)
        ? '\n\n🎁 ACCESSO GRATIS:\n/richiediaccesso — richiedi accesso PRO gratuito\n/link email — collega Telegram a web app'
        : '';
      return tgSend(chatId,
        `Lara AGENTE AI Aethersy 🤖\n\n` +
        `🔍 RICERCA:\n/cerca <domanda>\n/deep <domanda> — analisi profonda\n/arxiv <argomento> — paper\n/github <query>\n/news <argomento>\n/reddit <argomento>\n/scrape <url>\n\n` +
        `📊 DATI LIVE:\n/finance <simbolo> — es. AAPL\n/crypto <coin> — es. bitcoin\n\n` +
        `📋 PROGETTI:\n/progetto <nome>\n/progetti — lista\n\n` +
        `🧠 MEMORIA:\n/memoria\n/ricorda chiave=valore\n\n` +
        `💰 BUSINESS:\n/monetizza <niche>\n/status\n/reset\n\n` +
        `🔗 ACCOUNT:\n/link tua@email.com — collega Telegram a web app\n/account — vedi stato account\n\n` +
        `🎤 VOCE: Inviami un vocale per parlare con me!` +
        userSection +
        adminSection +
        `\n\n💬 Scrivi liberamente per chattare` +
        `\n\n🔑 Il tuo ID Telegram: ${userId}`
      );
    }

    case '/cerca': {
      if (!arg) return tgSend(chatId, 'Uso: /cerca <argomento>');
      const access = await checkAccess(chatId, 'search');
      if (!access.allowed) return tgSend(chatId, access.message);

      await tgSend(chatId, `🔍 Ricerco: ${arg}...`);
      await incrementUsage(chatId, 'search').catch(() => {});
      const { summary, sources } = await researchAgent(arg).catch(() => ({ summary: 'Errore ricerca', sources: [] }));
      const srcs = (sources || []).filter(r => r?.url?.startsWith('http')).slice(0, 4)
        .map((r, i) => `${i + 1}. [${r.source || 'Web'}] ${(r.title || '').slice(0, 60)}`).join('\n');
      return tgSend(chatId, `${summary}\n\n📎 Fonti:\n${srcs}`);
    }

    case '/deep': {
      if (!arg) return tgSend(chatId, 'Uso: /deep <argomento>');
      const access = await checkAccess(chatId, 'search');
      if (!access.allowed) return tgSend(chatId, access.message);

      await tgSend(chatId, `🔬 Analisi profonda: ${arg}... (attendi 20-30 sec)`);
      await incrementUsage(chatId, 'search').catch(() => {});
      const { summary } = await researchAgent(arg, true).catch(() => ({ summary: 'Errore.' }));
      return tgSend(chatId, summary);
    }

    case '/arxiv': {
      if (!arg) return tgSend(chatId, 'Uso: /arxiv <argomento>');
      await tgSend(chatId, `📚 Cerco paper: ${arg}...`);
      const { results } = await doResearch(arg).catch(() => ({ results: [] }));
      const papers = results.filter(r => r.source === 'ArXiv');
      if (!papers.length) return tgSend(chatId, 'Nessun paper trovato.');
      return tgSend(chatId, `ArXiv — ${arg}\n\n` +
        papers.slice(0, 5).map(r => `• ${(r.title || '').slice(0, 80)}\n  ${(r.snippet || '').slice(0, 120)}`).join('\n\n'));
    }

    case '/github': {
      if (!arg) return tgSend(chatId, 'Uso: /github <query>');
      await tgSend(chatId, `🔍 Cerco su GitHub: ${arg}...`);
      const repos = await searchGitHub(arg).catch(() => []);
      if (!repos.length) return tgSend(chatId, 'Nessun repo trovato.');
      return tgSend(chatId, `GitHub — ${arg}\n\n` +
        repos.slice(0, 5).map(r => `⭐ ${r.stars || 0} — ${(r.title || '').slice(0, 60)}`).join('\n'));
    }

    case '/news': {
      if (!arg) return tgSend(chatId, 'Uso: /news <argomento>');
      await tgSend(chatId, `📰 Cerco notizie: ${arg}...`);
      const { results } = await doResearch(arg).catch(() => ({ results: [] }));
      if (!results.length) return tgSend(chatId, 'Nessuna notizia trovata.');
      return tgSend(chatId, `Notizie — ${arg}\n\n` +
        results.slice(0, 6).map(r => `• ${(r.title || '').slice(0, 80)}`).join('\n'));
    }

    case '/reddit': {
      if (!arg) return tgSend(chatId, 'Uso: /reddit <argomento>');
      await tgSend(chatId, `💬 Cerco su Reddit: ${arg}...`);
      const { results } = await doResearch(arg).catch(() => ({ results: [] }));
      const reddit = results.filter(r => r.source === 'Reddit');
      if (!reddit.length) return tgSend(chatId, 'Nessun risultato Reddit.');
      return tgSend(chatId, `Reddit — ${arg}\n\n` +
        reddit.slice(0, 5).map(r => `• ${(r.title || '').slice(0, 70)}`).join('\n'));
    }

    case '/scrape': {
      if (!arg || !arg.startsWith('http')) return tgSend(chatId, 'Uso: /scrape https://...');
      await tgSend(chatId, `🕷 Scraping...`);
      const scraped = await scrapeUrl(arg).catch(e => ({ ok: false, error: e.message }));
      if (!scraped.ok) return tgSend(chatId, `Errore: ${scraped.error}`);
      const r = await conversationAgent(chatId, `Analizza questa pagina e dammi un riassunto:\n\n${scraped.text}`);
      return tgSend(chatId, r);
    }

    case '/finance': {
      if (!arg) return tgSend(chatId, 'Uso: /finance AAPL');
      await tgSend(chatId, `📈 Cerco: ${arg}...`);
      const fin = await getFinanceData(arg.toUpperCase()).catch(() => null);
      if (!fin) return tgSend(chatId, `Simbolo "${arg}" non trovato.`);
      const sign = parseFloat(fin.change) >= 0 ? '▲' : '▼';
      return tgSend(chatId,
        `📈 ${fin.symbol}\nPrezzo: ${fin.price} ${fin.currency}\nVariazione: ${sign} ${Math.abs(parseFloat(fin.change || 0)).toFixed(2)}%\nMax: ${fin.high} | Min: ${fin.low}`);
    }

    case '/crypto': {
      const coin = arg || 'bitcoin';
      await tgSend(chatId, `🪙 Cerco: ${coin}...`);
      const c = await getCryptoPrice(coin.toLowerCase()).catch(() => null);
      if (!c) return tgSend(chatId, `Crypto "${coin}" non trovata. Es: bitcoin, ethereum, solana`);
      const sign = (c.usd_24h_change || 0) >= 0 ? '▲' : '▼';
      return tgSend(chatId,
        `🪙 ${coin.toUpperCase()}\nPrezzo: $${c.usd}\nEUR: €${c.eur}\nVariazione 24h: ${sign} ${Math.abs(c.usd_24h_change || 0).toFixed(2)}%`);
    }

    case '/progetto': {
      if (!arg) return tgSend(chatId, 'Uso: /progetto <nome>');
      await tgSend(chatId, `📋 Creo progetto "${arg}"...`);
      const proj = await projectAgent('create', { name: arg, chatId }).catch(e => { throw e; });
      return tgSend(chatId, `✅ Progetto "${proj.name}" creato!\n\n${(proj.plan || '').slice(0, 3500)}`);
    }

    case '/progetti': {
      const list = await getAllProjects().catch(() => []);
      if (!list.length) return tgSend(chatId, 'Nessun progetto. Usa /progetto <nome>');
      return tgSend(chatId, `Progetti (${list.length}):\n` + list.map(p => `• ${p.name || 'Senza nome'}`).join('\n'));
    }

    case '/file': {
      const files = await listFiles().catch(() => []);
      if (!files.length) return tgSend(chatId, 'Nessun file. Inviami un PDF o TXT.');
      return tgSend(chatId, `File (${files.length}):\n` +
        files.slice(0, 20).map(f => `• ${f.fileName || 'file'} (${Math.round((f.size || 0) / 1024)}KB)`).join('\n'));
    }

    case '/memoria': {
      const mem = await memoryAgent('list', {}).catch(() => 'Memoria non disponibile');
      return tgSend(chatId, `🧠 Memoria AI:\n\n${mem}`);
    }

    case '/ricorda': {
      const idx = arg.indexOf('=');
      if (idx < 0) return tgSend(chatId, 'Formato: /ricorda chiave=valore');
      await memoryAgent('save', { key: arg.slice(0, idx).trim(), value: arg.slice(idx + 1).trim() });
      return tgSend(chatId, `✅ Memorizzato: ${arg.slice(0, idx).trim()}`);
    }

    case '/status': {
      const s = await getSystemStatus().catch(() => ({ campaigns: 0, revenue: 0, totalSpend: 0, roas: 'N/A' }));
      return tgSend(chatId, `📊 Status\nCampagne: ${s.campaigns || 0}\nRevenue: €${(s.revenue || 0).toFixed(2)}\nROAS: ${s.roas || 'N/A'}`);
    }

    case '/monetizza': {
      if (!arg) return tgSend(chatId, 'Uso: /monetizza <niche>');
      await tgSend(chatId, `💰 Elaboro strategia per: ${arg}...`);
      await trackUsage('monetize', chatId).catch(() => {});
      const strategy = await monetizationAgent('strategy', { niche: arg }).catch(e => `Errore: ${e.message}`);
      return tgSend(chatId, strategy);
    }

    case '/reset':
      await clearHistory(chatId).catch(() => {});
      return tgSend(chatId, '🔄 Cronologia cancellata.');

    // ── ADMIN COMMANDS ──────────────────────────────────────────────────────
    case '/admin': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato. Il tuo ID: ${userId}`);
      const s = await getStats().catch(() => null);
      if (!s) return tgSend(chatId, '⚠️ Errore caricamento stats.');
      return tgSend(chatId,
        `🔑 Admin Panel — Aethersy-AI\n\n` +
        `📊 Totale:\n• Ricerche: ${s.total.research}\n• Chat: ${s.total.chat}\n• Codice: ${s.total.code}\n• Voce: ${s.total.voice}\n\n` +
        `📅 Oggi:\n• Ricerche: ${s.today.research}\n• Chat: ${s.today.chat}\n\n` +
        `👥 Accessi attivi: ${s.grants}\n\n` +
        `Comandi: /grant /revoke /users /stats`
      );
    }

    case '/grant': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);
      const gParts = arg.split(' ');
      const gId = gParts[0];
      const gPlan = gParts[1] || 'pro';
      if (!gId || !/^\-?\d+$/.test(gId)) return tgSend(chatId, 'Uso: /grant <telegramId> [pro|free]');
      await grantAccess(gId, gPlan, String(userId));
      return tgSend(chatId, `✅ Accesso ${gPlan.toUpperCase()} concesso a ID ${gId}`);
    }

    case '/revoke': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);
      if (!arg || !/^\-?\d+$/.test(arg)) return tgSend(chatId, 'Uso: /revoke <telegramId>');
      await revokeAccess(arg);
      return tgSend(chatId, `✅ Accesso revocato a ID ${arg}`);
    }

    case '/stats': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);
      const st = await getStats().catch(() => null);
      if (!st) return tgSend(chatId, '⚠️ Errore stats.');
      return tgSend(chatId,
        `📊 Statistiche Aethersy-AI\n\nTOTALE:\n• Ricerche: ${st.total.research}\n• Chat: ${st.total.chat}\n• Codice: ${st.total.code}\n• Voce: ${st.total.voice}\n\nOGGI (${new Date().toISOString().slice(0, 10)}):\n• Ricerche: ${st.today.research}\n• Chat: ${st.today.chat}\n\nAccessi attivi: ${st.grants}`
      );
    }

    case '/users': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);
      const grants = await getAllGrants().catch(() => []);
      if (!grants.length) return tgSend(chatId, 'Nessun utente con accesso gratuito.');
      return tgSend(chatId,
        `👥 Accessi gratuiti (${grants.length}):\n\n` +
        grants.map(g => `• ID: ${g.telegramId} | ${g.plan} | ${new Date(g.grantedAt).toLocaleDateString('it-IT')}`).join('\n')
      );
    }

    case '/richiediaccesso': {
      // Format: /richiediaccesso nome@email.com Nome Cognome
      const match = arg.match(/([^\s]+@[^\s]+)\s+(.+)/);
      if (!match) {
        return tgSend(chatId,
          `📝 Richiedi accesso PRO gratuito\n\n` +
          `Usa: /richiediaccesso tua@email.com Nome Cognome\n\n` +
          `Esempio:\n/richiediaccesso mario@esempio.com Mario Rossi\n\n` +
          `La tua richiesta sarà inviata all'admin per approvazione.`
        );
      }
      const email = match[1];
      const name = match[2];

      // Save request
      await saveAccessRequest(userId, email, name);

      // Notify admin
      const adminId = (process.env.TELEGRAM_ADMIN_IDS || '8074643162').split(',')[0];
      await tgSend(adminId,
        `🔔 Nuova Richiesta Accesso\n\n` +
        `👤 Nome: ${name}\n` +
        `📧 Email: ${email}\n` +
        `🔗 Telegram ID: ${userId}\n\n` +
        `Per approvare: /approva ${userId}\n` +
        `Per rifiutare: /rifiuta ${userId}`
      );

      return tgSend(chatId,
        `✅ Richiesta inviata!\n\n` +
        `Riceverai una notifica quando l'admin approverà il tuo accesso PRO gratuito.`
      );
    }

    case '/approva': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);
      if (!arg || !/^\-?\d+$/.test(arg)) return tgSend(chatId, 'Uso: /approva <telegramId>');

      const request = await approveAccessRequest(arg, String(userId));
      if (!request) return tgSend(chatId, `⚠️ Nessuna richiesta pendente per ID ${arg}`);

      // Notify user
      await tgSend(arg,
        `🎉 Accesso APPROVATO!\n\n` +
        `✅ Il tuo account Telegram ora ha accesso PRO gratuito a Aethersy-AI.\n\n` +
        `Puoi usare tutti i comandi premium:\n` +
        `/cerca, /deep, /monetizza, /progetto, ecc.\n\n` +
        `Per la dashboard web: ${request.email ? `abbiamo registrato ${request.email}` : 'registrati su aethersy.com'}`
      );

      return tgSend(chatId, `✅ Accesso PRO approvato per ${request.name} (${request.email})`);
    }

    case '/rifiuta': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);
      if (!arg || !/^\-?\d+$/.test(arg)) return tgSend(chatId, 'Uso: /rifiuta <telegramId>');

      const r = new Redis({
        url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
        token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
      });
      await r.del(`access:request:${arg}`);
      await r.srem('access:pending', arg);

      // Notify user
      await tgSend(arg,
        `⚠️ Richiesta di accesso\n\n` +
        `La tua richiesta di accesso PRO è stata rifiutata.\n` +
        `Per maggiori informazioni contatta l'admin.`
      );

      return tgSend(chatId, `⚠️ Richiesta rifiutata per ID ${arg}`);
    }

    case '/pending': {
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);

      const r = new Redis({
        url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
        token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
      });
      const pending = await r.smembers('access:pending') || [];

      if (!pending.length) return tgSend(chatId, '✅ Nessuna richiesta pendente.');

      const list = [];
      for (const tid of pending) {
        const req = await getAccessRequest(tid);
        if (req) {
          list.push(`• ID: ${tid}\n  ${req.name} - ${req.email}\n  ${new Date(req.createdAt).toLocaleString('it-IT')}`);
        }
      }

      return tgSend(chatId, `⏳ Richieste Pendenti (${pending.length}):\n\n${list.join('\n\n') || 'Nessuna'}`);
    }

    case '/richieste': {
      // Alias per /pending
      if (!isAdmin(userId)) return tgSend(chatId, `⛔ Accesso negato.`);
      const handler = await handleCommand(chatId, '/pending', userId);
      return handler;
    }

    // ── ACCOUNT LINKING ──────────────────────────────────────────────────────
    case '/link': {
      if (!arg || !arg.includes('@') || !arg.includes('.')) {
        return tgSend(chatId,
          `🔗 Collega Telegram a Web App\n\n` +
          `Usa: /link tua@email.com\n\n` +
          `Esempio:\n/link mario@esempio.com\n\n` +
          `Una volta collegato, il tuo piano PRO/Business si sincronizza automaticamente.`
        );
      }

      const email = arg.trim();

      // Call API to link
      try {
        const res = await fetch('https://aethersy.com/api/auth/link-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'link', telegramId: String(userId), email })
        });
        const data = await res.json();

        if (data.success) {
          return tgSend(chatId,
            `✅ Telegram Collegato!\n\n` +
            `📧 Email: ${email}\n` +
            `🔗 ID Telegram: ${userId}\n\n` +
            `Ora il tuo piano web (Pro/Business) si sincronizza con Telegram.\n\n` +
            `Usa /account per verificare lo stato.`
          );
        } else if (data.error === 'Telegram già collegato') {
          return tgSend(chatId,
            `⚠️ Telegram già collegato\n\n` +
            `Questo Telegram è già associato a: ${data.linkedEmail}\n\n` +
            `Se vuoi collegarlo a un'altra email, prima scollegalo con /unlink`
          );
        } else if (data.error === 'Email già collegata') {
          return tgSend(chatId,
            `⚠️ Email già collegata\n\n` +
            `Questa email è già associata a un altro Telegram.\n\n` +
            `Contatta l'admin se hai problemi.`
          );
        } else {
          return tgSend(chatId, `⚠️ Errore: ${data.error || 'Impossibile collegare'}`);
        }
      } catch (e) {
        return tgSend(chatId, `⚠️ Errore di connessione: ${e.message}`);
      }
    }

    case '/unlink': {
      try {
        const res = await fetch('https://aethersy.com/api/auth/link-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unlink', telegramId: String(userId) })
        });
        const data = await res.json();

        if (data.success) {
          return tgSend(chatId, `✅ Telegram scollegato.\n\nIl tuo account web non è più sincronizzato con Telegram.`);
        } else {
          return tgSend(chatId, `⚠️ ${data.error || 'Nessun collegamento attivo'}`);
        }
      } catch (e) {
        return tgSend(chatId, `⚠️ Errore: ${e.message}`);
      }
    }

    case '/account': {
      const plan = await getUserPlan(userId);
      const limits = {
        free: { chat: 20, search: 5, voice: 5 },
        pro: { chat: '∞', search: '∞', voice: 100 },
        business: { chat: '∞', search: '∞', voice: '∞' },
        enterprise: { chat: '∞', search: '∞', voice: '∞' }
      };

      const link = await (async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/auth/link-telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check', telegramId: String(userId) })
          });
          return await res.json();
        } catch { return null; }
      })();

      let msg = `👤 Il Tuo Account\n\n`;
      msg += `🎫 Piano: ${plan.toUpperCase()}\n`;
      msg += `🔗 ID Telegram: ${userId}\n`;
      msg += `📊 Limiti giornalieri:\n`;
      msg += `   • Chat: ${limits[plan]?.chat || 20}\n`;
      msg += `   • Ricerca: ${limits[plan]?.search || 5}\n`;
      msg += `   • Voce: ${limits[plan]?.voice || 5}\n`;

      if (link?.linked) {
        msg += `\n📧 Email collegata: ${link.email}\n`;
        msg += `📅 Collegato dal: ${new Date(link.linkedAt).toLocaleDateString('it-IT')}\n`;
      } else {
        msg += `\n📧 Email collegata: Nessuna\n`;
        msg += `Usa /link tua@email.com per collegare l'account.\n`;
      }

      if (plan === 'free') {
        msg += `\n🆓 Piano Free — Usa /richiediaccesso per upgrade gratuito.`;
        msg += `\n\n💳 Vedi tutti i piani: /pro`;
      } else if (plan === 'pro' || plan === 'business' || plan === 'enterprise') {
        msg += `\n✅ Hai accesso premium a tutti i comandi!`;
      }

      return tgSend(chatId, msg);
    }

    case '/pro': {
      const plan = await getUserPlan(userId);
      return tgSend(chatId,
        `💳 PIANI DISPONIBILI\n\n` +
        `🆓 FREE — €0/mese\n` +
        `   • 20 chat/giorno\n` +
        `   • 5 ricerche/giorno\n` +
        `   • 5 vocali/giorno\n` +
        `   • Comandi base\n\n` +
        `⭐ PRO — €49/mese\n` +
        `   • Chat illimitate\n` +
        `   • Ricerche illimitate\n` +
        `   • 100 vocali/giorno\n` +
        `   • Tutti i comandi AI\n` +
        `   • Priorità supporto\n\n` +
        `🏢 BUSINESS — €199/mese\n` +
        `   • Tutto PRO +\n` +
        `   • Email AI\n` +
        `   • Workflow automations\n` +
        `   • 5 utenti team\n` +
        `   • Supporto prioritario\n\n` +
        `👑 ENTERPRISE — Personalizzato\n` +
        `   • Tutto illimitato\n` +
        `   • White label\n` +
        `   • API dedicato\n` +
        `   • Supporto 24/7\n\n` +
        `─────────────────\n` +
        `🎁 Accesso PRO gratuito disponibile!\n` +
        `Usa /richiediaccesso per richiedere.\n\n` +
        `🔗 Collega Telegram al web: /link email\n` +
        `💳 Gestisci abbonamento: https://aethersy.com/pricing\n\n` +
        `📊 Verifica il tuo piano: /account`
      );
    }

    // ── TERMINALE AUTONOMO LARA ──────────────────────────────────────────────
    case '/terminal': {
      // Solo admin possono usare il terminale autonomo
      if (!isAdmin(userId)) {
        return tgSend(chatId, `⛔ Comando riservato agli admin.\n\nIl tuo ID: ${userId}`);
      }

      if (!arg) {
        return tgSend(chatId,
          `🖥️ Terminale Autonomo Lara\n\n` +
          `Usa: /terminal <istruzione>\n\n` +
          `Esempi:\n` +
          `• /terminal crea API REST con Express per gestione utenti\n` +
          `• /terminal debugga il file pages/api/chat.js\n` +
          `• /terminal genera test per authentication middleware\n\n` +
          `Lara eseguirà il comando in autonomia usando il copilota AI.`
        );
      }

      await tgSend(chatId, `🖥️ Lara sta eseguendo...\n\n📝 ${arg}`);

      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com';
        const laraToken = process.env.LARA_TERMINAL_TOKEN || 'lara-secret-token';

        const res = await fetch(`${appUrl}/api/terminal?lara=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instruction: arg,
            language: 'javascript',
            mode: 'generate',
            auth: laraToken,
            lara: true,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
          return tgSend(chatId, `⚠️ Errore: ${err.error}`);
        }

        // Read streaming response
        const reader = res.body?.getReader();
        if (!reader) {
          return tgSend(chatId, `⚠️ Errore lettura stream`);
        }

        const decoder = new TextDecoder();
        let output = '';
        let tokens = 0;

        await tgSend(chatId, `⏳ Generazione in corso...`);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.t) {
                output += data.t;
              }
              if (data.done) {
                tokens = data.tokens || 0;
              }
              if (data.error) {
                return tgSend(chatId, `⚠️ Errore: ${data.error}`);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }

        // Send final output
        const finalMsg = `✅ **Esecuzione Completata**\n\n\`\`\`javascript\n${output.slice(0, 3500)}\n\`\`\`\n\n📊 Token usati: ${tokens}`;
        await tgSend(chatId, finalMsg);

        // Store execution for context
        const r = await getRedis();
        if (r) {
          await r.setex(`lara:terminal:last:${userId}`, 3600, JSON.stringify({
            instruction: arg,
            output: output.slice(0, 500),
            tokens,
            timestamp: Date.now(),
          }));
        }

      } catch (e) {
        await tgSend(chatId, `⚠️ Errore esecuzione: ${e.message}`);
      }

      break;
    }

    case '/google': {
      // Connect Google account for Gmail, Sheets, Docs
      if (!arg || arg !== 'connect') {
        return tgSend(chatId,
          `🔗 Google Integration\n\n` +
          `Usa: /google connect\n\n` +
          `Dopo aver collegato, Lara potrà:\n` +
          `• Inviare email tramite Gmail\n` +
          `• Leggere/scrivere su Google Sheets\n` +
          `• Creare documenti Google Docs\n` +
          `• Automatizzare workflow con Google Workspace\n\n` +
          `Riceverai un link per autorizzare l'accesso.`
        );
      }

      // Generate OAuth URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com';
      const state = JSON.stringify({
        telegramId: String(userId),
        action: 'link-google',
      });

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = `${appUrl}/api/auth/google/callback`;
      const scopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/docs',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;

      // Store state for callback
      const r = new Redis({
        url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
        token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
      });
      await r.setex(`google:pending:${userId}`, 600, state);

      return tgSend(chatId,
        `🔗 Collega Google Account\n\n` +
        `Clicca sul link per autorizzare Lara:\n` +
        `${authUrl}\n\n` +
        `⚠️ Il link scade tra 10 minuti.`
      );
    }

    case '/email': {
      // Send email via Gmail (requires Google connection)
      if (!arg) {
        return tgSend(chatId,
          `📧 Invia Email\n\n` +
          `Usa: /email destinatario | oggetto | testo\n\n` +
          `Esempio:\n` +
          `/email mario@esempio.com | Ciao Mario | Questo è un test\n\n` +
          `Devi prima collegare Google con /google connect`
        );
      }

      const parts = arg.split('|').map(p => p.trim());
      if (parts.length < 3) {
        return tgSend(chatId, `⚠️ Formato errato. Usa: /email destinatario | oggetto | testo`);
      }

      const [to, subject, body] = parts;

      // Store email request for Lara to process
      const r = new Redis({
        url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
        token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
      });
      await r.lpush('lara:email:queue', JSON.stringify({
        telegramId: String(userId),
        to,
        subject,
        body,
        timestamp: Date.now(),
      }));
      await r.ltrim('lara:email:queue', 0, 49);

      return tgSend(chatId, `✅ Email in coda per l'invio.\n\nLara la elaborerà a breve.`);
    }

    case '/larahelp': {
      if (!isAdmin(userId)) {
        return tgSend(chatId, `⛔ Comando riservato agli admin.`);
      }

      return tgSend(chatId,
        `🤖 Lara - Assistente Autonomo Aethersy\n\n` +
        `📌 COMANDI DISPONIBILI:\n\n` +
        `🔍 RICERCA:\n` +
        `• /cerca <domanda> — ricerca web\n` +
        `• /deep <domanda> — analisi profonda\n` +
        `• /arxiv <argomento> — paper scientifici\n` +
        `• /github <query> — cerca repo\n` +
        `• /scrape <url> — analizza pagina\n\n` +
        `🖥️ TERMINALE AUTONOMO:\n` +
        `• /terminal <istruzione> — esegui comandi\n` +
        `  Lara usa AI per eseguire in autonomia\n\n` +
        `🔗 GOOGLE WORKSPACE:\n` +
        `• /google connect — collega account Google\n` +
        `• /email to | oggetto | testo — invia email\n\n` +
        `📊 DATI LIVE:\n` +
        `• /finance <simbolo> — azioni\n` +
        `• /crypto <coin> — criptovalute\n\n` +
        `📋 PROGETTI:\n` +
        `• /progetto <nome> — crea progetto\n` +
        `• /progetti — lista progetti\n\n` +
        `💰 BUSINESS:\n` +
        `• /monetizza <niche> — strategia\n` +
        `• /status — stato campagne\n\n` +
        `🔗 ACCOUNT:\n` +
        `• /link email — collega account\n` +
        `• /account — stato account\n` +
        `• /pro — piani tariffari\n\n` +
        `🎤 VOCE: Invia un vocale per parlare!`
      );
    }

    default:
      return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = req.body || {};
    const { message, callback_query } = body;

    if (body.update_id && await isDuplicate(body.update_id)) {
      return res.status(200).json({ ok: true });
    }

    if (callback_query) {
      await answerCallbackQuery(callback_query.id, '').catch(() => {});
      const chatId = callback_query.message?.chat?.id;
      const data = callback_query.data || '';
      if (chatId && data.startsWith('proj:')) {
        const proj = await getProject(data.split(':')[1]).catch(() => null);
        if (proj) {
          const analysis = await projectAgent('analyze', { project: proj }).catch(() => 'Errore analisi');
          await tgSend(chatId, `${proj.name || 'Progetto'}\n\n${analysis}`);
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (!message) return res.status(200).json({ ok: true });

    const chatId = message.chat?.id;
    const userId = message.from?.id;
    const userName = message.from?.username || message.from?.first_name || 'Unknown';
    if (!chatId) return res.status(200).json({ ok: true });

    // Track every Telegram user
    await trackTelegramUser(String(userId), userName, message.from?.username).catch(() => {});

    if (!isAllowed(chatId)) {
      await tgSend(chatId, `⛔ Non autorizzato. Il tuo ID: ${chatId}`);
      return res.status(200).json({ ok: true });
    }

    // Voice message handling
    if (message.voice) {
      await tgSend(chatId, '🎤 Trascrivo il vocale...');
      try {
        const { buffer } = await downloadTelegramAudio(message.voice.file_id);
        const transcribed = await transcribeAudio(buffer, 'audio/ogg');
        if (!transcribed) {
          await tgSend(chatId, '⚠️ Non riesco a trascrivere il vocale. Riprova o scrivi il messaggio.');
          return res.status(200).json({ ok: true });
        }
        await tgSend(chatId, `📝 Ho sentito: "${transcribed.slice(0, 200)}"`);
        await trackUsage('voice', chatId).catch(() => {});
        const reply = await conversationAgent(chatId, transcribed);
        const audio = await textToSpeech(reply, 'nova').catch(() => null);
        if (audio) {
          await sendVoiceMessage(chatId, audio);
        } else {
          await tgSend(chatId, reply);
        }
      } catch (e) {
        await tgSend(chatId, `⚠️ Errore elaborazione vocale: ${e.message}`);
      }
      return res.status(200).json({ ok: true });
    }

    // Document / photo handling
    if (message.document || message.photo) {
      const doc = message.document || message.photo?.[message.photo.length - 1];
      const fileName = message.document?.file_name || `file_${Date.now()}`;
      const mimeType = message.document?.mime_type || 'application/octet-stream';
      await tgSend(chatId, `📎 ${fileName} ricevuto. Analizzo...`);
      try {
        const { buffer } = await downloadTelegramFile(doc.file_id);
        const extracted = await extractTextFromBuffer(buffer, mimeType);
        await saveTelegramFile(doc.file_id, fileName, mimeType).catch(() => {});
        const r = await conversationAgent(chatId, `Analizza questo file "${fileName}":\n\n${extracted}`);
        await tgSend(chatId, r);
      } catch (e) {
        await tgSend(chatId, `Errore analisi file: ${e.message}`);
      }
      return res.status(200).json({ ok: true });
    }

    const text = (message.text || '').trim();
    if (!text) return res.status(200).json({ ok: true });

    if (text.startsWith('/')) {
      const handled = await handleCommand(chatId, text, userId);
      if (handled !== null) return res.status(200).json({ ok: true });
    }

    // Free chat
    await trackUsage('chat', chatId).catch(() => {});
    const r = await conversationAgent(chatId, text);
    await tgSend(chatId, r);
    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error('Telegram error:', e.message);
    return res.status(200).json({ ok: true });
  }
}
