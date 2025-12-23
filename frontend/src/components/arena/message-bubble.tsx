import { cn } from "@/lib/utils"
import { ModelBadge, type ModelId } from "./model-badge"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  modelId?: ModelId
  timestamp?: Date
  isStreaming?: boolean
  className?: string
}

export function MessageBubble({
  role,
  content,
  modelId,
  timestamp,
  isStreaming = false,
  className,
}: MessageBubbleProps) {
  const isUser = role === "user"

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("max-w-3xl mx-auto", isUser ? "flex justify-end" : "")}>
        <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
          {/* Model badge for assistant */}
          {!isUser && modelId && <ModelBadge modelId={modelId} size="sm" />}

          {/* Message content */}
          <div
            className={cn(
              "px-4 py-3 rounded-2xl text-[15px] leading-relaxed max-w-[85%]",
              isUser ? "bg-zinc-700 text-zinc-100" : "bg-transparent text-zinc-200",
            )}
          >
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-5 ml-1 bg-zinc-400 animate-pulse rounded-sm align-middle" />
            )}
          </div>

          {/* Timestamp */}
          {timestamp && (
            <span className="text-xs text-zinc-500 px-1">
              {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
