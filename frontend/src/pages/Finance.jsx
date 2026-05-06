import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";

export default function Finance() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [chart, setChart] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/finance/markets");
      setCoins(r.data);
      if (!selected && r.data[0]) loadChart(r.data[0].id);
    } finally { setLoading(false); }
  };

  const loadChart = async (id) => {
    setSelected(id);
    const r = await api.get(`/finance/coin/${id}?days=7`);
    const series = (r.data.prices || []).map(([t, v]) => ({ t, v }));
    setChart(series);
  };

  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, []);

  const sel = coins.find((c) => c.id === selected);

  return (
    <div className="p-6 md:p-8" data-testid="finance-page">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="e360-overline text-cyan-400">Crypto Tracker</div>
          <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Live Markets</h1>
          <p className="text-zinc-500 mt-1 text-sm">Real-time data from CoinGecko · Auto-refresh every 60s.</p>
        </div>
        <button onClick={load} className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-2" data-testid="finance-refresh-btn">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}/> Refresh
        </button>
      </div>

      {sel && (
        <div className="e360-card p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <img src={sel.image} alt={sel.name} className="w-12 h-12"/>
            <div>
              <div className="text-2xl font-bold" style={{fontFamily:'Cabinet Grotesk'}}>{sel.name} <span className="text-zinc-500 text-base">{sel.symbol}</span></div>
              <div className="text-3xl font-bold mt-1">${sel.price?.toLocaleString()}</div>
            </div>
            <div className={`ml-auto inline-flex items-center gap-1 text-sm font-semibold ${sel.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {sel.change24h >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
              {sel.change24h?.toFixed(2)}% (24h)
            </div>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="cyangrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, "Price"]}
                />
                <Area dataKey="v" type="monotone" stroke="#00f0ff" strokeWidth={2} fill="url(#cyangrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && coins.length === 0 && (
          <div className="col-span-full flex items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2"/> Loading markets...
          </div>
        )}
        {coins.map((c) => (
          <button key={c.id} onClick={() => loadChart(c.id)}
            className={`e360-card e360-card-hover p-4 text-left ${selected === c.id ? "border-cyan-400/50" : ""}`}
            data-testid={`coin-card-${c.symbol}`}>
            <div className="flex items-center gap-3">
              <img src={c.image} alt={c.name} className="w-8 h-8"/>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.symbol}</div>
                <div className="text-xs text-zinc-500 truncate">{c.name}</div>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-lg font-bold">${c.price?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                <div className={`text-xs ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {c.change24h >= 0 ? "+" : ""}{c.change24h?.toFixed(2)}%
                </div>
              </div>
              <div className="w-20 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(c.sparkline || []).map((v, i) => ({ i, v }))}>
                    <Line type="monotone" dataKey="v" stroke={c.change24h >= 0 ? "#00ffa3" : "#ff3b30"} strokeWidth={1.5} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
