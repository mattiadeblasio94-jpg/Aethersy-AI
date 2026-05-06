import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Search, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Research() {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);

  const load = () => api.get("/research").then((r) => setHistory(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const run = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResult("");
    try {
      const r = await api.post("/research", { query, depth });
      setResult(r.data.result);
      load();
    } catch (e) { toast.error("Research failed"); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 md:p-8" data-testid="research-page">
      <div className="mb-6">
        <div className="e360-overline text-cyan-400">AI Web Research</div>
        <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Synthesize, instantly.</h1>
        <p className="text-zinc-500 mt-1 text-sm">Decision-ready briefs powered by Claude Sonnet 4.5.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={run} className="lg:col-span-2 e360-card p-6 space-y-4 h-fit">
          <div>
            <label className="e360-overline">Topic / Question</label>
            <textarea
              data-testid="research-query-input"
              className="e360-input w-full mt-2 min-h-[120px] resize-y"
              placeholder="e.g. Competitive landscape for AI-powered note-taking apps in 2026..."
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="e360-overline">Depth</label>
            <div className="flex gap-2 mt-2">
              {["quick", "standard", "deep"].map((d) => (
                <button type="button" key={d}
                  onClick={() => setDepth(d)}
                  data-testid={`depth-${d}`}
                  className={`flex-1 capitalize text-sm py-2 rounded-md border transition-all ${depth === d ? "bg-cyan-400 text-black border-cyan-400 font-semibold" : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"}`}
                >{d}</button>
              ))}
            </div>
          </div>
          <button disabled={loading} className="e360-btn-primary w-full inline-flex items-center justify-center gap-2" data-testid="research-run-btn">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Synthesizing...</> : <><Search className="w-4 h-4"/>Run Research</>}
          </button>
          <div className="text-xs text-zinc-600 leading-relaxed pt-2 border-t border-white/[0.06]">
            <Sparkles className="w-3 h-3 inline mr-1 text-cyan-400" />
            Tip: ask focused questions for sharper synthesis.
          </div>
        </form>

        <div className="lg:col-span-3 e360-card p-6 min-h-[400px]" data-testid="research-result">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-white/5 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-5/6" />
              <div className="h-3 bg-white/5 rounded w-4/6" />
              <div className="h-3 bg-white/5 rounded w-full" />
            </div>
          )}
          {!loading && !result && (
            <div className="text-center py-20 text-zinc-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" strokeWidth={1}/>
              Run a query to see your research brief here.
            </div>
          )}
          {!loading && result && (
            <pre className="whitespace-pre-wrap font-[Manrope] text-sm leading-relaxed text-zinc-200">{result}</pre>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <div className="e360-overline mb-3">Recent Briefs</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {history.slice(0, 6).map((h) => (
              <button key={h.id} onClick={() => { setQuery(h.query); setResult(h.result); }} className="e360-card e360-card-hover p-4 text-left">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">{h.depth}</div>
                <div className="text-sm font-medium mt-1 line-clamp-2">{h.query}</div>
                <div className="text-xs text-zinc-500 mt-2">{new Date(h.created_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
