import React from 'react'
import { Header } from './components/layout/Header'

interface LayoutProps {
  children: React.ReactNode
}

export default function EmergentCloneLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title="Emergent Clone" />
      {children}
    </div>
  )
}
