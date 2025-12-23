// AI Arena - New Arena Page with v0 Design Components
import { useState } from "react"
import { MessageBubble } from "@/components/arena/message-bubble"
import { ModelBadge } from "@/components/arena/model-badge"
import { ThinkingIndicator } from "@/components/arena/thinking-indicator"
import { ArenaModeSelector, type ArenaMode } from "@/components/arena/arena-mode-selector"
import { ChatInput } from "@/components/arena/chat-input"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
  modelId?: "gpt-4" | "gpt-4-turbo" | "claude-3" | "claude-3-opus" | "gemini-pro" | "gemini-ultra" | "llama-3" | "mistral"
  timestamp: Date
}

export function ArenaPage() {
  const [selectedMode, setSelectedMode] = useState<ArenaMode>("auto-select")
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // Simulate AI thinking
    setIsThinking(true)

    // Simulate response delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Add AI response
    const aiMessage: Message = {
      role: "assistant",
      content: `Das ist eine Demo-Antwort auf: "${content}"`,
      modelId: "claude-3",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, aiMessage])
    setIsThinking(false)
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-zinc-100">ArenaPro+</h1>
          <ArenaModeSelector value={selectedMode} onChange={setSelectedMode} />
        </div>
        <div className="flex items-center gap-2">
          <ModelBadge modelId="gpt-4" size="sm" />
          <ModelBadge modelId="claude-3" size="sm" />
          <ModelBadge modelId="gemini-pro" size="sm" />
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200">
            <Settings2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto py-6">
        <div className="space-y-6 px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">Willkommen bei ArenaPro+</h2>
              <p className="text-zinc-400 max-w-md">
                Wähle einen Modus und starte eine Konversation mit mehreren KI-Modellen gleichzeitig.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                role={msg.role}
                content={msg.content}
                modelId={msg.modelId}
                timestamp={msg.timestamp}
              />
            ))
          )}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="max-w-3xl mx-auto">
              <ThinkingIndicator modelName="Claude 3" />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 pb-6 border-t border-zinc-800">
        <ChatInput
          onSend={handleSend}
          placeholder="Nachricht an ArenaPro+..."
          disabled={isThinking}
        />
      </footer>
    </div>
  )
}

export default ArenaPage
