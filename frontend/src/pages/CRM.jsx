import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { id: "new", label: "New", color: "border-cyan-400/40 text-cyan-400" },
  { id: "contacted", label: "Contacted", color: "border-blue-400/40 text-blue-400" },
  { id: "qualified", label: "Qualified", color: "border-amber-400/40 text-amber-400" },
  { id: "proposal", label: "Proposal", color: "border-purple-400/40 text-purple-400" },
  { id: "won", label: "Won", color: "border-emerald-400/40 text-emerald-400" },
  { id: "lost", label: "Lost", color: "border-red-400/40 text-red-400" },
];

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", stage: "new", value: 0, notes: "" });

  const load = () => api.get("/crm/leads").then((r) => setLeads(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    await api.post("/crm/leads", { ...form, value: parseFloat(form.value) || 0 });
    toast.success("Lead added");
    setForm({ name: "", email: "", company: "", phone: "", stage: "new", value: 0, notes: "" });
    setShowAdd(false);
    load();
  };

  const moveStage = async (lead, newStage) => {
    await api.patch(`/crm/leads/${lead.id}`, { stage: newStage });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/crm/leads/${id}`);
    load();
    setEditing(null);
  };

  return (
    <div className="p-6 md:p-8" data-testid="crm-page">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="e360-overline text-cyan-400">CRM & Leads</div>
          <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Pipeline Command</h1>
          <p className="text-zinc-500 mt-1 text-sm">Drag-free kanban — click to move stages.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="e360-btn-primary inline-flex items-center gap-2" data-testid="crm-add-lead-btn">
          <Plus className="w-4 h-4"/> Add Lead
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((s) => {
          const items = leads.filter((l) => l.stage === s.id);
          return (
            <div key={s.id} className="e360-card p-3 min-h-[300px]" data-testid={`crm-column-${s.id}`}>
              <div className={`flex items-center justify-between mb-3 px-2 pb-2 border-b ${s.color}`}>
                <span className="e360-overline">{s.label}</span>
                <span className="text-xs text-zinc-500">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((l) => (
                  <button key={l.id} onClick={() => setEditing(l)} className="w-full text-left p-3 rounded-md bg-white/[0.02] border border-white/[0.06] hover:border-cyan-400/30 transition-all">
                    <div className="text-sm font-medium">{l.name}</div>
                    {l.company && <div className="text-xs text-zinc-500">{l.company}</div>}
                    {l.value > 0 && <div className="text-xs text-emerald-400 mt-1">${l.value.toLocaleString()}</div>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <Drawer onClose={() => setShowAdd(false)} title="New Lead">
          <div className="space-y-3">
            <Field label="Name" v={form.name} on={(v) => setForm({...form, name: v})} testid="lead-name"/>
            <Field label="Email" v={form.email} on={(v) => setForm({...form, email: v})} testid="lead-email"/>
            <Field label="Company" v={form.company} on={(v) => setForm({...form, company: v})} testid="lead-company"/>
            <Field label="Phone" v={form.phone} on={(v) => setForm({...form, phone: v})} testid="lead-phone"/>
            <Field label="Value ($)" v={form.value} on={(v) => setForm({...form, value: v})} type="number" testid="lead-value"/>
            <div>
              <label className="e360-overline">Stage</label>
              <select className="e360-input w-full mt-1" value={form.stage} onChange={(e)=>setForm({...form, stage: e.target.value})} data-testid="lead-stage">
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="e360-overline">Notes</label>
              <textarea className="e360-input w-full mt-1 min-h-[80px]" value={form.notes} onChange={(e)=>setForm({...form, notes: e.target.value})} data-testid="lead-notes"/>
            </div>
            <button onClick={create} className="e360-btn-primary w-full" data-testid="lead-save-btn">Save Lead</button>
          </div>
        </Drawer>
      )}

      {editing && (
        <Drawer onClose={() => setEditing(null)} title={editing.name}>
          <div className="space-y-3">
            <div className="text-sm text-zinc-400">{editing.email} · {editing.company}</div>
            <div className="text-2xl font-bold text-emerald-400">${(editing.value || 0).toLocaleString()}</div>
            {editing.notes && <p className="text-sm text-zinc-300 bg-white/[0.03] p-3 rounded-md">{editing.notes}</p>}
            <div>
              <label className="e360-overline">Move stage</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {STAGES.map((s) => (
                  <button key={s.id} onClick={() => { moveStage(editing, s.id); setEditing({...editing, stage: s.id}); }}
                    className={`text-xs py-2 rounded-md border transition-all ${editing.stage === s.id ? "bg-cyan-400 text-black border-cyan-400 font-semibold" : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"}`}
                    data-testid={`lead-move-${s.id}`}
                  >{s.label}</button>
                ))}
              </div>
            </div>
            <button onClick={() => remove(editing.id)} className="w-full mt-2 inline-flex items-center justify-center gap-2 text-red-400 border border-red-400/30 py-2 rounded-md hover:bg-red-400/10 transition-all" data-testid="lead-delete-btn">
              <Trash2 className="w-4 h-4"/> Delete lead
            </button>
          </div>
        </Drawer>
      )}
    </div>
  );
}

const Field = ({ label, v, on, type = "text", testid }) => (
  <div>
    <label className="e360-overline">{label}</label>
    <input type={type} className="e360-input w-full mt-1" value={v} onChange={(e) => on(e.target.value)} data-testid={testid}/>
  </div>
);

const Drawer = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 flex justify-end" data-testid="crm-drawer">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
    <div className="relative w-full sm:w-96 bg-[#0d0d0d] border-l border-white/[0.08] p-6 overflow-y-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold" style={{fontFamily:'Cabinet Grotesk'}}>{title}</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="crm-drawer-close">
          <X className="w-5 h-5"/>
        </button>
      </div>
      {children}
    </div>
  </div>
);
