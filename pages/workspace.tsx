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

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [input, setInput] = useState("");

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
          <div>
            <h1 className="font-semibold">
              {selectedProject ? selectedProject.name : "Seleziona un progetto"}
            </h1>
            <p className="text-xs text-slate-500">
              Conversazione per definire l'app.
            </p>
          </div>
          {selectedProject && (
            <button
              onClick={triggerBuild}
              className="px-3 py-1.5 rounded-md bg-accent text-slate-900 text-sm font-medium"
            >
              Build app
            </button>
          )}
        </header>

        <div className="flex-1 flex flex-col">
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
        </div>
      </section>
    </main>
  );
}
