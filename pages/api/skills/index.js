/**
 * SKILLS API - Elenca ed esegue competenze
 */

import { listSkills, getSkillDetails, executeSkill } from '../../../lib/skills-registry';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Lista tutte le skills o per categoria
    const { category } = req.query;
    const skills = listSkills(category);
    return res.json({ success: true, skills });
  }

  if (req.method === 'POST') {
    // Esegui una skill
    const { skillId, params, context } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: 'skillId richiesto' });
    }

    try {
      const result = await executeSkill(skillId, params || {}, context || {});
      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}
