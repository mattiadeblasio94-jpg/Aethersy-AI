export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { coin = 'bitcoin' } = req.query;

  try {
    const id = coin.toLowerCase().trim();

    // CoinGecko free API
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;

    const r = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      // Try search by symbol
      const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(id)}`;
      const sr = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
      if (sr.ok) {
        const sd = await sr.json();
        const found = sd?.coins?.[0];
        if (found) {
          return res.status(404).json({ error: `Coin "${id}" non trovato. Prova con: ${found.id}` });
        }
      }
      return res.status(404).json({ error: `Coin "${id}" non trovato` });
    }

    const d = await r.json();
    const md = d.market_data;

    const spark = md?.sparkline_7d?.price || [];
    const history = spark.filter((_, i) => i % 24 === 0).map((p, i) => ({
      day: `${7 - i}d fa`,
      price: parseFloat(p.toFixed(2)),
    })).reverse();

    return res.status(200).json({
      id: d.id,
      symbol: d.symbol?.toUpperCase(),
      name: d.name,
      price: md?.current_price?.usd || 0,
      change24h: parseFloat((md?.price_change_percentage_24h || 0).toFixed(2)),
      change7d: parseFloat((md?.price_change_percentage_7d || 0).toFixed(2)),
      change30d: parseFloat((md?.price_change_percentage_30d || 0).toFixed(2)),
      marketCap: md?.market_cap?.usd || 0,
      volume24h: md?.total_volume?.usd || 0,
      high24h: md?.high_24h?.usd || 0,
      low24h: md?.low_24h?.usd || 0,
      ath: md?.ath?.usd || 0,
      rank: d.market_cap_rank || null,
      history,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
