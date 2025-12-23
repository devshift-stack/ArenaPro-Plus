import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ArrowUp, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSend?: (message: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChatInput({
  onSend,
  placeholder = "Message AI Arena...",
  disabled = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = () => {
    if (message.trim() && onSend) {
      onSend(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="relative flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl p-2 focus-within:border-zinc-600 transition-colors">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none outline-none text-[15px] leading-relaxed py-2 max-h-48 min-h-[36px]"
          style={{
            height: "auto",
            overflowY: message.split("\n").length > 5 ? "auto" : "hidden",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = "auto"
            target.style.height = Math.min(target.scrollHeight, 192) + "px"
          }}
        />

        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          size="icon"
          className={cn(
            "h-9 w-9 rounded-xl flex-shrink-0 transition-all",
            message.trim()
              ? "bg-zinc-100 text-zinc-900 hover:bg-white"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed",
          )}
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-center text-xs text-zinc-600 mt-2">
        AI Arena can make mistakes. Consider checking important information.
      </p>
    </div>
  )
}
