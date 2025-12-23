import { cn } from "@/lib/utils"

const MODEL_CONFIG = {
  "gpt-4": { name: "GPT-4", color: "bg-white/5 text-emerald-400/90 border-emerald-500/20" },
  "gpt-4-turbo": { name: "GPT-4 Turbo", color: "bg-white/5 text-emerald-400/90 border-emerald-500/20" },
  "claude-3": { name: "Claude 3", color: "bg-white/5 text-orange-400/90 border-orange-500/20" },
  "claude-3-opus": { name: "Claude 3 Opus", color: "bg-white/5 text-orange-400/90 border-orange-500/20" },
  "gemini-pro": { name: "Gemini Pro", color: "bg-white/5 text-blue-400/90 border-blue-500/20" },
  "gemini-ultra": { name: "Gemini Ultra", color: "bg-white/5 text-blue-400/90 border-blue-500/20" },
  "llama-3": { name: "Llama 3", color: "bg-white/5 text-purple-400/90 border-purple-500/20" },
  mistral: { name: "Mistral", color: "bg-white/5 text-zinc-400 border-zinc-500/20" },
} as const

export type ModelId = keyof typeof MODEL_CONFIG

interface ModelBadgeProps {
  modelId: ModelId
  size?: "sm" | "md" | "lg"
  showDot?: boolean
  className?: string
}

export function ModelBadge({ modelId, size = "md", showDot = false, className }: ModelBadgeProps) {
  const config = MODEL_CONFIG[modelId] || { name: modelId, color: "bg-white/5 text-zinc-400 border-zinc-500/20" }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        config.color,
        sizeClasses[size],
        className,
      )}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
      {config.name}
    </span>
  )
}
