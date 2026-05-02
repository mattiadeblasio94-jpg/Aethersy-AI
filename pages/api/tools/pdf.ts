/**
 * PDF Generation API
 * Genera PDF professionali con template
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePDF, listTemplates } from '../../../lib/pdf-generator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return generateHandler(req, res);
  } else if (req.method === 'GET') {
    return listHandler(req, res);
  }
  res.status(405).json({ error: 'Method not allowed' });
}

async function generateHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { template, data } = req.body;

    if (!template) {
      return res.status(400).json({ error: 'Template ID richiesto' });
    }

    const result = await generatePDF(template, data || {});

    res.status(200).json({
      success: true,
      template: result.template.name,
      html: result.html,
      preview: result.html.slice(0, 500)
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function listHandler(req: NextApiRequest, res: NextApiResponse) {
  const templates = listTemplates();
  res.status(200).json({ templates });
}
