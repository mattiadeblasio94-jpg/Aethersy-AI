import React, { useState } from "react";
import { api } from "../lib/api";
import { Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function BusinessPlan() {
  const [idea, setIdea] = useState("");
  const [market, setMarket] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [active, setActive] = useState(null);

  const generate = async () => {
    if (!idea.trim()) { toast.error("Enter your idea first"); return; }
    setLoading(true); setPlan(null);
    try {
      const r = await api.post("/business-plan", { idea, target_market: market, tone });
      setPlan(r.data);
      setActive(Object.keys(r.data.sections)[0]);
      toast.success("Business plan ready");
    } catch (e) { toast.error("Generation failed"); } finally { setLoading(false); }
  };

  const exportPdf = async () => {
    if (!plan) return;
    try {
      const r = await api.get(`/business-plan/${plan.id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = `aethersy-business-plan-${plan.id.slice(0,8)}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error("PDF export failed");
    }
  };

  const exportText = () => {
    if (!plan) return;
    const content = Object.entries(plan.sections)
      .map(([k, v]) => `# ${plan.titles[k]}\n\n${v}\n\n`).join("");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `business-plan-${plan.id.slice(0,8)}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8" data-testid="business-plan-page">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="e360-overline text-cyan-400">AI Business Plan</div>
          <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>From idea to investable plan.</h1>
          <p className="text-zinc-500 mt-1 text-sm">Ten polished sections, generated end-to-end.</p>
        </div>
        {plan && (
          <div className="flex gap-2">
            <button onClick={exportPdf} className="e360-btn-primary inline-flex items-center gap-2" data-testid="bp-export-pdf-btn">
              <Download className="w-4 h-4"/> Download PDF
            </button>
            <button onClick={exportText} className="text-sm border border-white/10 text-zinc-300 px-4 py-2 rounded-md hover:bg-white/5 transition-all inline-flex items-center gap-2" data-testid="bp-export-md-btn">
              <Download className="w-4 h-4"/> Markdown
            </button>
          </div>
        )}
      </div>

      {!plan && (
        <div className="e360-card p-6 max-w-3xl space-y-4">
          <div>
            <label className="e360-overline">Your Idea</label>
            <textarea data-testid="bp-idea-input" className="e360-input w-full mt-2 min-h-[100px]" value={idea} onChange={(e)=>setIdea(e.target.value)} placeholder="A SaaS that helps freelance designers automate client onboarding..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="e360-overline">Target Market</label>
              <input data-testid="bp-market-input" className="e360-input w-full mt-2" value={market} onChange={(e)=>setMarket(e.target.value)} placeholder="Independent designers, $500-$5k projects" />
            </div>
            <div>
              <label className="e360-overline">Tone</label>
              <select className="e360-input w-full mt-2" value={tone} onChange={(e)=>setTone(e.target.value)} data-testid="bp-tone-select">
                <option value="professional">Professional</option>
                <option value="bold">Bold & visionary</option>
                <option value="data-driven">Data-driven</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="e360-btn-primary inline-flex items-center gap-2" data-testid="bp-generate-btn">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Generating 10 sections...</> : <><FileText className="w-4 h-4"/>Generate Business Plan</>}
          </button>
        </div>
      )}

      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="e360-card p-3 h-fit lg:sticky lg:top-20">
            {Object.entries(plan.titles).map(([k, t]) => (
              <button key={k} data-testid={`bp-section-${k}`}
                onClick={() => setActive(k)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm mb-0.5 transition-all ${active === k ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"}`}
              >{t}</button>
            ))}
            <button onClick={() => setPlan(null)} className="w-full mt-2 text-xs text-zinc-500 py-2 hover:text-white">+ New plan</button>
          </aside>
          <article className="lg:col-span-3 e360-card p-8" data-testid="bp-content">
            <h2 className="text-2xl font-bold mb-4" style={{fontFamily:'Cabinet Grotesk'}}>{plan.titles[active]}</h2>
            <pre className="whitespace-pre-wrap font-[Manrope] text-sm leading-relaxed text-zinc-200">{plan.sections[active]}</pre>
          </article>
        </div>
      )}
    </div>
  );
}
