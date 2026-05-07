import React from 'react'
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Project, Task, Build } from '../../lib/types'

interface WorkspaceProps {
  project?: Project | null
  tasks: Task[]
  builds: Build[]
  onRunBuild: () => void
  isBuilding: boolean
}

export function Workspace({ project, tasks, builds, onRunBuild, isBuilding }: WorkspaceProps) {
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Select or create a project to start building</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          </div>
          <button
            onClick={onRunBuild}
            disabled={isBuilding}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-md text-sm font-medium inline-flex items-center gap-2"
          >
            {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isBuilding ? 'Building...' : 'Run Build'}
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-lg font-semibold mt-1 capitalize">{project.status}</div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="text-xs text-muted-foreground">Tasks</div>
            <div className="text-lg font-semibold mt-1">{tasks.length}</div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="text-xs text-muted-foreground">Builds</div>
            <div className="text-lg font-semibold mt-1">{builds.length}</div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Tasks</h3>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks yet</p>
            ) : (
              tasks.slice(-5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : task.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : task.status === 'running' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{task.prompt}</p>
                    <p className="text-xs text-muted-foreground capitalize">{task.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{task.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Builds */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Builds</h3>
          <div className="space-y-2">
            {builds.length === 0 ? (
              <p className="text-xs text-muted-foreground">No builds yet</p>
            ) : (
              builds.slice(-5).map((build) => (
                <div key={build.id} className="p-3 rounded-lg border border-border font-mono text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    {build.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : build.status === 'failed' ? (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                    )}
                    <span className="capitalize">{build.status}</span>
                    <span className="text-muted-foreground ml-auto">
                      {new Date(build.created_at).toLocaleString()}
                    </span>
                  </div>
                  {build.output && (
                    <pre className="bg-black/50 rounded p-2 overflow-x-auto text-muted-foreground">
                      {build.output.slice(0, 200)}{build.output.length > 200 ? '...' : ''}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
