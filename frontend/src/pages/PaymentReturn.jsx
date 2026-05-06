import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const sid = params.get("session_id");
  const [state, setState] = useState({ status: "checking", payment_status: "", attempts: 0 });
  const polled = useRef(false);

  useEffect(() => {
    if (polled.current || !sid) return;
    polled.current = true;
    const poll = async (n) => {
      if (n > 8) { setState({ status: "timeout" }); return; }
      try {
        const r = await api.get(`/billing/status/${sid}`);
        setState({ ...r.data, attempts: n });
        if (r.data.payment_status === "paid") {
          // Trigger demo seeding for first paid subscription
          api.post("/onboarding/seed-demo").catch(() => {});
          setTimeout(() => nav("/dashboard"), 2200);
          return;
        }
        if (r.data.status === "expired") return;
        setTimeout(() => poll(n + 1), 2000);
      } catch (e) {
        setTimeout(() => poll(n + 1), 2500);
      }
    };
    poll(0);
  }, [sid, nav]);

  if (!sid) {
    return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-zinc-400">No session ID.</div>;
  }

  const paid = state.payment_status === "paid";
  const expired = state.status === "expired" || state.status === "timeout";

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6" data-testid="payment-return-page">
      <div className="e360-card p-10 max-w-md w-full text-center">
        {paid ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" strokeWidth={1.5}/>
            <h1 className="text-3xl font-bold mb-2" style={{fontFamily:'Cabinet Grotesk'}}>Pagamento riuscito!</h1>
            <p className="text-zinc-400">Piano <strong className="text-cyan-400">{state.tier}</strong> attivato. Ti reindirizzo alla dashboard...</p>
          </>
        ) : expired ? (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" strokeWidth={1.5}/>
            <h1 className="text-3xl font-bold mb-2" style={{fontFamily:'Cabinet Grotesk'}}>Sessione scaduta</h1>
            <p className="text-zinc-400 mb-6">Riprova dal pricing.</p>
            <button onClick={() => nav("/pricing")} className="e360-btn-primary">Torna al pricing</button>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" strokeWidth={1.5}/>
            <h1 className="text-2xl font-bold mb-2" style={{fontFamily:'Cabinet Grotesk'}}>Verifico il pagamento...</h1>
            <p className="text-zinc-500 text-sm">Tentativo {state.attempts + 1}/8</p>
          </>
        )}
      </div>
    </div>
  );
}
