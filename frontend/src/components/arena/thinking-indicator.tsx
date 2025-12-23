import { cn } from "@/lib/utils"

interface ThinkingIndicatorProps {
  modelName?: string
  className?: string
}

export function ThinkingIndicator({ modelName, className }: ThinkingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3 text-muted-foreground", className)}>
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      {modelName && <span className="text-sm">{modelName} is thinking...</span>}
    </div>
  )
}
