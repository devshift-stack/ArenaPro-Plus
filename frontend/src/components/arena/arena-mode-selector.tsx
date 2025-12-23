import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, Users, GitBranch, FolderKanban, FlaskConical, ChevronDown, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const ARENA_MODES = [
  {
    id: "auto-select",
    name: "Auto-Select",
    description: "AI picks the best model for each task",
    icon: Sparkles,
    color: "text-zinc-400",
  },
  {
    id: "collaborative",
    name: "Collaborative",
    description: "Multiple models discuss and refine answers",
    icon: Users,
    color: "text-zinc-400",
  },
  {
    id: "divide-conquer",
    name: "Divide & Conquer",
    description: "Split tasks among specialized models",
    icon: GitBranch,
    color: "text-zinc-400",
  },
  {
    id: "project",
    name: "Project Mode",
    description: "Persistent context for ongoing projects",
    icon: FolderKanban,
    color: "text-zinc-400",
  },
  {
    id: "tester",
    name: "Tester Mode",
    description: "Compare responses from multiple models",
    icon: FlaskConical,
    color: "text-zinc-400",
  },
] as const

export type ArenaMode = (typeof ARENA_MODES)[number]["id"]

interface ArenaModesSelectorProps {
  value?: ArenaMode
  onChange?: (mode: ArenaMode) => void
  className?: string
}

export function ArenaModeSelector({ value = "auto-select", onChange, className }: ArenaModesSelectorProps) {
  const [open, setOpen] = useState(false)
  const selectedMode = ARENA_MODES.find((m) => m.id === value) || ARENA_MODES[0]
  const Icon = selectedMode.icon

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "justify-between gap-2 min-w-[180px] bg-transparent border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", selectedMode.color)} />
            <span className="text-zinc-200">{selectedMode.name}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] bg-zinc-900 border-zinc-700">
        {ARENA_MODES.map((mode) => {
          const ModeIcon = mode.icon
          const isSelected = mode.id === value

          return (
            <DropdownMenuItem
              key={mode.id}
              onClick={() => {
                onChange?.(mode.id)
                setOpen(false)
              }}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
            >
              <ModeIcon className={cn("w-5 h-5 mt-0.5", mode.color)} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-200">{mode.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{mode.description}</p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
