import { sendEmail } from '../../../lib/email';
import { emailAgent } from '../../../lib/agents';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, subject, body, generateWithAI, purpose, tone, recipient, context } = req.body || {};

    if (generateWithAI) {
      const { purpose: p, recipient: r, tone: t = 'professionale', context: c = '' } = req.body;
      if (!p) return res.status(400).json({ error: 'Scopo email richiesto per generazione AI' });
      try {
        const content = await emailAgent('compose', { purpose: p, recipient: r, tone: t, context: c });
        return res.status(200).json({ ok: true, content });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject e body sono richiesti' });
    }

    try {
      const result = await sendEmail({ to, subject, html: body.includes('<') ? body : `<p style="white-space:pre-wrap">${body}</p>` });
      return res.status(200).json({ ok: true, id: result.id });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET' && req.query.action === 'sequence') {
    const { niche, goal, emails = 5 } = req.query;
    if (!niche || !goal) return res.status(400).json({ error: 'niche e goal richiesti' });
    try {
      const sequence = await emailAgent('sequence', { niche, goal, emails: parseInt(emails) });
      return res.status(200).json({ ok: true, sequence });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}
