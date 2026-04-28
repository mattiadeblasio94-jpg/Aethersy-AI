// OPEN SOURCE ONLY - No Anthropic

// Helper function per Ollama (open source)
async function ollamaGenerate({ prompt, system = "", model = "llama3.1:8b", options = {} }) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, system, stream: false, options: { temperature: 0.7, num_predict: 2048, ...options } })
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return { content: [{ text: data.response || "" }] };
  } catch (e) {
    console.log("Ollama error:", e.message);
    return { content: [{ text: "AI non disponibile" }] };
  }
}

import { getAllPages, getWikiStats, savePage, addLogEntry } from '../../../lib/wiki';

// Usa Ollama invece

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allPages = await getAllPages();
  if (allPages.length < 2) return res.json({ issues: [], fixed: 0, report: 'Wiki troppo piccola per il lint.' });

  const stats = await getWikiStats();

  // Find structural issues without AI
  const issues = [];

  // Orphan pages
  const linkedIds = new Set(allPages.flatMap(p => p.links || []));
  const orphans = allPages.filter(p => !linkedIds.has(p.id) && (p.links || []).length === 0);
  orphans.forEach(p => issues.push({ type: 'orphan', pageId: p.id, title: p.title, message: 'Nessun collegamento in entrata o uscita' }));

  // Pages with no tags
  allPages.filter(p => !p.tags?.length).forEach(p =>
    issues.push({ type: 'no-tags', pageId: p.id, title: p.title, message: 'Nessun tag assegnato' })
  );

  // Very short pages (< 30 words)
  allPages.filter(p => (p.wordCount || 0) < 30 && p.type !== 'query').forEach(p =>
    issues.push({ type: 'stub', pageId: p.id, title: p.title, message: `Pagina stub (${p.wordCount || 0} parole)` })
  );

  // Broken [[refs]] — referenced page doesn't exist
  for (const page of allPages) {
    for (const ref of (page.related || [])) {
      const refTitle = ref.replace(/\[\[|\]\]/g, '').trim();
      const exists = allPages.some(p => p.title.toLowerCase() === refTitle.toLowerCase());
      if (!exists) {
        issues.push({ type: 'broken-ref', pageId: page.id, title: page.title, message: `Riferimento rotto: [[${refTitle}]]` });
      }
    }
  }

  // AI analysis for deeper issues
  const pagesSample = allPages.slice(0, 20)
    .map(p => `[${p.type}] ${p.title}: ${p.content?.slice(0, 150)}`)
    .join('\n');

  const aiRes = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `Sei un editor di wiki. Analizza le pagine e identifica: contraddizioni, duplicati concettuali, lacune tematiche importanti, concetti menzionati ma non ancora come pagine proprie. Sii conciso. Rispondi in JSON.`,
    messages: [{
      role: 'user',
      content: `PAGINE WIKI (${allPages.length} totali):\n${pagesSample}\n\nStats: ${JSON.stringify(stats)}\n\nRispondi con:\n{"aiIssues": [{"type": "...", "message": "...", "suggestion": "..."}], "missingPages": ["titolo1", "titolo2"], "summary": "..."}`
    }],
  });

  let aiAnalysis = { aiIssues: [], missingPages: [], summary: '' };
  try {
    const match = aiRes.content[0].text.match(/\{[\s\S]*\}/);
    if (match) aiAnalysis = JSON.parse(match[0]);
  } catch {}

  const allIssues = [
    ...issues,
    ...(aiAnalysis.aiIssues || []).map(i => ({ ...i, pageId: null })),
  ];

  await addLogEntry({
    type: 'lint',
    title: 'Lint wiki',
    summary: `${allIssues.length} problemi trovati. ${aiAnalysis.summary || ''}`,
    pagesAffected: [...new Set(issues.map(i => i.pageId).filter(Boolean))],
  });

  res.json({
    issues: allIssues,
    missingPages: aiAnalysis.missingPages || [],
    stats,
    summary: aiAnalysis.summary || `Trovati ${allIssues.length} problemi nella wiki.`,
  });
}
