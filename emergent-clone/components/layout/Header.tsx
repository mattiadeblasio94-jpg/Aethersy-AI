import React from 'react'
import { Zap } from 'lucide-react'

export function Header() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/50 backdrop-blur">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-semibold">Emergent Clone</h1>
      </div>
      <span className="text-xs text-muted-foreground">AI-Powered Development</span>
    </header>
  )
}
