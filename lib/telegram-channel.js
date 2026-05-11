/**
 * Telegram Channel Integration
 * Invia e ricevi messaggi da Telegram
 * Usage: import { sendTelegramMessage, getTelegramUpdates } from '@/lib/telegram-channel'
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
  : null;

/**
 * Invia messaggio Telegram
 * @param {string} chatId - ID chat o username
 * @param {string} text - Testo messaggio
 * @param {object} options - { parseMode, replyMarkup, replyToMessageId }
 */
export async function sendTelegramMessage(chatId, text, options = {}) {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN non configurato');
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const body = {
    chat_id: chatId,
    text: text.slice(0, 4096), // Limite Telegram
    parse_mode: options.parseMode || 'HTML',
    reply_markup: options.replyMarkup,
    reply_to_message_id: options.replyToMessageId
  };

  // Rimuovi campi undefined
  Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result.ok) {
      return {
        success: true,
        messageId: result.result.message_id,
        chatId: result.result.chat.id,
        timestamp: result.result.date
      };
    } else {
      throw new Error(result.description || 'Errore invio Telegram');
    }
  } catch (error) {
    console.error('Telegram send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Invia messaggio con tastiera inline (bottoni)
 */
export async function sendTelegramWithKeyboard(chatId, text, buttons) {
  const keyboard = {
    inline_keyboard: buttons.map(row =>
      row.map(btn => ({
        text: btn.label,
        callback_data: btn.data,
        url: btn.url
      }))
    )
  };

  return sendTelegramMessage(chatId, text, { replyMarkup: keyboard });
}

/**
 * Invia foto su Telegram
 */
export async function sendTelegramPhoto(chatId, photoUrl, caption = '') {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN non configurato');
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption.slice(0, 1024),
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();

    if (result.ok) {
      return {
        success: true,
        messageId: result.result.message_id,
        fileId: result.result.photo?.[0]?.file_id
      };
    } else {
      throw new Error(result.description || 'Errore invio foto');
    }
  } catch (error) {
    console.error('Telegram photo error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Imposta webhook Telegram
 */
export async function setTelegramWebhook(webhookUrl) {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN non configurato');
  }

  const url = webhookUrl || WEBHOOK_URL;
  if (!url) {
    throw new Error('Webhook URL non specificato');
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(url)}&allowed_updates=update_id,message,callback_query`,
      { method: 'GET' }
    );

    const result = await response.json();

    return {
      success: result.ok,
      message: result.description,
      webhookUrl: url
    };
  } catch (error) {
    console.error('Set webhook error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Rimuovi webhook (torna a polling)
 */
export async function deleteTelegramWebhook() {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN non configurato');
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`,
      { method: 'GET' }
    );

    const result = await response.json();
    return { success: result.ok };
  } catch (error) {
    console.error('Delete webhook error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ottieni info bot
 */
export async function getTelegramBotInfo() {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN non configurato');
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getMe`,
      { method: 'GET' }
    );

    const result = await response.json();

    if (result.ok) {
      return {
        id: result.result.id,
        username: result.result.username,
        firstName: result.result.first_name,
        canJoinGroups: result.result.can_join_groups,
        canReadAllGroupMessages: result.result.can_read_all_group_messages
      };
    } else {
      throw new Error(result.description || 'Errore getMe');
    }
  } catch (error) {
    console.error('Get bot info error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Invia notifica broadcast a più utenti
 */
export async function broadcastTelegramMessage(userChatIds, text, options = {}) {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const chatId of userChatIds) {
    try {
      const result = await sendTelegramMessage(chatId, text, options);
      results.push({ chatId, success: result.success });
      if (result.success) successCount++;
      else failCount++;
    } catch (error) {
      results.push({ chatId, success: false, error: error.message });
      failCount++;
    }

    // Delay per evitare rate limiting (30 msg/sec)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return {
    total: userChatIds.length,
    success: successCount,
    failed: failCount,
    results
  };
}

/**
 * Formatta messaggio per Telegram (HTML o Markdown)
 */
export function formatTelegramMessage(text, format = 'html') {
  if (format === 'markdown') {
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // **bold** → *bold*
      .replace(/\*(.*?)\*/g, '_$1_') // *italic* → _italic_
      .replace(/```([\s\S]*?)```/g, '```\n$1\n```') // code blocks
      .replace(/`([^`]+)`/g, '`$1`'); // inline code
  }

  // HTML format (default)
  return text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/**
 * Parse entità Telegram (user mentions, etc.)
 */
export function parseTelegramEntities(text, entities) {
  if (!entities || !Array.isArray(entities)) return text;

  let result = text;
  const sorted = [...entities].sort((a, b) => b.offset - a.offset);

  for (const entity of sorted) {
    const start = entity.offset;
    const end = entity.offset + entity.length;
    const substring = text.slice(start, end);

    let replacement = substring;
    switch (entity.type) {
      case 'bold':
        replacement = `**${substring}**`;
        break;
      case 'italic':
        replacement = `*${substring}*`;
        break;
      case 'code':
        replacement = `\`${substring}\``;
        break;
      case 'pre':
        replacement = `\`\`\`${substring}\`\`\``;
        break;
      case 'text_link':
        replacement = `[${substring}](${entity.url})`;
        break;
      case 'mention':
      case 'text_mention':
        replacement = `[@${substring}](https://t.me/${substring.replace('@', '')})`;
        break;
    }

    result = result.slice(0, start) + replacement + result.slice(end);
  }

  return result;
}
