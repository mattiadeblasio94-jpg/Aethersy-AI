import Anthropic from '@anthropic-ai/sdk';

export const config = { api: { bodyParser: true, responseLimit: false } };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const PROMPTS = {
  audit: (url) => `You are a world-class SEO expert. Perform a comprehensive SEO audit for: ${url}

Analyze and report on:
## 🔍 Technical SEO
- URL structure, HTTPS, canonicals, redirects
- Core Web Vitals estimates (LCP, FID, CLS)
- Mobile-friendliness assessment
- Structured data recommendations

## 📝 On-Page SEO
- Title tag optimization (character count, keyword placement)
- Meta description effectiveness
- H1-H6 heading structure
- Image alt text, lazy loading
- Internal linking strategy

## 🔑 Keyword Analysis
- Likely target keywords from the URL/domain
- Search intent alignment
- Keyword density recommendations

## 🔗 Off-Page Signals
- Backlink profile recommendations
- Domain authority building strategy
- Social signals

## ⚡ Top 10 Priority Actions
Number each action with estimated impact (High/Medium/Low) and effort level.

## 📊 Overall SEO Score: X/100
Brief verdict and roadmap summary.`,

  keywords: (kw) => `You are a senior SEO strategist. Perform deep keyword research for: "${kw}"

## 🎯 Primary Keyword
- Search intent (informational/navigational/transactional/commercial)
- Estimated monthly volume & difficulty score
- SERP features likely to appear

## 📊 Top 20 Related Keywords
| Keyword | Intent | Est. Volume | Difficulty |
|---------|--------|-------------|------------|
[Complete table with 20 keywords]

## 🗂️ Topic Clusters
Group keywords into 5 clusters with main topic and subtopics.

## ✍️ Content Plan
5 article ideas with:
- Title (H1)
- Target keyword
- Content type
- Word count recommendation

## 🚀 Quick Wins
3 low-competition, high-opportunity keywords to target first.`,

  content: (topic) => `You are an expert SEO content writer. Write a complete, fully SEO-optimized blog article on: "${topic}"

## SEO Metadata
**Title Tag (55-60 chars):** [Write title]
**Meta Description (150-160 chars):** [Write description]
**Target Keyword:** [Main keyword]
**Secondary Keywords:** [3-5 keywords]

---

# [H1: Article Title - include main keyword]

[Engaging intro paragraph with hook, problem statement, and what reader will learn - 100-150 words]

## [H2: Section 1 - include secondary keyword]

[300-400 words of in-depth content]

### [H3: Subsection if needed]

[Content...]

## [H2: Section 2]

[300-400 words]

## [H2: Section 3]

[300-400 words]

## [H2: Frequently Asked Questions]

**Q: [Question 1]?**
A: [Answer]

**Q: [Question 2]?**
A: [Answer]

**Q: [Question 3]?**
A: [Answer]

## Conclusion

[Summary with key takeaways and CTA - 100-150 words]

---
*Internal links to add: [3 suggested internal link anchors]*
*External authority links: [2 suggested high-DA sources to cite]*`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { mode = 'audit', url = '', keyword = '' } = req.body || {};
  const target = mode === 'audit' ? url.trim() : keyword.trim();
  if (!target) return res.status(400).json({ error: 'Input required' });

  const prompt = PROMPTS[mode]?.(target);
  if (!prompt) return res.status(400).json({ error: 'Invalid mode' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ t: event.delta.text })}\n\n`);
      }
    }

    const final = await stream.finalMessage();
    res.write(`data: ${JSON.stringify({ done: true, tokens: final.usage?.output_tokens })}\n\n`);
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
}
