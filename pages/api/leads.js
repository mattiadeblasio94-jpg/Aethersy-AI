import { captureLead, getAllLeads, markLeadContacted, markLeadConverted } from '../../lib/leads';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, phone, source = 'web', telegramId, plan } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Nome ed email sono richiesti' });
    try {
      const lead = await captureLead({ name, email, phone, source, telegramId, plan });
      return res.status(200).json({ ok: true, lead });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const leads = await getAllLeads();
      return res.status(200).json({ leads });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'PATCH') {
    const { id, action, plan } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID richiesto' });
    try {
      let lead;
      if (action === 'contacted') lead = await markLeadContacted(id);
      else if (action === 'converted') lead = await markLeadConverted(id, plan || 'pro');
      else return res.status(400).json({ error: 'Azione non valida' });
      return res.status(200).json({ ok: true, lead });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}
