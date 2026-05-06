import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Mail, Loader2, Trash2, Plus, Send } from "lucide-react";
import { toast } from "sonner";

export default function Email() {
  const [list, setList] = useState([]);
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ product: "", audience: "", steps: 5, tone: "friendly-expert" });
  const [loading, setLoading] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => api.get("/email/sequences").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!form.product || !form.audience) { toast.error("Product and audience required"); return; }
    setLoading(true);
    try {
      const r = await api.post("/email/sequences", { ...form, steps: parseInt(form.steps) });
      toast.success("Sequence ready");
      setActive(r.data);
      setShow(false);
      load();
    } catch (e) { toast.error("Generation failed"); } finally { setLoading(false); }
  };

  const remove = async (id) => {
    await api.delete(`/email/sequences/${id}`);
    if (active?.id === id) setActive(null);
    load();
  };

  const sendTest = async () => {
    if (!active || !sendTo) { toast.error("Inserisci un indirizzo destinatario"); return; }
    setSending(true);
    try {
      // First email of the sequence is roughly the first ~80 lines
      const firstBlock = (active.content || "").split(/^##\s+Email\s+2/m)[0] || active.content;
      const subjMatch = (firstBlock.match(/Subject:\s*(.+)/i) || [])[1] || `${active.product} — first email`;
      const bodyHtml = `<div style="font-family:Manrope,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0a0a0a">
        <h2 style="font-family:'Cabinet Grotesk',Arial,sans-serif;color:#00838f">Aethersy AI · ${active.product}</h2>
        <pre style="white-space:pre-wrap;font-family:Manrope,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a">${firstBlock.replace(/[<>]/g, '')}</pre>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#666">Sent via Aethersy AI · powered by Lara</p>
      </div>`;
      await api.post("/email/send", {
        to: sendTo,
        subject: subjMatch.trim().slice(0, 120),
        html: bodyHtml,
        sequence_id: active.id,
      });
      toast.success(`Email inviata a ${sendTo}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invio fallito");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 md:p-8" data-testid="email-page">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="e360-overline text-cyan-400">Email Marketing AI</div>
          <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Sequences that convert.</h1>
          <p className="text-zinc-500 mt-1 text-sm">AI-drafted nurture sequences. Edit, schedule, send.</p>
        </div>
        <button onClick={() => setShow(true)} className="e360-btn-primary inline-flex items-center gap-2" data-testid="email-new-btn">
          <Plus className="w-4 h-4"/> New Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {list.length === 0 && (
            <div className="e360-card p-8 text-center text-zinc-500 text-sm">
              <Mail className="w-8 h-8 mx-auto opacity-40 mb-2" strokeWidth={1}/>
              No sequences yet. Generate your first.
            </div>
          )}
          {list.map((s) => (
            <button key={s.id} onClick={() => setActive(s)}
              className={`w-full text-left e360-card p-4 ${active?.id === s.id ? "border-cyan-400/50" : "e360-card-hover"}`}
              data-testid={`email-seq-${s.id}`}>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">{s.steps} emails · {s.status}</div>
              <div className="font-medium text-sm mt-1 line-clamp-1">{s.product}</div>
              <div className="text-xs text-zinc-500 line-clamp-1">→ {s.audience}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 e360-card p-6 min-h-[400px]" data-testid="email-preview">
          {!active && (
            <div className="text-center py-20 text-zinc-500">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" strokeWidth={1}/>
              Select or generate a sequence to preview.
            </div>
          )}
          {active && (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="e360-overline">Sequence</div>
                  <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>{active.product}</h3>
                  <div className="text-xs text-zinc-500 mt-0.5">{active.audience} · tone: {active.tone}</div>
                </div>
                <button onClick={() => remove(active.id)} className="text-zinc-500 hover:text-red-400" data-testid="email-delete-btn">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
              <div className="flex gap-2 mb-4 p-3 rounded-md bg-cyan-400/[0.04] border border-cyan-400/20">
                <input value={sendTo} onChange={(e)=>setSendTo(e.target.value)} placeholder="destinatario@email.com (test)" className="e360-input flex-1" data-testid="email-sendto-input"/>
                <button onClick={sendTest} disabled={sending} className="e360-btn-primary inline-flex items-center gap-2 text-sm" data-testid="email-send-test-btn">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} Send first email
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-[Manrope] text-sm leading-relaxed text-zinc-200">{active.content}</pre>
            </>
          )}
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShow(false)}/>
          <div className="relative e360-card p-6 w-full max-w-md animate-fade-up">
            <h3 className="text-xl font-bold mb-4" style={{fontFamily:'Cabinet Grotesk'}}>New Email Sequence</h3>
            <div className="space-y-3">
              <div>
                <label className="e360-overline">Product / Offer</label>
                <input className="e360-input w-full mt-1" value={form.product} onChange={(e)=>setForm({...form, product: e.target.value})} placeholder="AI productivity SaaS" data-testid="email-product-input"/>
              </div>
              <div>
                <label className="e360-overline">Audience</label>
                <input className="e360-input w-full mt-1" value={form.audience} onChange={(e)=>setForm({...form, audience: e.target.value})} placeholder="Solo founders, 30-45" data-testid="email-audience-input"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="e360-overline">Steps</label>
                  <input type="number" min={3} max={10} className="e360-input w-full mt-1" value={form.steps} onChange={(e)=>setForm({...form, steps: e.target.value})} data-testid="email-steps-input"/>
                </div>
                <div>
                  <label className="e360-overline">Tone</label>
                  <select className="e360-input w-full mt-1" value={form.tone} onChange={(e)=>setForm({...form, tone: e.target.value})} data-testid="email-tone-select">
                    <option>friendly-expert</option><option>direct</option><option>witty</option><option>luxurious</option>
                  </select>
                </div>
              </div>
              <button onClick={generate} disabled={loading} className="e360-btn-primary w-full inline-flex items-center justify-center gap-2 mt-2" data-testid="email-generate-btn">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Drafting...</> : <>Generate Sequence</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
