/**
 * Aethersy Bridge - Ponte Telegram-Terminale WebSocket
 * Collega bot Telegram alla dashboard web in realtime
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

// Cache sessioni attive
const activeSessions = new Map<string, { chatId: number; statusMsg: any; userId: string }>();

// Middleware di autorizzazione
const checkUserAccess = async (telegramId: number) => {
  const { data, error } = await supabase
    .from('lara_users')
    .select('plan, tokens_used, tokens_limit')
    .eq('telegram_chat_id', telegramId.toString())
    .single();

  if (error || !data) return { allowed: false };
  if (data.tokens_used >= data.tokens_limit) return { allowed: false, reason: 'limit' };
  return { allowed: true, plan: data.plan };
};

// Log attività per dashboard realtime
const logAgentAction = async (userId: string, action: string, status: string, payload: any) => {
  await supabase.from('lara_logs').insert({
    session_id: `tg-${Date.now()}`,
    user_id: userId,
    phase: 'act',
    action,
    input: payload,
    status,
    created_at: new Date().toISOString()
  });
};

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

  // Notifica inizio esecuzione
  const statusMsg = await bot.sendMessage(chatId, '⚡ Elaboro...');

  // Crea sessione
  const sessionId = `${effectiveUserId}-${Date.now()}`;
  activeSessions.set(sessionId, { chatId, statusMsg, userId: effectiveUserId });

  // Emetti evento per dashboard
  io.emit('agent-start', {
    sessionId,
    userId: effectiveUserId,
    prompt: text,
    platform: 'telegram',
    timestamp: new Date().toISOString()
  });

  await logAgentAction(effectiveUserId, 'telegram_message', 'thinking', { text, chatId });

  // Chiama AI server
  try {
    const aiUrl = process.env.LARA_WEBHOOK_URL || 'http://localhost:5001/chat';
    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        userId: effectiveUserId,
        sessionId,
        platform: 'telegram'
      }),
      timeout: 120000
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Stream output a dashboard
    io.emit('terminal-output', {
      sessionId,
      content: data.response,
      type: 'stdout',
      timestamp: new Date().toISOString()
    });

    // Aggiorna log
    await logAgentAction(effectiveUserId, 'telegram_message', 'completed', {
      response: data.response,
      model: data.model
    });

    // Rispondi su Telegram
    await bot.editMessageText(
      `✅ **Lara**\n\n${data.response.slice(0, 4000)}`,
      {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown'
      }
    );

    // Completa sessione
    io.emit('agent-complete', {
      sessionId,
      success: true,
      output: data.response,
      model: data.model,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    await logAgentAction(effectiveUserId, 'telegram_message', 'error', { error: error.message });

    io.emit('agent-complete', {
      sessionId,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    await bot.editMessageText(
      `❌ Errore: ${error.message}`,
      { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }
    );
  }

  activeSessions.delete(sessionId);
});

// Comando /config per admin
bot.onText(/\/config (.+)/, async (msg, match) => {
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
  const chatId = msg.chat.id;
  const title = match[1].trim();
  const userId = msg.from?.id.toString() || 'unknown';

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
