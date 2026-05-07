"use client";

import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface TaskMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface IntegrationProvider {
  id: string;
  name: string;
  category: string;
}

interface IntegrationConnection {
  id: string;
  display_name: string;
  provider_slug?: string;
  integration_providers?: { name: string }[];
  metadata?: { default_database_id?: string };
}

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "integrations">("chat");
  const [integrations, setIntegrations] = useState<IntegrationProvider[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);

  useEffect(() => {
    fetch("/api/emergent-clone/projects?ownerId=user")
      .then(r => r.json())
      .then(setProjects);
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    fetch(`/api/emergent-clone/tasks?projectId=${selectedProject.id}`)
      .then(r => r.json())
      .then(setMessages);
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    fetch(`/api/emergent-clone/integrations/connections?projectId=${selectedProject.id}`)
      .then(r => r.json())
      .then(setConnections);
  }, [selectedProject]);

  useEffect(() => {
    fetch("/api/emergent-clone/integrations/providers")
      .then(r => r.json())
      .then(setIntegrations);
  }, []);

  const sendMessage = async () => {
    if (!selectedProject || !input.trim()) return;
    const res = await fetch("/api/emergent-clone/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProject.id,
        role: "user",
        content: input
      })
    });
    const msg = await res.json();
    setMessages(prev => [...prev, msg]);
    setInput("");
  };

  const triggerBuild = async () => {
    if (!selectedProject) return;
    await fetch("/api/emergent-clone/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject.id })
    });
    alert("Build triggered");
  };

  return (
    <main className="min-h-screen flex">
      <aside className="w-64 border-r border-slate-800 p-4 space-y-4">
        <h2 className="font-semibold mb-2">Progetti</h2>
        <div className="space-y-2">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                selectedProject?.id === p.id
                  ? "bg-slate-800 text-accent"
                  : "bg-slate-900 text-slate-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col">
        <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-semibold">
                {selectedProject ? selectedProject.name : "Seleziona un progetto"}
              </h1>
              <p className="text-xs text-slate-500">
                Conversazione e integrazioni per questo progetto.
              </p>
            </div>
            {selectedProject && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={activeTab === "chat" ? "text-accent" : "text-slate-500"}
                >
                  Chat
                </button>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => setActiveTab("integrations")}
                  className={activeTab === "integrations" ? "text-accent" : "text-slate-500"}
                >
                  Integrations
                </button>
              </div>
            )}
          </div>
          {selectedProject && activeTab === "chat" && (
            <button
              onClick={triggerBuild}
              className="px-3 py-1.5 rounded-md bg-accent text-slate-900 text-sm font-medium"
            >
              Build app
            </button>
          )}
        </header>

        <div className="flex-1 flex flex-col">
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className="text-sm">
                    <span className="font-semibold mr-2 text-slate-400">
                      {m.role === "user" ? "Tu" : m.role === "assistant" ? "AI" : "System"}:
                    </span>
                    <span>{m.content}</span>
                  </div>
                ))}
              </div>
              {selectedProject && (
                <div className="border-t border-slate-800 p-3 flex gap-2">
                  <input
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none"
                    placeholder="Descrivi l'app che vuoi costruire..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    className="px-3 py-2 rounded-md bg-accent text-slate-900 text-sm font-medium"
                  >
                    Invia
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "integrations" && selectedProject && (
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Connected</h2>
                <div className="space-y-2">
                  {connections.map(c => (
                    <div key={c.id} className="border border-slate-800 rounded-md p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{c.display_name}</span>
                        <span className="text-slate-500">
                          {c.integration_providers?.[0]?.name ?? c.provider_slug}
                        </span>
                      </div>

                      {c.provider_slug === "notion" && (
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase text-slate-500">
                            Default database ID
                          </label>
                          <input
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                            defaultValue={c.metadata?.default_database_id ?? ""}
                            onBlur={async e => {
                              const value = e.target.value.trim();
                              await fetch("/api/emergent-clone/integrations/connections/update-metadata", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  connectionId: c.id,
                                  metadata: { ...c.metadata, default_database_id: value }
                                })
                              });
                            }}
                            placeholder="es. 1234abcd-..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <p className="text-xs text-slate-500">
                      Nessuna integrazione collegata a questo progetto.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Available providers</h2>
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {integrations.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left border border-slate-800 rounded-md p-3 text-xs hover:border-accent/60"
                      onClick={() => {
                        alert(`Configura provider: ${p.name}`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-slate-500">{p.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
