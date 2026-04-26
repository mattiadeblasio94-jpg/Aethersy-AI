export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { symbol } = req.query;
  if (!symbol?.trim()) return res.status(400).json({ error: 'Symbol mancante' });

  try {
    const sym = symbol.toUpperCase().trim();

    // Yahoo Finance v8 quote endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) return res.status(404).json({ error: `Symbol "${sym}" non trovato` });

    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return res.status(404).json({ error: 'Dati non disponibili' });

    const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0];
    const timestamps = data?.chart?.result?.[0]?.timestamp || [];
    const closes = quotes?.close || [];

    const history = timestamps.slice(-5).map((ts, i) => ({
      date: new Date(ts * 1000).toLocaleDateString('it-IT'),
      close: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
    })).filter(h => h.close !== null);

    const change = meta.regularMarketChange ?? (meta.regularMarketPrice - meta.previousClose);
    const changePct = meta.regularMarketChangePercent ?? (change / meta.previousClose * 100);

    return res.status(200).json({
      symbol: meta.symbol,
      name: meta.shortName || meta.longName || sym,
      price: parseFloat((meta.regularMarketPrice || 0).toFixed(2)),
      change: parseFloat((change || 0).toFixed(2)),
      changePct: parseFloat((changePct || 0).toFixed(2)),
      open: parseFloat((meta.regularMarketOpen || 0).toFixed(2)),
      high: parseFloat((meta.regularMarketDayHigh || 0).toFixed(2)),
      low: parseFloat((meta.regularMarketDayLow || 0).toFixed(2)),
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap || null,
      currency: meta.currency || 'USD',
      exchange: meta.fullExchangeName || meta.exchangeName || '',
      history,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
