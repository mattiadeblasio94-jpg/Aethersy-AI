import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Check, ArrowRight, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

export default function Pricing() {
  const [tiers, setTiers] = useState([]);
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(null);
  const [cycle, setCycle] = useState("monthly");
  const [params] = useSearchParams();
  const nav = useNavigate();
  const preselect = params.get("tier");

  useEffect(() => {
    Promise.all([
      api.get("/billing/tiers").then((r) => setTiers(r.data)),
      api.get("/billing/me").then((r) => setMe(r.data)),
    ]);
    if (params.get("cycle") === "yearly") setCycle("yearly");
  }, [params]);

  useEffect(() => {
    if (preselect && tiers.length > 0) {
      const t = tiers.find((x) => x.id === preselect);
      if (t) subscribe(preselect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiers]);

  const subscribe = async (tierId) => {
    if (tierId === "enterprise") {
      window.location.href = "mailto:hello@aethersy.ai?subject=Aethersy AI Enterprise";
      return;
    }
    setBusy(tierId);
    try {
      const origin = window.location.origin;
      const r = await api.post("/billing/checkout", { tier: tierId, origin_url: origin, billing_cycle: cycle });
      if (r.data.free) {
        toast.success("Piano Free attivato");
        nav("/dashboard");
      } else if (r.data.url) {
        window.location.href = r.data.url;
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Checkout failed");
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-16 px-6" data-testid="pricing-page">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="e360-overline text-cyan-400 mb-2">Pricing</div>
          <h1 className="text-4xl md:text-5xl font-bold" style={{fontFamily:'Cabinet Grotesk'}}>Scegli il tuo piano</h1>
          {me && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-xs">
              <Crown className="w-3 h-3 text-cyan-400"/> Piano attuale: <strong>{me.label}</strong>
            </div>
          )}
          <div className="inline-flex bg-black/40 border border-white/10 rounded-md p-0.5 mt-6 ml-3">
            <button onClick={() => setCycle("monthly")} className={`text-xs px-4 py-1.5 rounded ${cycle === "monthly" ? "bg-cyan-400 text-black font-semibold" : "text-zinc-400"}`} data-testid="cycle-monthly">Mensile</button>
            <button onClick={() => setCycle("yearly")} className={`text-xs px-4 py-1.5 rounded ${cycle === "yearly" ? "bg-cyan-400 text-black font-semibold" : "text-zinc-400"}`} data-testid="cycle-yearly">Annuale (-20%)</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => {
            const isCurrent = me?.tier === t.id;
            const popular = t.id === "pro";
            const monthlyEq = cycle === "yearly" && t.amount > 0 ? (t.amount_yearly / 12).toFixed(2) : null;
            const displayPrice = cycle === "yearly" ? t.amount_yearly : t.amount;
            return (
              <div key={t.id} className={`e360-card p-6 flex flex-col ${popular ? "border-cyan-400/50 shadow-[0_0_40px_rgba(0,240,255,0.08)] relative" : ""}`} data-testid={`pricing-card-${t.id}`}>
                {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-cyan-400 text-black font-bold px-3 py-1 rounded-full">⭐ Più popolare</div>}
                <h3 className="text-xl font-bold" style={{fontFamily:'Cabinet Grotesk'}}>{t.label}</h3>
                <div className="mt-3 mb-1">
                  <span className="text-4xl font-bold">€{displayPrice}</span>
                  {t.amount > 0 && <span className="text-zinc-500 text-sm">{cycle === "yearly" ? "/anno" : "/mese"}</span>}
                </div>
                {monthlyEq && <div className="text-xs text-emerald-400">≈ €{monthlyEq}/mese · risparmi 20%</div>}
                <button
                  onClick={() => subscribe(t.id)}
                  disabled={busy === t.id || isCurrent}
                  className={`w-full text-sm py-2.5 rounded-md font-semibold transition-all my-4 ${isCurrent ? "bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 cursor-default" : popular ? "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.25)]" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
                  data-testid={`pricing-subscribe-${t.id}`}
                >
                  {isCurrent ? "✓ Attivo" : busy === t.id ? <Loader2 className="w-4 h-4 animate-spin inline"/> : <>Subscribe <ArrowRight className="w-3 h-3 inline ml-1"/></>}
                </button>
                <ul className="space-y-1.5">
                  {(t.features || []).map((f, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5"><Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0"/> {f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8 text-xs text-zinc-500 space-y-3">
          <div>Pagamenti gestiti da Stripe · Cancella in qualsiasi momento dalla dashboard</div>
          {me && me.tier !== "free" && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const r = await api.post("/billing/portal");
                    if (r.data.url) window.location.href = r.data.url;
                  } catch (e) { toast.error("Apertura portal fallita"); }
                }}
                className="text-cyan-400 hover:text-cyan-300 underline"
                data-testid="billing-portal-btn"
              >
                Gestisci pagamenti su Stripe →
              </button>
              <span className="text-zinc-700">·</span>
              <button
                onClick={async () => {
                  if (!window.confirm("Confermi la cancellazione del piano? Tornerai al Free.")) return;
                  try {
                    await api.post("/billing/cancel");
                    toast.success("Sottoscrizione cancellata");
                    nav("/dashboard");
                  } catch (e) { toast.error("Cancellazione fallita"); }
                }}
                className="text-red-400 hover:text-red-300"
                data-testid="billing-cancel-btn"
              >
                Cancella piano
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
