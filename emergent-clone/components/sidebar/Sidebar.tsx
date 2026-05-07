import React from 'react'
import { Folder, Terminal, MessageSquare, Plus } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onNewProject: () => void
}

export function Sidebar({ activeTab, onTabChange, onNewProject }: SidebarProps) {
  const tabs = [
    { id: 'projects', icon: Folder, label: 'Projects' },
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
  ]
  return (
    <aside className="w-16 border-r border-border flex flex-col items-center py-4 gap-4">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`} title={tab.label}>
          <tab.icon className="w-5 h-5" />
        </button>
      ))}
      <div className="flex-1" />
      <button onClick={onNewProject} className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors" title="New Project">
        <Plus className="w-5 h-5" />
      </button>
    </aside>
  )
}
