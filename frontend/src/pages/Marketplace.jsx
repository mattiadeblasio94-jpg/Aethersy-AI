import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Plus, Search, Sparkles, Edit2, Trash2, Download, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

export default function Marketplace() {
  const [cats, setCats] = useState([]);
  const [agents, setAgents] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [q, setQ] = useState("");
  const [mine, setMine] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const empty = { name: "", description: "", category: "ai_agents", system_prompt: "", is_public: true, tags: [] };
  const [form, setForm] = useState(empty);
  const [reviewing, setReviewing] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const submitReview = async () => {
    if (!reviewing) return;
    try {
      await api.post(`/agents/${reviewing.id}/reviews`, { rating: reviewRating, text: reviewText });
      toast.success("Recensione salvata");
      setReviewing(null); setReviewText(""); setReviewRating(5);
      loadAgents();
    } catch (e) { toast.error("Errore"); }
  };

  const loadCats = () => api.get("/agents/categories").then((r) => setCats(r.data));
  const loadAgents = () => {
    const params = {};
    if (activeCat) params.category = activeCat;
    if (q) params.q = q;
    if (mine) params.mine = true;
    api.get("/agents", { params }).then((r) => setAgents(r.data));
  };

  useEffect(() => { loadCats(); }, []);
  useEffect(() => { loadAgents(); }, [activeCat, mine]);

  const save = async () => {
    if (!form.name || !form.system_prompt) { toast.error("Nome e system prompt sono obbligatori"); return; }
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/agents/${editing}`, form);
        toast.success("Agente aggiornato");
      } else {
        await api.post("/agents", form);
        toast.success("Agente pubblicato");
      }
      setShowForm(false); setEditing(null); setForm(empty);
      loadAgents();
    } catch (e) { toast.error(e?.response?.data?.detail || "Errore"); } finally { setBusy(false); }
  };

  const editAgent = (a) => {
    setEditing(a.id);
    setForm({
      name: a.name, description: a.description || "", category: a.category,
      system_prompt: a.system_prompt, is_public: a.is_public, tags: a.tags || [],
    });
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!window.confirm("Eliminare questo agente?")) return;
    await api.delete(`/agents/${id}`);
    toast.success("Eliminato");
    loadAgents();
  };

  const install = async (a) => {
    try {
      const r = await api.post(`/agents/${a.id}/install`);
      if (r.data.requires_payment) {
        toast.info(`Agente Premium €${r.data.price} — ti redirigo al checkout`);
        window.location.href = r.data.checkout_url;
        return;
      }
      toast.success(`${a.name} installato`);
      nav(`/chat`);
    } catch (e) { toast.error("Install fallito"); }
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/agents/import-csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Importati ${r.data.created} agenti`);
      if (r.data.errors?.length) toast.warning(`${r.data.errors.length} errori`);
      loadAgents();
    } catch (err) { toast.error("Import fallito"); } finally { e.target.value = ""; }
  };

  const catIcon = (id) => cats.find((c) => c.id === id)?.icon || "🤖";
  const catLabel = (id) => cats.find((c) => c.id === id)?.label || id;

  return (
    <div className="p-6 md:p-8" data-testid="marketplace-page">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="e360-overline text-cyan-400">Marketplace</div>
          <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Agenti AI ready-to-use.</h1>
          <p className="text-zinc-500 mt-1 text-sm">Esplora, installa e crea agenti specialistici. 25 categorie verticali.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-black/40 border border-white/10 rounded-md p-0.5">
            <button onClick={() => setMine(false)} className={`text-xs px-3 py-1.5 rounded ${!mine ? "bg-cyan-400 text-black font-semibold" : "text-zinc-400"}`} data-testid="mp-tab-discover">Discover</button>
            <button onClick={() => setMine(true)} className={`text-xs px-3 py-1.5 rounded ${mine ? "bg-cyan-400 text-black font-semibold" : "text-zinc-400"}`} data-testid="mp-tab-mine">My agents</button>
          </div>
          <label className="text-xs border border-white/10 text-zinc-300 px-3 py-1.5 rounded-md hover:bg-white/5 cursor-pointer" data-testid="mp-import-csv-btn">
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={importCsv}/>
          </label>
          <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }} className="e360-btn-primary inline-flex items-center gap-2" data-testid="mp-create-btn">
            <Plus className="w-4 h-4"/> Create agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Categories */}
        <aside className="lg:col-span-1 e360-card p-3 h-fit lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="e360-overline px-2 pb-2 mb-1 border-b border-white/[0.06]">Categorie</div>
          <button onClick={() => setActiveCat(null)} className={`w-full text-left px-2 py-1.5 rounded-md text-sm mb-0.5 ${!activeCat ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"}`} data-testid="mp-cat-all">
            All
          </button>
          {cats.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className={`w-full text-left px-2 py-1.5 rounded-md text-sm mb-0.5 inline-flex items-center gap-2 ${activeCat === c.id ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20" : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"}`} data-testid={`mp-cat-${c.id}`}>
              <span>{c.icon}</span> <span className="truncate">{c.label}</span>
            </button>
          ))}
        </aside>

        {/* Agents grid */}
        <div className="lg:col-span-4">
          <form onSubmit={(e) => { e.preventDefault(); loadAgents(); }} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Cerca agente..." className="e360-input w-full pl-9" data-testid="mp-search-input"/>
            </div>
            <button className="text-sm border border-white/10 text-zinc-300 px-4 rounded-md hover:bg-white/5">Search</button>
          </form>

          {agents.length === 0 ? (
            <div className="e360-card p-12 text-center text-zinc-500">
              <Sparkles className="w-10 h-10 mx-auto opacity-40 mb-3" strokeWidth={1}/>
              {mine ? "Non hai ancora pubblicato agenti." : "Nessun agente in questa categoria — crea il primo!"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((a) => (
                <div key={a.id} className="e360-card e360-card-hover p-5 flex flex-col" data-testid={`mp-agent-${a.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-2xl">{catIcon(a.category)}</div>
                    <span className="text-[10px] uppercase tracking-widest text-cyan-400">{catLabel(a.category)}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1" style={{fontFamily:'Cabinet Grotesk'}}>{a.name}</h3>
                  <p className="text-xs text-zinc-500 mb-3 line-clamp-3 flex-1">{a.description || a.system_prompt.slice(0, 140)}</p>
                  <div className="text-[10px] text-zinc-600 mb-3 flex items-center justify-between">
                    <span>by {a.author_name}</span>
                    <div className="flex items-center gap-2">
                      {a.avg_rating > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" strokeWidth={0}/> {a.avg_rating.toFixed(1)} ({a.reviews_count})
                        </span>
                      )}
                      <span>{a.installs || 0} installs</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => install(a)} className="e360-btn-primary text-xs flex-1 inline-flex items-center justify-center gap-1.5" data-testid={`mp-install-${a.id}`}>
                      <Download className="w-3 h-3"/> Install
                    </button>
                    <button onClick={() => setReviewing(a)} className="text-xs px-2 border border-amber-400/30 text-amber-400 rounded-md hover:bg-amber-400/10" data-testid={`mp-review-${a.id}`} title="Recensisci">
                      <Star className="w-3.5 h-3.5"/>
                    </button>
                    {mine && (
                      <>
                        <button onClick={() => editAgent(a)} className="text-xs px-2 border border-white/10 rounded-md hover:bg-white/5" data-testid={`mp-edit-${a.id}`}>
                          <Edit2 className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={() => remove(a.id)} className="text-xs px-2 border border-red-400/30 text-red-400 rounded-md hover:bg-red-400/10" data-testid={`mp-del-${a.id}`}>
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)}/>
          <div className="relative e360-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{fontFamily:'Cabinet Grotesk'}}>{editing ? "Edit agent" : "New agent"}</h3>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="e360-overline">Nome</label>
                  <input className="e360-input w-full mt-1" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} placeholder="es. SEO Auditor" data-testid="mp-form-name"/>
                </div>
                <div>
                  <label className="e360-overline">Categoria</label>
                  <select className="e360-input w-full mt-1" value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})} data-testid="mp-form-category">
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="e360-overline">Descrizione breve</label>
                <input className="e360-input w-full mt-1" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} placeholder="Cosa fa l'agente in 1-2 frasi" data-testid="mp-form-description"/>
              </div>
              <div>
                <label className="e360-overline">System Prompt (la "personalità" dell'agente)</label>
                <textarea className="e360-input w-full mt-1 min-h-[180px] font-mono text-xs" value={form.system_prompt} onChange={(e)=>setForm({...form, system_prompt: e.target.value})} placeholder="Sei un esperto SEO che..." data-testid="mp-form-prompt"/>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ispub" checked={form.is_public} onChange={(e)=>setForm({...form, is_public: e.target.checked})} data-testid="mp-form-public"/>
                <label htmlFor="ispub" className="text-sm text-zinc-300">Pubblica nel marketplace</label>
              </div>
              <button onClick={save} disabled={busy} className="e360-btn-primary w-full inline-flex items-center justify-center gap-2" data-testid="mp-form-save">
                {busy ? <Loader2 className="w-4 h-4 animate-spin"/> : (editing ? "Update agent" : "Publish agent")}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReviewing(null)}/>
          <div className="relative e360-card p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{fontFamily:'Cabinet Grotesk'}}>Recensisci {reviewing.name}</h3>
              <button onClick={() => setReviewing(null)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="e360-overline">Voto</label>
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} onClick={() => setReviewRating(n)} className="hover:scale-110 transition-transform" data-testid={`mp-review-star-${n}`}>
                      <Star className={`w-7 h-7 ${n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`} strokeWidth={1.5}/>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="e360-overline">Recensione (opzionale)</label>
                <textarea className="e360-input w-full mt-1 min-h-[100px]" value={reviewText} onChange={(e)=>setReviewText(e.target.value)} placeholder="Cosa ne pensi?" data-testid="mp-review-text"/>
              </div>
              <button onClick={submitReview} className="e360-btn-primary w-full" data-testid="mp-review-submit">Invia recensione</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
v>
          </div>
        </div>
      )}
    </div>
  );
}
