/**
 * Vercel Workflows - Automazioni per processi lunghi
 * Generazione video, email batch, research multi-step
 */

import { workflowStep } from '@vercel/functions';

// Workflow per generazione video con retry e polling
export async function videoGenerationWorkflow({ prompt, model, style }) {
  try {
    // Step 1: Validazione input
    const validated = await workflowStep('validate', async () => {
      if (!prompt || prompt.length < 10) {
        throw new Error('Prompt troppo corto');
      }
      return { prompt, model: model || 'wan', style };
    });

    // Step 2: Chiamata API Replicate
    const prediction = await workflowStep('generate', async () => {
      const replicate = require('replicate');
      const rep = new replicate({ auth: process.env.REPLICATE_API_TOKEN });

      const models = {
        wan: 'wavespeedai/wan-2.1-t2v-480p',
        ltx: 'lightricks/ltx-video',
      };

      return await rep.predictions.create({
        model: models[validated.model],
        input: { prompt: `${validated.prompt}${validated.style ? ', ' + validated.style : ''}` }
      });
    });

    // Step 3: Polling completamento
    const result = await workflowStep('poll', async () => {
      const replicate = require('replicate');
      const rep = new replicate({ auth: process.env.REPLICATE_API_TOKEN });

      let status = prediction.status;
      let attempts = 0;
      const maxAttempts = 60; // 5 minuti con polling ogni 5s

      while (status === 'processing' || status === 'starting') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const updated = await rep.predictions.get(prediction.id);
        status = updated.status;
        attempts++;

        if (attempts >= maxAttempts) {
          throw new Error('Timeout generazione video');
        }
      }

      if (status === 'failed') {
        throw new Error('Generazione fallita');
      }

      return updated.output || updated.video?.url;
    });

    // Step 4: Notifica completamento
    await workflowStep('notify', async () => {
      // Invia notifica Telegram se configurato
      if (process.env.TELEGRAM_BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_ADMIN_ID,
            text: `✅ Video generato!\n\nPrompt: ${validated.prompt.slice(0, 50)}...\nModello: ${validated.model}`,
          }),
        });
      }
    });

    return { success: true, url: result, jobId: prediction.id };

  } catch (error) {
    await workflowStep('error', async () => {
      console.error('[Workflow] Error:', error);
      // Log error e notifica admin
    });

    return { success: false, error: error.message };
  }
}

// Workflow per email batch
export async function emailBatchWorkflow({ recipients, subject, content }) {
  return workflowStep('send-emails', async () => {
    const results = [];

    for (const email of recipients.slice(0, 100)) {
      try {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email, subject, content }),
        });
        results.push({ email, success: res.ok });
      } catch {
        results.push({ email, success: false });
      }
    }

    return { sent: results.filter(r => r.success).length, total: recipients.length };
  });
}

// Workflow per deep research
export async function deepResearchWorkflow({ query, maxPages = 10 }) {
  const results = await workflowStep('research', async () => {
    // Step 1: Search iniziale
    const searchRes = await fetch(`https://api.tavily.com/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: maxPages,
      }),
    });

    const searchData = await searchRes.json();

    // Step 2: Scraping pagine
    const scraped = [];
    for (const result of searchData.results || []) {
      try {
        const content = await fetch(`https://api.openclaw.com/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.url }),
        }).then(r => r.text());

        scraped.push({ url: result.url, content, title: result.title });
      } catch {
        // Skip failed scrapes
      }
    }

    // Step 3: Sintesi AI
    const synthesis = await fetch('/api/ai/vercel-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Sintetizza questa ricerca su "${query}":\n\n${scraped.map(s => `[${s.title}](${s.url}):\n${s.content.slice(0, 500)}`).join('\n\n')}`
        }]
      }),
    }).then(r => r.json());

    return {
      query,
      sources: scraped.length,
      summary: synthesis.reply,
      timestamp: Date.now(),
    };
  });

  return results;
}
