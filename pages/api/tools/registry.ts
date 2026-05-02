/**
 * AI Tools & Templates Registry API
 * Endpoint centralizzato per 80+ tools e 10000+ template
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  AI_TOOLS,
  TOOL_CATEGORIES,
  getToolsByCategory,
  searchTools,
  getToolById,
  getActiveTools,
  getFreeTools,
  getTotalTools
} from '../../../lib/ai-tools-registry';
import {
  ALL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateById,
  getFreeTemplates,
  getPremiumTemplates,
  getTopRatedTemplates,
  getTotalTemplates
} from '../../../lib/templates-registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type, action, category, q, limit } = req.query;

  try {
    // ============================================
    // TOOLS API
    // ============================================
    if (type === 'tools') {
      switch (action) {
        case 'list':
          return listTools(req, res);
        case 'search':
          return searchToolsEndpoint(req, res);
        case 'get':
          return getToolEndpoint(req, res);
        case 'categories':
          return listCategories(req, res, 'tools');
      }
    }

    // ============================================
    // TEMPLATES API
    // ============================================
    if (type === 'templates') {
      switch (action) {
        case 'list':
          return listTemplates(req, res);
        case 'search':
          return searchTemplatesEndpoint(req, res);
        case 'get':
          return getTemplateEndpoint(req, res);
        case 'categories':
          return listCategories(req, res, 'templates');
      }
    }

    // ============================================
    // DEFAULT: Dashboard completa
    // ============================================
    return getDashboard(req, res);

  } catch (error: any) {
    console.error('Registry API error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// TOOLS ENDPOINTS
// ============================================

async function listTools(req: NextApiRequest, res: NextApiResponse) {
  const { category, status, pricing, limit = '50' } = req.query;

  let tools = [...AI_TOOLS];

  // Filtri
  if (category && category !== 'all') {
    tools = tools.filter(t => t.category === category);
  }

  if (status && status !== 'all') {
    tools = tools.filter(t => t.status === status);
  }

  if (pricing && pricing !== 'all') {
    if (pricing === 'free') {
      tools = tools.filter(t => t.pricing.type === 'free');
    } else if (pricing === 'premium') {
      tools = tools.filter(t => t.pricing.type !== 'free');
    }
  }

  // Ordinamento per rating
  tools.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  });

  // Limite
  const limitNum = parseInt(limit as string);
  tools = tools.slice(0, limitNum);

  res.json({
    success: true,
    total: tools.length,
    totalAvailable: getTotalTools(),
    tools
  });
}

async function searchToolsEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" richiesto' });
  }

  const results = searchTools(q);

  res.json({
    success: true,
    query: q,
    found: results.length,
    tools: results
  });
}

async function getToolEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Tool ID richiesto' });
  }

  const tool = getToolById(id as string);

  if (!tool) {
    return res.status(404).json({ error: 'Tool non trovato' });
  }

  res.json({
    success: true,
    tool
  });
}

// ============================================
// TEMPLATES ENDPOINTS
// ============================================

async function listTemplates(req: NextApiRequest, res: NextApiResponse) {
  const { category, type, premium, sort, limit = '50' } = req.query;

  let templates = [...ALL_TEMPLATES];

  // Filtri
  if (category && category !== 'all') {
    templates = templates.filter(t => t.category === category);
  }

  if (type && type !== 'all') {
    templates = templates.filter(t => t.type === type);
  }

  if (premium === 'true') {
    templates = templates.filter(t => t.premium);
  } else if (premium === 'false') {
    templates = templates.filter(t => !t.premium);
  }

  // Ordinamento
  if (sort === 'rating') {
    templates.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'downloads') {
    templates.sort((a, b) => b.downloads - a.downloads);
  } else if (sort === 'newest') {
    templates.sort((a, b) => b.credits - a.credits);
  }

  // Limite
  const limitNum = parseInt(limit as string);
  templates = templates.slice(0, limitNum);

  res.json({
    success: true,
    total: templates.length,
    totalAvailable: getTotalTemplates(),
    templates
  });
}

async function searchTemplatesEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" richiesto' });
  }

  const results = searchTemplates(q);

  res.json({
    success: true,
    query: q,
    found: results.length,
    templates: results
  });
}

async function getTemplateEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Template ID richiesto' });
  }

  const template = getTemplateById(id as string);

  if (!template) {
    return res.status(404).json({ error: 'Template non trovato' });
  }

  res.json({
    success: true,
    template
  });
}

// ============================================
// CATEGORIES ENDPOINTS
// ============================================

async function listCategories(req: NextApiRequest, res: NextApiResponse, type: 'tools' | 'templates') {
  const categories = type === 'tools' ? TOOL_CATEGORIES : TEMPLATE_CATEGORIES;

  res.json({
    success: true,
    type,
    categories
  });
}

// ============================================
// DASHBOARD ENDPOINT
// ============================================

async function getDashboard(req: NextApiRequest, res: NextApiResponse) {
  const activeTools = getActiveTools();
  const freeTools = getFreeTools();
  const topTemplates = getTopRatedTemplates(4.7).slice(0, 10);

  res.json({
    success: true,
    stats: {
      totalTools: getTotalTools(),
      activeTools: activeTools.length,
      freeTools: freeTools.length,
      totalTemplates: getTotalTemplates(),
      categories: {
        tools: TOOL_CATEGORIES.length,
        templates: TEMPLATE_CATEGORIES.length
      }
    },
    featuredTools: activeTools.slice(0, 12),
    topTemplates,
    categories: {
      tools: TOOL_CATEGORIES,
      templates: TEMPLATE_CATEGORIES
    }
  });
}
