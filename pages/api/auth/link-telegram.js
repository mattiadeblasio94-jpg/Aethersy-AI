/**
 * API per collegare Telegram ID a utente web
 */

import { Redis } from '@upstash/redis';
import { linkTelegramToEmail, unlinkTelegram, getLinkByTelegram, getLinkByEmail } from '../../../lib/auth-sync';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { action, telegramId, email } = req.body;

    if (action === 'link') {
      // Link Telegram ID to email
      if (!telegramId || !email) {
        return res.status(400).json({ error: 'telegramId ed email richiesti' });
      }

      // Check if Telegram already linked
      const existingLink = await getLinkByTelegram(telegramId);
      if (existingLink) {
        return res.status(409).json({
          error: 'Telegram già collegato',
          linkedEmail: existingLink.email
        });
      }

      // Check if email already linked
      const existingEmailLink = await getLinkByEmail(email);
      if (existingEmailLink) {
        return res.status(409).json({
          error: 'Email già collegata',
          linkedTelegram: existingEmailLink.telegramId
        });
      }

      const link = await linkTelegramToEmail(telegramId, email);
      return res.status(200).json({
        success: true,
        message: 'Telegram collegato con successo',
        link
      });

    } else if (action === 'unlink') {
      // Unlink Telegram
      if (!telegramId) {
        return res.status(400).json({ error: 'telegramId richiesto' });
      }

      await unlinkTelegram(telegramId);
      return res.status(200).json({
        success: true,
        message: 'Telegram scollegato'
      });

    } else if (action === 'check') {
      // Check if Telegram is linked
      if (!telegramId) {
        return res.status(400).json({ error: 'telegramId richiesto' });
      }

      const link = await getLinkByTelegram(telegramId);
      const { getUserPlan } = await import('../../../lib/auth-sync');
      const plan = await getUserPlan(telegramId);

      return res.status(200).json({
        linked: !!link,
        email: link?.email,
        plan,
        linkedAt: link?.linkedAt
      });

    } else {
      return res.status(400).json({ error: 'Azione non valida' });
    }

  } catch (e) {
    console.error('Link Telegram error:', e);
    return res.status(500).json({ error: e.message });
  }
}
