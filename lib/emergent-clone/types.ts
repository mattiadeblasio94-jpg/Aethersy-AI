export interface Project {
  id: string
  name: string
  description: string
  status: 'idle' | 'building' | 'ready' | 'error'
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  type: 'code' | 'research' | 'build' | 'deploy'
  status: 'pending' | 'running' | 'completed' | 'failed'
  prompt: string
  result?: string
  error?: string
  created_at: string
  completed_at?: string
}

export interface Build {
  id: string
  project_id: string
  task_id: string
  status: 'pending' | 'building' | 'success' | 'failed'
  output?: string
  artifacts?: string[]
  error?: string
  created_at: string
  completed_at?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface WorkspaceState {
  activeProject?: string
  files: Record<string, string>
  terminal: string[]
  chat: Message[]
}
