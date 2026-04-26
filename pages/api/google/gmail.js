import { verifyToken } from '../../../lib/auth';
import { sendGmail, readGmail } from '../../../lib/google-services';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;

  if (!decoded) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  const { action, to, subject, body, html, query, maxResults } = req.body;

  try {
    if (action === 'send') {
      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'to, subject, body richiesti' });
      }

      const result = await sendGmail(decoded.email, to, subject, body, html);
      return res.json({ ok: true, messageId: result.id });
    }

    if (action === 'read') {
      const emails = await readGmail(decoded.email, query || '', maxResults || 10);
      return res.json({ ok: true, emails });
    }

    return res.status(400).json({ error: 'Azione non valida. Usa: send o read' });
  } catch (e) {
    console.error('Gmail API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
