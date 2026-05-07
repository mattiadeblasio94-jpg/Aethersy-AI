// In-memory database for emergent-clone
// In production, replace with actual database

import { Project, Task, Build } from './types'

const projects = new Map<string, Project>()
const tasks = new Map<string, Task>()
const builds = new Map<string, Build>()

export const db = {
  projects: {
    create: async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
      const id = 'proj_' + Date.now()
      const project: Project = {
        ...data,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      projects.set(id, project)
      return project
    },
    findAll: async (): Promise<Project[]> => {
      return Array.from(projects.values())
    },
    findById: async (id: string): Promise<Project | null> => {
      return projects.get(id) || null
    },
    update: async (id: string, data: Partial<Project>): Promise<Project | null> => {
      const project = projects.get(id)
      if (!project) return null
      const updated = { ...project, ...data, updated_at: new Date().toISOString() }
      projects.set(id, updated)
      return updated
    },
    delete: async (id: string): Promise<boolean> => {
      return projects.delete(id)
    },
  },
  tasks: {
    create: async (data: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
      const id = 'task_' + Date.now()
      const task: Task = {
        ...data,
        id,
        created_at: new Date().toISOString(),
      }
      tasks.set(id, task)
      return task
    },
    findByProjectId: async (projectId: string): Promise<Task[]> => {
      return Array.from(tasks.values()).filter(t => t.project_id === projectId)
    },
    update: async (id: string, data: Partial<Task>): Promise<Task | null> => {
      const task = tasks.get(id)
      if (!task) return null
      const updated = { ...task, ...data }
      if (data.status === 'completed' || data.status === 'failed') {
        updated.completed_at = new Date().toISOString()
      }
      tasks.set(id, updated)
      return updated
    },
  },
  builds: {
    create: async (data: Omit<Build, 'id' | 'created_at'>): Promise<Build> => {
      const id = 'build_' + Date.now()
      const build: Build = {
        ...data,
        id,
        created_at: new Date().toISOString(),
      }
      builds.set(id, build)
      return build
    },
    findByProjectId: async (projectId: string): Promise<Build[]> => {
      return Array.from(builds.values()).filter(b => b.project_id === projectId)
    },
    update: async (id: string, data: Partial<Build>): Promise<Build | null> => {
      const build = builds.get(id)
      if (!build) return null
      const updated = { ...build, ...data }
      if (data.status === 'success' || data.status === 'failed') {
        updated.completed_at = new Date().toISOString()
      }
      builds.set(id, updated)
      return updated
    },
  },
}
