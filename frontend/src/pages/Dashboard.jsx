import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Users, MessageSquare, FileText, GitBranch, ArrowUpRight, Sparkles } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const KPI = ({ icon: Icon, label, value, delta, testid }) => (
  <div className="e360-card e360-card-hover p-5 animate-fade-up" data-testid={testid}>
    <div className="flex items-start justify-between">
      <div>
        <div className="e360-overline">{label}</div>
        <div className="text-3xl font-bold mt-2" style={{fontFamily:'Cabinet Grotesk'}}>{value}</div>
      </div>
      <div className="w-9 h-9 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
      </div>
    </div>
    <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400">
      <ArrowUpRight className="w-3 h-3" strokeWidth={2}/> {delta}
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard/overview").then((r) => setData(r.data)).catch(() => {});
  }, []);

  const m = data?.metrics || { leads: 0, chats: 0, plans: 0, funnels: 0 };

  return (
    <div className="p-6 md:p-8 space-y-8" data-testid="dashboard-page">
      <div>
        <div className="e360-overline text-cyan-400">Overview</div>
        <h1 className="text-4xl font-bold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Mission Control</h1>
        <p className="text-zinc-500 mt-1 text-sm">Live metrics across your entrepreneurship suite.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI icon={Users} label="Total Leads" value={m.leads} delta="+12% this week" testid="kpi-leads" />
        <KPI icon={MessageSquare} label="AI Chats" value={m.chats} delta="+8% this week" testid="kpi-chats" />
        <KPI icon={FileText} label="Business Plans" value={m.plans} delta="+24% this month" testid="kpi-plans" />
        <KPI icon={GitBranch} label="Funnels Built" value={m.funnels} delta="+5% this month" testid="kpi-funnels" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="e360-card p-6 lg:col-span-2 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="e360-overline">Performance</div>
              <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Cabinet Grotesk'}}>Activity (last 14 days)</h3>
            </div>
            <span className="text-xs text-cyan-400 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-glow inline-block" /> Live
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.series || []}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Line type="monotone" dataKey="value" stroke="#00f0ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="e360-card p-6 animate-fade-up">
          <div className="e360-overline">Recent Leads</div>
          <h3 className="text-xl font-semibold mt-1 mb-4" style={{fontFamily:'Cabinet Grotesk'}}>Pipeline</h3>
          <div className="space-y-3">
            {(data?.recent_leads || []).length === 0 && (
              <div className="text-sm text-zinc-500 py-6 text-center border border-dashed border-white/10 rounded-md">
                No leads yet. Add some in the CRM module.
              </div>
            )}
            {(data?.recent_leads || []).map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-md border border-white/[0.06] hover:border-cyan-400/30 transition-all">
                <div>
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-zinc-500">{l.company || l.email}</div>
                </div>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                  {l.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="e360-card p-6 animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>
          <div className="e360-overline">AI Brief</div>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">
          You're trending up across all modules. Try generating a fresh business plan or running a research brief
          to identify your next high-leverage opportunity.
        </p>
      </div>
    </div>
  );
}
