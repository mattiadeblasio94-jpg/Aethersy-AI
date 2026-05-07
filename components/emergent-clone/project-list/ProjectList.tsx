import React from 'react'
import { Trash2 } from 'lucide-react'
import { Project } from '../../lib/types'

interface ProjectListProps {
  projects: Project[]
  activeProject?: string
  onSelectProject: (id: string) => void
  onDeleteProject: (id: string) => void
}

export function ProjectList({ projects, activeProject, onSelectProject, onDeleteProject }: ProjectListProps) {
  const statusColors: Record<string, string> = { idle: 'bg-muted', building: 'bg-yellow-500/20 text-yellow-500', ready: 'bg-green-500/20 text-green-500', error: 'bg-red-500/20 text-red-500' }
  return (
    <div className="p-4 space-y-2">
      <h2 className="text-sm font-semibold mb-4">Projects</h2>
      {projects.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No projects yet. Create one to get started.</p>
      ) : (
        projects.map((project) => (
          <div key={project.id} onClick={() => onSelectProject(project.id)} className={`group p-3 rounded-lg border cursor-pointer transition-all ${activeProject === project.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{project.name}</h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description || 'No description'}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id) }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all">
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[project.status]}`}>{project.status}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
