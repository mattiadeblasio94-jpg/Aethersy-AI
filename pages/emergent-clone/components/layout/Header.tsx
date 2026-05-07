import React from 'react'
import { Zap, Github } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Emergent Clone' }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/50 backdrop-blur">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="hidden sm:inline">AI-Powered Development</span>
        <a href="#" className="hover:text-foreground">
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  )
}
