import React, { useEffect, useRef } from 'react'
import { Terminal as TerminalIcon } from 'lucide-react'

interface TerminalPanelProps {
  output: string[]
}

export function TerminalPanel({ output }: TerminalPanelProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  return (
    <div className="flex-1 flex flex-col bg-black/50">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
        <TerminalIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-mono">Terminal</span>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1">
        {output.length === 0 ? (
          <div className="text-muted-foreground">
            <span className="text-green-500">$</span> Ready for commands...
          </div>
        ) : (
          output.map((line, i) => (
            <div key={i} className="text-muted-foreground">
              <span className="text-green-500">$</span> {line}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
