import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Plus, Trash2, Save, Layers, Mail, ShoppingCart, Gift, Video, ArrowDown } from "lucide-react";
import { toast } from "sonner";

const STEP_TYPES = [
  { id: "landing", label: "Landing", icon: Layers },
  { id: "optin", label: "Opt-in", icon: Mail },
  { id: "upsell", label: "Upsell", icon: ShoppingCart },
  { id: "thankyou", label: "Thank You", icon: Gift },
  { id: "webinar", label: "Webinar", icon: Video },
];

export default function Funnels() {
  const [funnels, setFunnels] = useState([]);
  const [active, setActive] = useState(null);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState([]);

  const load = () => api.get("/funnels").then((r) => setFunnels(r.data));
  useEffect(() => { load(); }, []);

  const newFunnel = async () => {
    const r = await api.post("/funnels", { name: "Untitled Funnel", steps: [] });
    await load(); openFunnel(r.data);
  };
  const openFunnel = (f) => { setActive(f); setName(f.name); setSteps(f.steps || []); };

  const addStep = (type) => {
    const t = STEP_TYPES.find(s => s.id === type);
    setSteps([...steps, { id: crypto.randomUUID(), type, title: t.label, description: "" }]);
  };
  const removeStep = (id) => setSteps(steps.filter(s => s.id !== id));
  const updStep = (id, field, val) => setSteps(steps.map(s => s.id === id ? { ...s, [field]: val } : s));

  const save = async () => {
    if (!active) return;
    await api.put(`/funnels/${active.id}`, { name, steps });
    toast.success("Funnel saved");
    load();
  };

  const remove = async () => {
    if (!active) return;
    await api.delete(`/funnels/${active.id}`);
    setActive(null); setSteps([]); load();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]" data-testid="funnels-page">
      <aside className="w-64 border-r border-white/[0.08] flex flex-col bg-[#070707]">
        <div className="p-3 border-b border-white/[0.06]">
          <button onClick={newFunnel} className="e360-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm" data-testid="funnel-new-btn">
            <Plus className="w-4 h-4"/> New funnel
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {funnels.map((f) => (
            <button key={f.id} onClick={() => openFunnel(f)}
              data-testid={`funnel-${f.id}`}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm mb-0.5 transition-all ${active?.id === f.id ? "bg-white/[0.06] border border-white/10" : "hover:bg-white/[0.03]"}`}>
              <div className="font-medium truncate">{f.name}</div>
              <div className="text-[10px] text-zinc-500">{(f.steps || []).length} steps</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 dot-bg overflow-y-auto">
        {!active && (
          <div className="h-full flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <Layers className="w-10 h-10 mx-auto opacity-40 mb-3" strokeWidth={1}/>
              Create or select a funnel to start designing.
            </div>
          </div>
        )}
        {active && (
          <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
              <input value={name} onChange={(e)=>setName(e.target.value)} className="bg-transparent border-b border-white/10 focus:border-cyan-400 outline-none text-2xl font-bold pb-1 flex-1 min-w-[200px]" style={{fontFamily:'Cabinet Grotesk'}} data-testid="funnel-name-input"/>
              <button onClick={save} className="e360-btn-primary inline-flex items-center gap-2 text-sm" data-testid="funnel-save-btn">
                <Save className="w-4 h-4"/> Save
              </button>
              <button onClick={remove} className="text-red-400 border border-red-400/30 px-3 py-1.5 rounded-md text-sm hover:bg-red-400/10" data-testid="funnel-delete-btn">
                <Trash2 className="w-4 h-4 inline mr-1"/> Delete
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((s, i) => {
                const t = STEP_TYPES.find(x => x.id === s.type);
                const Icon = t?.icon || Layers;
                return (
                  <React.Fragment key={s.id}>
                    <div className="e360-card p-4 flex items-start gap-3" data-testid={`funnel-step-${i}`}>
                      <div className="w-10 h-10 rounded-md bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>
                      </div>
                      <div className="flex-1">
                        <div className="e360-overline">{t?.label || s.type}</div>
                        <input value={s.title} onChange={(e) => updStep(s.id, "title", e.target.value)} className="w-full bg-transparent text-base font-semibold mt-1 outline-none border-b border-transparent focus:border-white/20"/>
                        <textarea value={s.description} onChange={(e) => updStep(s.id, "description", e.target.value)} placeholder="What happens here?" className="w-full bg-transparent text-sm text-zinc-400 mt-2 outline-none resize-none"/>
                      </div>
                      <button onClick={() => removeStep(s.id)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-cyan-400/50"/></div>
                    )}
                  </React.Fragment>
                );
              })}

              <div className="e360-card p-4">
                <div className="e360-overline mb-3">Add Step</div>
                <div className="flex flex-wrap gap-2">
                  {STEP_TYPES.map(t => (
                    <button key={t.id} onClick={() => addStep(t.id)} className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/10 hover:border-cyan-400/30 text-sm inline-flex items-center gap-1.5 transition-all" data-testid={`funnel-add-${t.id}`}>
                      <t.icon className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.5}/> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
