import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Brain, Upload, Trash2, Search, FileText, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Knowledge() {
  const [docs, setDocs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [memory, setMemory] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [d, m] = await Promise.all([
      api.get("/knowledge"),
      api.get("/memory"),
    ]);
    setDocs(d.data);
    setMemory(m.data.summary || "");
  };
  useEffect(() => { load(); }, []);

  const addText = async () => {
    if (!content.trim()) { toast.error("Contenuto vuoto"); return; }
    setBusy(true);
    try {
      await api.post("/knowledge", { title: title || "Untitled", content });
      toast.success("Documento aggiunto");
      setTitle(""); setContent(""); setShowAdd(false);
      load();
    } catch (e) { toast.error("Aggiunta fallita"); } finally { setBusy(false); }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post("/knowledge/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${file.name} caricato`);
      load();
    } catch (e) { toast.error("Upload fallito"); } finally { setBusy(false); e.target.value = ""; }
  };

  const remove = async (id) => {
    await api.delete(`/knowledge/${id}`);
    toast.success("Documento eliminato");
    load();
  };

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    const r = await api.post("/knowledge/search", { query, k: 5 });
    setResults(r.data.results);
  };

  const saveMemory = async () => {
    await api.put("/memory", { summary: memory });
    toast.success("Memoria salvata");
  };

  const totalChunks = docs.reduce((s, d) => s + (d.chunks || 0), 0);

  return (
    <div className="p-6 md:p-8" data-testid="knowledge-page">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="e360-overline text-cyan-400">Knowledge & Memory</div>
          <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Lara's brain.</h1>
          <p className="text-zinc-500 mt-1 text-sm">Carica documenti, gestisci la memoria di lungo termine. Lara li userà nelle sue risposte.</p>
        </div>
        <div className="flex gap-2">
          <label className="e360-btn-primary inline-flex items-center gap-2 cursor-pointer" data-testid="kb-upload-btn">
            {busy ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Upload file
            <input type="file" accept=".txt,.md,.markdown,.csv,.json" className="hidden" onChange={upload}/>
          </label>
          <button onClick={() => setShowAdd(true)} className="text-sm border border-white/10 text-zinc-300 px-4 py-2 rounded-md hover:bg-white/5 inline-flex items-center gap-2" data-testid="kb-add-text-btn">
            <Plus className="w-4 h-4"/> Add text
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: docs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Documents" value={docs.length} icon={FileText}/>
            <Stat label="Chunks" value={totalChunks} icon={Brain}/>
            <Stat label="Total chars" value={docs.reduce((s,d)=>s+(d.chars||0),0).toLocaleString()} icon={FileText}/>
          </div>

          <div className="e360-card p-0">
            <div className="px-4 py-3 border-b border-white/[0.06] e360-overline">Documents</div>
            {docs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                Nessun documento. Carica un file .txt o .md per iniziare.
              </div>
            ) : (
              <div>
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]" data-testid={`kb-doc-${d.id}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" strokeWidth={1.5}/>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{d.title}</div>
                        <div className="text-xs text-zinc-500">{d.chunks} chunks · {(d.chars || 0).toLocaleString()} chars · {new Date(d.ts).toLocaleString()}</div>
                      </div>
                    </div>
                    <button onClick={() => remove(d.id)} className="text-zinc-500 hover:text-red-400 shrink-0" data-testid={`kb-del-${d.id}`}>
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="e360-card p-4">
            <div className="e360-overline mb-2">Test search (vede cosa Lara troverà)</div>
            <form onSubmit={search} className="flex gap-2">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="es. politica di reso, prezzo del prodotto..." className="e360-input flex-1" data-testid="kb-search-input"/>
              <button className="e360-btn-primary inline-flex items-center gap-2" data-testid="kb-search-btn">
                <Search className="w-4 h-4"/> Search
              </button>
            </form>
            {results.length > 0 && (
              <div className="mt-4 space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="p-3 rounded-md bg-black/40 border border-white/[0.06] text-xs">
                    <div className="text-cyan-400 font-medium mb-1">{r.title} <span className="text-zinc-500">· score {r.score?.toFixed(2)}</span></div>
                    <div className="text-zinc-300 whitespace-pre-wrap line-clamp-4">{r.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: memory */}
        <div className="lg:col-span-1">
          <div className="e360-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>
              <div className="e360-overline">Long-term memory</div>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Lara aggiorna automaticamente questo riepilogo ogni 6 messaggi. Puoi modificarlo manualmente.
            </p>
            <textarea
              value={memory}
              onChange={(e)=>setMemory(e.target.value)}
              className="e360-input w-full min-h-[300px] font-[Manrope] text-xs leading-relaxed"
              placeholder="Lara non sa ancora nulla di te. Inizia una conversazione su Smart Chat..."
              data-testid="memory-textarea"
            />
            <div className="text-[10px] text-zinc-600 mt-1">{memory.length}/2000</div>
            <button onClick={saveMemory} className="e360-btn-primary w-full mt-3 text-sm" data-testid="memory-save-btn">
              Save memory
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setShowAdd(false)}/>
          <div className="relative e360-card p-6 w-full max-w-lg animate-fade-up">
            <h3 className="text-xl font-bold mb-4" style={{fontFamily:'Cabinet Grotesk'}}>Aggiungi documento</h3>
            <div className="space-y-3">
              <div>
                <label className="e360-overline">Titolo</label>
                <input className="e360-input w-full mt-1" value={title} onChange={(e)=>setTitle(e.target.value)} data-testid="kb-add-title"/>
              </div>
              <div>
                <label className="e360-overline">Contenuto (markdown ok)</label>
                <textarea className="e360-input w-full mt-1 min-h-[200px]" value={content} onChange={(e)=>setContent(e.target.value)} data-testid="kb-add-content"/>
              </div>
              <button onClick={addText} disabled={busy} className="e360-btn-primary w-full inline-flex items-center justify-center gap-2" data-testid="kb-add-save">
                {busy ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Stat = ({ label, value, icon: Icon }) => (
  <div className="e360-card p-4">
    <div className="flex items-start justify-between">
      <div>
        <div className="e360-overline">{label}</div>
        <div className="text-2xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>{value}</div>
      </div>
      <Icon className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>
    </div>
  </div>
);
