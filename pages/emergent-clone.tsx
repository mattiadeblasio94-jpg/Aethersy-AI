'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '../components/emergent-clone/layout/Header'
import { Sidebar } from '../components/emergent-clone/sidebar/Sidebar'
import { ProjectList } from '../components/emergent-clone/project-list/ProjectList'
import { Workspace } from '../components/emergent-clone/workspace/Workspace'
import { ChatPanel } from '../components/emergent-clone/chat/ChatPanel'
import { TerminalPanel } from '../components/emergent-clone/terminal/TerminalPanel'
import { Project, Task, Build, Message } from '../lib/emergent-clone/types'
import { generateChatCompletion } from '../lib/emergent-clone/llm'

export default function EmergentClonePage() {
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [builds, setBuilds] = useState<Build[]>([])
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/emergent-clone/projects')
      const data = await res.json()
      setProjects(data)
    } catch (e) { console.error('Failed to load projects:', e) }
  }

  const loadProjectData = async (projectId: string) => {
    try {
      const [tasksRes, buildsRes] = await Promise.all([
        fetch(`/api/emergent-clone/tasks?projectId=${projectId}`),
        fetch(`/api/emergent-clone/builds?projectId=${projectId}`),
      ])
      setTasks(await tasksRes.json())
      setBuilds(await buildsRes.json())
    } catch (e) { console.error('Failed to load project data:', e) }
  }

  const handleNewProject = async () => {
    const name = prompt('Project name:')
    if (!name) return
    try {
      const res = await fetch('/api/emergent-clone/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: 'Created with AI' }) })
      const project = await res.json()
      setProjects([...projects, project])
      setActiveProjectId(project.id)
      addTerminalMessage(`Created project: ${project.name}`)
    } catch (e) { console.error('Failed to create project:', e) }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/emergent-clone/projects/${id}`, { method: 'DELETE' })
      setProjects(projects.filter((p) => p.id !== id))
      if (activeProjectId === id) { setActiveProjectId(undefined); setTasks([]); setBuilds([]) }
      addTerminalMessage(`Deleted project: ${id}`)
    } catch (e) { console.error('Failed to delete project:', e) }
  }

  const handleSelectProject = async (id: string) => {
    setActiveProjectId(id)
    await loadProjectData(id)
    addTerminalMessage(`Selected project: ${id}`)
  }

  const handleRunBuild = async () => {
    if (!activeProjectId) return
    setIsBuilding(true)
    addTerminalMessage('Starting build...')
    try {
      const res = await fetch('/api/emergent-clone/builds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: activeProjectId, task_id: 'manual', prompt: 'Build the current project' }) })
      const result = await res.json()
      setBuilds([...builds, result])
      addTerminalMessage(result.success ? 'Build completed!' : `Build failed: ${result.error}`)
    } catch (e) { addTerminalMessage(`Build error: ${e}`) }
    finally { setIsBuilding(false) }
  }

  const handleSendMessage = async (content: string) => {
    setIsSending(true)
    const userMsg: Message = { id: 'user-' + Date.now(), role: 'user', content, timestamp: new Date().toISOString() }
    setChatMessages([...chatMessages, userMsg])
    addTerminalMessage(`User: ${content}`)
    try {
      const response = await generateChatCompletion([{ role: 'user', content }])
      const aiMsg: Message = { id: 'ai-' + Date.now(), role: 'assistant', content: response, timestamp: new Date().toISOString() }
      setChatMessages((prev) => [...prev, aiMsg])
      addTerminalMessage(`AI: ${response.slice(0, 50)}...`)
      if (!activeProjectId && projects.length === 0) handleNewProject()
    } catch (e) {
      const errMsg: Message = { id: 'error-' + Date.now(), role: 'system', content: `Error: ${e}`, timestamp: new Date().toISOString() }
      setChatMessages((prev) => [...prev, errMsg])
    } finally { setIsSending(false) }
  }

  const addTerminalMessage = (msg: string) => setTerminalOutput((prev) => [...prev, msg])
  const activeProject = projects.find((p) => p.id === activeProjectId) || null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex h-[calc(100vh-3.5rem)]">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onNewProject={handleNewProject} />
        {activeTab === 'projects' && (
          <div className="flex-1 flex">
            <div className="w-80 border-r border-border overflow-auto"><ProjectList projects={projects} activeProject={activeProjectId} onSelectProject={handleSelectProject} onDeleteProject={handleDeleteProject} /></div>
            <Workspace project={activeProject} tasks={tasks} builds={builds} onRunBuild={handleRunBuild} isBuilding={isBuilding} />
          </div>
        )}
        {activeTab === 'chat' && <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} isSending={isSending} />}
        {activeTab === 'terminal' && <TerminalPanel output={terminalOutput} />}
      </div>
    </div>
  )
}
