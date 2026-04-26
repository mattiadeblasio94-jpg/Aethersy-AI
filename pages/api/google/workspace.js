import { verifyToken } from '../../../lib/auth';
import { writeSheet, readSheet, createDoc, readDoc } from '../../../lib/google-services';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;

  if (!decoded) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  const { action, spreadsheetId, range, values, documentId, title, content } = req.body;

  try {
    if (action === 'sheet:write') {
      if (!spreadsheetId || !range || !values) {
        return res.status(400).json({ error: 'spreadsheetId, range, values richiesti' });
      }
      const result = await writeSheet(decoded.email, spreadsheetId, range, values);
      return res.json({ ok: true, updated: result });
    }

    if (action === 'sheet:read') {
      if (!spreadsheetId || !range) {
        return res.status(400).json({ error: 'spreadsheetId, range richiesti' });
      }
      const data = await readSheet(decoded.email, spreadsheetId, range);
      return res.json({ ok: true, data });
    }

    if (action === 'doc:create') {
      if (!title) {
        return res.status(400).json({ error: 'title richiesto' });
      }
      const result = await createDoc(decoded.email, title, content);
      return res.json({ ok: true, documentId: result.documentId, url: result.documentUrl });
    }

    if (action === 'doc:read') {
      if (!documentId) {
        return res.status(400).json({ error: 'documentId richiesto' });
      }
      const doc = await readDoc(decoded.email, documentId);
      return res.json({ ok: true, title: doc.title, content: doc.body?.content });
    }

    return res.status(400).json({ error: 'Azione non valida' });
  } catch (e) {
    console.error('Google API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
