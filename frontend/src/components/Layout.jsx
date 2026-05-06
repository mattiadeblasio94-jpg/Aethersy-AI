import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Search, FileText, MessageSquare, Code2, Users,
  TrendingUp, Mail, GitBranch, Bot, LogOut, Sparkles, Bell, Menu, X, Brain, Store, Terminal, Crown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "sidebar-nav-dashboard" },
  { to: "/research", label: "AI Research", icon: Search, testid: "sidebar-nav-research" },
  { to: "/business-plan", label: "Business Plan", icon: FileText, testid: "sidebar-nav-business-plan" },
  { to: "/chat", label: "Smart Chat", icon: MessageSquare, testid: "sidebar-nav-chat" },
  { to: "/knowledge", label: "Knowledge", icon: Brain, testid: "sidebar-nav-knowledge" },
  { to: "/marketplace", label: "Marketplace", icon: Store, testid: "sidebar-nav-marketplace" },
  { to: "/copilot", label: "Copilot", icon: Terminal, testid: "sidebar-nav-copilot" },
  { to: "/code", label: "Code Generator", icon: Code2, testid: "sidebar-nav-code" },
  { to: "/crm", label: "CRM & Leads", icon: Users, testid: "sidebar-nav-crm" },
  { to: "/finance", label: "Crypto Tracker", icon: TrendingUp, testid: "sidebar-nav-finance" },
  { to: "/email", label: "Email AI", icon: Mail, testid: "sidebar-nav-email" },
  { to: "/funnels", label: "Funnel Builder", icon: GitBranch, testid: "sidebar-nav-funnels" },
  { to: "/telegram", label: "Telegram Bot", icon: Bot, testid: "sidebar-nav-telegram" },
  { to: "/pricing", label: "Billing & Plan", icon: Crown, testid: "sidebar-nav-billing" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex bg-[#050505] text-white">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 w-64 h-screen border-r border-white/[0.08] bg-[#050505] flex flex-col transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        data-testid="sidebar"
      >
        <div className="px-6 pt-6 pb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
            <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-[15px] tracking-tight" style={{fontFamily:'Cabinet Grotesk'}}>Aethersy AI</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Powered by Lara</div>
          </div>
        </div>
        <div className="px-3 e360-overline mb-2 px-6">Workspace</div>
        <nav className="flex-1 px-3 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, testid }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={testid}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all mb-0.5 ${
                  isActive
                    ? "bg-white/[0.06] text-white border border-white/10 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.15)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                }`
              }
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-white/[0.03]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-bold">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" data-testid="sidebar-user-name">{user?.name || "User"}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
            </div>
            <button onClick={logout} data-testid="sidebar-logout-btn" className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all" title="Sign out">
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 e360-glass border-b border-white/[0.08]">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 text-zinc-400 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                data-testid="mobile-menu-btn"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 border border-white/10 w-72">
                <Search className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <input
                  placeholder="Search modules, leads, chats..."
                  className="bg-transparent flex-1 outline-none text-sm placeholder:text-zinc-600"
                  data-testid="header-search-input"
                />
                <span className="text-[10px] text-zinc-600 border border-white/10 rounded px-1">⌘K</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 relative" data-testid="header-notifications-btn">
                <Bell className="w-4 h-4" strokeWidth={1.5} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </button>
              <button onClick={() => nav("/chat")} className="hidden sm:inline-flex e360-btn-primary text-xs gap-1.5" data-testid="header-new-chat-btn">
                <Sparkles className="w-3.5 h-3.5" /> New Idea
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
