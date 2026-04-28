import { load } from 'cheerio';
// OPEN SOURCE ONLY - No Anthropic
import { cacheResearch, getCachedResearch } from './memory';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
// Usa Ollama invece

function isAbsoluteUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

async function safeFetch(url, options = {}, ms = 8000) {
  if (!isAbsoluteUrl(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, ...options.headers },
      signal: AbortSignal.timeout(ms),
      ...options,
    });
    return res.ok ? res : null;
  } catch { return null; }
}

// ── Tavily ────────────────────────────────────────────────────────────────────

async function searchTavily(query, deep = false) {
  if (!process.env.TAVILY_API_KEY) return [];
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: deep ? 'advanced' : 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: deep ? 8 : 5,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data.results || [])
      .filter(r => isAbsoluteUrl(r.url))
      .map(r => ({ title: r.title, snippet: r.content?.slice(0, 300), url: r.url, score: r.score, source: 'Tavily' }));
    if (data.answer) results.unshift({ title: 'Risposta AI', snippet: data.answer, url: '', source: 'Tavily:AI' });
    return results;
  } catch { return []; }
}

// ── Serper (Google) ───────────────────────────────────────────────────────────

async function searchSerper(query) {
  if (!process.env.SERPER_API_KEY) return [];
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 10, hl: 'it', gl: 'it' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = [];
    if (data.answerBox?.answer) results.push({ title: 'Google Answer', snippet: data.answerBox.answer, url: data.answerBox.link || '', source: 'Google' });
    if (data.knowledgeGraph?.description) results.push({ title: data.knowledgeGraph.title, snippet: data.knowledgeGraph.description, url: data.knowledgeGraph.website || '', source: 'Google:KG' });
    (data.organic || []).filter(r => isAbsoluteUrl(r.link)).forEach(r =>
      results.push({ title: r.title, snippet: r.snippet, url: r.link, source: 'Google' })
    );
    return results;
  } catch { return []; }
}

// ── Wikipedia ─────────────────────────────────────────────────────────────────

async function searchWikipedia(query) {
  for (const lang of ['it', 'en']) {
    const res = await safeFetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    if (!res) continue;
    const d = await res.json().catch(() => null);
    if (!d?.extract) continue;
    return [{ title: d.title, snippet: d.extract, url: d.content_urls?.desktop?.page, source: 'Wikipedia' }];
  }
  return [];
}

// ── ArXiv ─────────────────────────────────────────────────────────────────────

async function searchArxiv(query) {
  const res = await safeFetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=6&sortBy=relevance`);
  if (!res) return [];
  const xml = await res.text().catch(() => '');
  return (xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []).slice(0, 5).map(e => {
    const title = e.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim().replace(/\s+/g, ' ') || '';
    const summary = e.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim().slice(0, 300).replace(/\s+/g, ' ') || '';
    const id = e.match(/<id>(https?:\/\/[^<]+)<\/id>/)?.[1]?.trim() || '';
    return title && id ? { title, snippet: summary, url: id, source: 'ArXiv' } : null;
  }).filter(Boolean);
}

// ── PubMed ────────────────────────────────────────────────────────────────────

async function searchPubMed(query) {
  try {
    const searchRes = await safeFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&format=json`);
    if (!searchRes) return [];
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    if (!ids.length) return [];
    const summaryRes = await safeFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&format=json`);
    if (!summaryRes) return [];
    const summaryData = await summaryRes.json();
    return ids.map(id => {
      const art = summaryData.result?.[id];
      if (!art?.title) return null;
      return {
        title: art.title,
        snippet: `${(art.authors || []).slice(0, 3).map(a => a.name).join(', ')} | ${art.source} ${art.pubdate}`,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        source: 'PubMed',
      };
    }).filter(Boolean);
  } catch { return []; }
}

// ── GitHub ────────────────────────────────────────────────────────────────────

export async function searchGitHub(query) {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  const res = await safeFetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=8`, { headers });
  if (!res) return [];
  const data = await res.json().catch(() => ({}));
  return (data.items || []).map(r => ({
    title: r.full_name, snippet: r.description || '',
    url: r.html_url, stars: r.stargazers_count, source: 'GitHub',
  }));
}

// ── Reddit ────────────────────────────────────────────────────────────────────

async function searchReddit(query) {
  const res = await safeFetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=5&t=year`);
  if (!res) return [];
  const data = await res.json().catch(() => ({}));
  return (data.data?.children || [])
    .filter(c => c.data?.permalink)
    .map(c => ({
      title: c.data.title,
      snippet: `r/${c.data.subreddit} | ⬆${c.data.score} | 💬${c.data.num_comments}`,
      url: `https://www.reddit.com${c.data.permalink}`,
      source: 'Reddit',
    }));
}

// ── DuckDuckGo (free fallback, no key needed) ─────────────────────────────────

async function searchDuckDuckGo(query) {
  try {
    const res = await safeFetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (!res) return [];
    const data = await res.json().catch(() => null);
    if (!data) return [];
    const results = [];
    if (data.AbstractText) results.push({ title: data.Heading || query, snippet: data.AbstractText.slice(0, 400), url: data.AbstractURL || '', source: 'DuckDuckGo' });
    (data.RelatedTopics || []).slice(0, 5).forEach(t => {
      if (t.Text && isAbsoluteUrl(t.FirstURL)) {
        results.push({ title: t.Text.slice(0, 60), snippet: t.Text.slice(0, 200), url: t.FirstURL, source: 'DuckDuckGo' });
      }
    });
    return results;
  } catch { return []; }
}

// ── HackerNews ────────────────────────────────────────────────────────────────

async function searchHackerNews(query) {
  const res = await safeFetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=5`);
  if (!res) return [];
  const data = await res.json().catch(() => ({}));
  return (data.hits || []).map(h => ({
    title: h.title || '',
    snippet: `⬆${h.points} | 💬${h.num_comments}`,
    url: isAbsoluteUrl(h.url) ? h.url : `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: 'HackerNews',
  }));
}

// ── Stack Overflow ────────────────────────────────────────────────────────────

async function searchStackOverflow(query) {
  const res = await safeFetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=5`);
  if (!res) return [];
  const data = await res.json().catch(() => ({}));
  return (data.items || []).filter(i => isAbsoluteUrl(i.link)).map(i => ({
    title: i.title,
    snippet: `✅ ${i.answer_count} risposte | 👁 ${i.view_count} views`,
    url: i.link, source: 'StackOverflow',
  }));
}

// ── Finance & Crypto ──────────────────────────────────────────────────────────

export async function getFinanceData(symbol) {
  const res = await safeFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`);
  if (!res) return null;
  const data = await res.json().catch(() => null);
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    symbol: meta.symbol, price: meta.regularMarketPrice,
    change: meta.regularMarketChangePercent?.toFixed(2),
    high: meta.regularMarketDayHigh, low: meta.regularMarketDayLow,
    currency: meta.currency, exchange: meta.exchangeName,
  };
}

export async function getCryptoPrice(coin = 'bitcoin') {
  const res = await safeFetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=usd,eur&include_24hr_change=true`);
  if (!res) return null;
  const data = await res.json().catch(() => null);
  return data?.[coin] || null;
}

// ── Scrape ────────────────────────────────────────────────────────────────────

export async function scrapeUrl(url) {
  if (!isAbsoluteUrl(url)) return { error: 'URL non valido', url, ok: false };
  try {
    const res = await safeFetch(url, {}, 12000);
    if (!res) return { error: 'Non raggiungibile', url, ok: false };
    const html = await res.text();
    const $ = load(html);
    $('script, style, nav, footer, header, aside, iframe').remove();
    const title = $('title').text().trim();
    const text = $('main, article, [role="main"], .content, body')
      .first().text().replace(/\s+/g, ' ').trim().slice(0, 6000);
    return { title, text, url, ok: true };
  } catch (e) {
    return { error: e.message, url, ok: false };
  }
}

// ── Ollama synthesis (OPEN SOURCE) ────────────────────────────────────────────

async function synthesize(query, results, deep = false) {
  const context = results
    .filter(r => r.snippet)
    .slice(0, 12)
    .map((r, i) => `[${i + 1}] (${r.source}) ${r.title}\n${r.snippet}`)
    .join('\n\n');

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';

  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `Query: "${query}"\n\nFonti:\n${context}`,
        system: `Sei un ricercatore AI di livello mondiale. Sintetizza i dati e fornisci:
- Risposta PRECISA e FATTUALE con dati numerici concreti
- Citazioni delle fonti con [1], [2] ecc.
- Distinzione tra fatti verificati e stime
- Conclusioni actionable
Rispondi SEMPRE in italiano. Solo dai dati forniti — zero invenzioni.`,
        stream: false,
        options: { temperature: 0.3, num_predict: deep ? 2500 : 1500 }
      })
    });

    if (!res.ok) return 'Sintesi non disponibile';
    const data = await res.json();
    return data.response || '';
  } catch (e) {
    console.log('Ollama error:', e.message);
    return 'Sintesi non disponibile';
  }
}

// ── Main research ─────────────────────────────────────────────────────────────

export async function research(query, { useCache = true, sources = ['all'], deep = false } = {}) {
  if (useCache) {
    const cached = await getCachedResearch(query).catch(() => null);
    if (cached) return { ...cached, fromCache: true };
  }

  const all = sources.includes('all');
  const [tavily, serper, wiki, reddit, hn, ddg] = await Promise.all([
    all || sources.includes('tavily')  ? searchTavily(query, deep)  : [],
    all || sources.includes('google')  ? searchSerper(query)         : [],
    all || sources.includes('wiki')    ? searchWikipedia(query)      : [],
    all || sources.includes('reddit')  ? searchReddit(query)         : [],
    all || sources.includes('hn')      ? searchHackerNews(query)     : [],
    all || sources.includes('ddg')     ? searchDuckDuckGo(query)     : [],
  ]);

  const seen = new Set();
  const results = [...tavily, ...serper, ...wiki, ...reddit, ...hn, ...ddg].filter(r => {
    if (!r?.title) return false;
    const key = r.url || r.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const summary = await synthesize(query, results, deep);
  const output = { summary, results: results.slice(0, 10), fromCache: false };
  await cacheResearch(query, output).catch(() => {});
  return output;
}

export async function deepResearch(query) {
  const { results, summary } = await research(query, { useCache: false, sources: ['all'], deep: true });

  const topUrls = results.filter(r => isAbsoluteUrl(r.url)).slice(0, 3).map(r => r.url);
  const [scraped, arxiv, pubmed] = await Promise.all([
    Promise.all(topUrls.map(scrapeUrl)),
    searchArxiv(query),
    searchPubMed(query),
  ]);

  const extra = [
    ...arxiv.map(r => `[ArXiv] ${r.title}: ${r.snippet}`),
    ...pubmed.map(r => `[PubMed] ${r.title}: ${r.snippet}`),
    ...scraped.filter(s => s.ok).map(s => `[Web] ${s.title}: ${s.text?.slice(0, 800)}`),
  ].join('\n\n');

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';

  let deepRes = '';
  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `Query: "${query}"\n\nPrima sintesi:\n${summary}\n\nDati extra:\n${extra}`,
        system: `Analista senior. Fornisci analisi DEFINITIVA con fatti verificati, dati quantitativi, trend e conclusioni concrete. Italiano, markdown chiaro.`,
        stream: false,
        options: { temperature: 0.3, num_predict: 3000 }
      })
    });

    if (res.ok) {
      const data = await res.json();
      deepRes = data.response || '';
    }
  } catch (e) {
    console.log('Ollama error:', e.message);
    deepRes = summary;
  }

  return { summary: deepRes, results, academic: [...arxiv, ...pubmed] };
}
