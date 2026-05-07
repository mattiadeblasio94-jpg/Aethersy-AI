import React, { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Message } from '../../lib/types'

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (content: string) => Promise<void>
  isSending: boolean
}

export function ChatPanel({ messages, onSendMessage, isSending }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return
    await onSendMessage(input)
    setInput('')
  }
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? <div className="text-center text-muted-foreground py-12"><p className="text-sm">Start a conversation with AI</p><p className="text-xs mt-2">Ask me to build anything</p></div> : messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-muted border border-border'}`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {isSending && <div className="flex justify-start"><div className="bg-muted border border-border px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span>Thinking...</span></div></div>}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe what you want to build..." className="flex-1 bg-muted border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary" disabled={isSending} />
          <button type="submit" disabled={isSending || !input.trim()} className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-md inline-flex items-center gap-2">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </div>
      </form>
    </div>
  )
}
