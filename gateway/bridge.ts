/**
 * Aethersy Bridge - Ponte Telegram-Terminale-Dashboard
 * Sincronizzazione realtime tra Telegram Bot, Terminale AI e Dashboard Web
 */

import TelegramBot from 'node-telegram-bot-api';
import { spawn } from 'child_process';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });
const io = new Server(3001, { cors: { origin: '*' } });

// Sessioni attive
const sessions = new Map<string, { userId: string; chatId?: number }>();

// Middleware di autorizzazione
const checkUserAccess = async (telegramId: number) => {
  const { data, error } = await supabase
    .from('lara_users')
    .select('plan, tokens_used, tokens_limit')
    .eq('telegram_chat_id', telegramId.toString())
    .single();

  if (error || !data) return { allowed: false, plan: 'unknown' };
  if (data.tokens_used >= data.tokens_limit) return { allowed: false, reason: 'limit', plan: data.plan };
  return { allowed: true, plan: data.plan };
};

// Log attività per dashboard realtime
const logAgentAction = async (userId: string, sessionId: string, action: string, status: string, payload: any) => {
  try {
    await supabase.from('lara_logs').insert({
      session_id: sessionId,
      user_id: userId,
      phase: 'act',
      action,
      input: payload,
      status,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Log error:', e);
  }
};

// Elaborazione con AI (Groq/Ollama)
async function processWithAI(sessionId: string, userId: string, text: string, chatId: number, plan: string) {
  try {
    // Costruisci contesto da Obsidian
    const { data: notes } = await supabase
      .from('notes')
      .select('title, content')
      .eq('user_id', userId)
      .limit(5);

    // Chiama Groq per ragionamento
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: `Sei Aethersy AI, assistente per imprenditori. Piano utente: ${plan}. Usa note contestuali se utili.` },
          { role: 'user', content: text }
        ]
      })
    });

    const response = await groqResponse.json();
    const reply = response.choices?.[0]?.message?.content || 'Errore elaborazione.';

    // Rispondi su Telegram
    bot.sendMessage(chatId, reply);

    // Aggiorna dashboard
    io.emit('agent-action', {
      sessionId,
      type: 'response',
      content: reply
    });

    // Log completamento
    await logAgentAction(userId, sessionId, 'ai_response', 'completed', { reply });
  } catch (error: any) {
    await logAgentAction(userId, sessionId, 'ai_response', 'error', { error: error.message });
    io.emit('agent-action', { sessionId, type: 'error', content: error.message });
    bot.sendMessage(chatId, `❌ Errore: ${error.message}`);
  }
}

// Gestione messaggi Telegram
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString() || 'unknown';
  const text = msg.text;

  if (!text) return;

  // Comandi rapidi
  if (text === '/start') {
    await bot.sendMessage(chatId,
      '🤖 **Lara AI Online**\n\n' +
      'Usa /help per i comandi\n' +
      'Dashboard: https://aethersy.com/dashboard'
    );
    return;
  }

  if (text === '/help') {
    await bot.sendMessage(chatId,
      '📚 **Comandi**\n\n' +
      '/note <titolo> - Crea nota\n' +
      '/search <query> - Cerca note\n' +
      '/generate <prompt> - Genera immagine\n' +
      '/status - Stato account\n' +
      '/reset - Reset conversazione'
    );
    return;
  }

  // Controllo accesso
  const access = await checkUserAccess(chatId);
  if (!access.allowed) {
    return bot.sendMessage(chatId,
      access.reason === 'limit'
        ? '❌ Limite token raggiunto. Upgrade: /pricing'
        : '❌ Accesso negato. Configura Telegram ID in dashboard.'
    );
  }

  // Recupera/crea utente
  const { data: user } = await supabase
    .from('lara_users')
    .select('id, user_id')
    .eq('telegram_chat_id', chatId.toString())
    .single();

  const effectiveUserId = user?.user_id || `tg-${chatId}`;
  const sessionId = `${effectiveUserId}-${Date.now()}`;

  // Log inizio azione
  await logAgentAction(effectiveUserId, sessionId, 'telegram_message', 'thinking', { text, chatId });

  // Notifica dashboard
  io.emit('agent-action', {
    sessionId,
    type: 'thinking',
    content: `Ricevuto: "${text}"`
  });

  // Se è comando bash esplicito (admin)
  if (text.startsWith('!') && access.plan === 'admin') {
    const command = text.slice(1);
    const statusMsg = await bot.sendMessage(chatId, '⚡ Esecuzione comando...');

    const shell = spawn('bash', ['-c', command]);

    shell.stdout.on('data', (data) => {
      const output = data.toString();
      io.emit('terminal-output', { sessionId, content: output, type: 'stdout' });
      if (output.length < 4000) {
        bot.sendMessage(chatId, `\`\`\`${output}\`\`\``);
      }
    });

    shell.stderr.on('data', (data) => {
      io.emit('terminal-output', { sessionId, content: data.toString(), type: 'stderr' });
    });

    shell.on('close', () => {
      bot.editMessageText('✅ Completato', { chat_id: chatId, message_id: statusMsg.message_id });
      io.emit('agent-action', { sessionId, type: 'completed' });
      logAgentAction(effectiveUserId, sessionId, 'bash_command', 'completed', { command });
    });
    return;
  }

  // Altrimenti passa all'Agente Core per elaborazione AI
  await processWithAI(sessionId, effectiveUserId, text, chatId, access.plan);
});

// Comando /config per admin
bot.onText(/\/config (.+)/, async (msg, match) => {
  if (!match) return;
  const chatId = msg.chat.id;
  const [key, ...valueParts] = match[1].split('=');
  const value = valueParts.join('=').trim();

  const { data: user } = await supabase
    .from('lara_users')
    .select('plan')
    .eq('telegram_chat_id', chatId.toString())
    .single();

  if (user?.plan !== 'admin') {
    return bot.sendMessage(chatId, '⛔ Solo admin.');
  }

  await supabase
    .from('platform_config')
    .upsert({ key: key.trim(), value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  io.emit('config-change', { key: key.trim(), value, timestamp: new Date().toISOString() });
  bot.sendMessage(chatId, `✅ Config: ${key.trim()} = ${value}`);
});

// Gestione comandi strutturati
bot.onText(/\/note (.+)/, async (msg, match) => {
  if (!match) return;
  const chatId = msg.chat.id;
  const title = match[1].trim();

  bot.sendMessage(chatId, '📝 Inviami il contenuto della nota (invia "FINE" su riga singola per terminare)');

  const listener = async (contentMsg: any) => {
    if (contentMsg.chat.id !== chatId) return;
    if (contentMsg.text === 'FINE') {
      bot.removeListener('message', listener);

      const { data: user } = await supabase
        .from('lara_users')
        .select('id, user_id')
        .eq('telegram_chat_id', chatId.toString())
        .single();

      const effectiveUserId = user?.user_id || `tg-${chatId}`;

      await supabase.from('notes').insert({
        user_id: effectiveUserId,
        title,
        content: 'Nota creata da Telegram',
        content_preview: 'Nota creata da Telegram',
        folder: 'telegram'
      });

      bot.sendMessage(chatId, `✅ Nota "${title}" creata!`);
      io.emit('note-created', { title, userId: effectiveUserId, platform: 'telegram' });
    }
  };

  bot.on('message', listener);
});

console.log('🌉 Aethersy Bridge attivo su Telegram + WebSocket (port 3001)');
