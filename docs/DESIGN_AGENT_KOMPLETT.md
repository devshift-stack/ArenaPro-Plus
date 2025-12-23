# ══════════════════════════════════════════════════════════════════════════════
#                    AI ARENA - DESIGN & UX AGENT
#                    KOMPLETTE ARBEITSANLEITUNG
# ══════════════════════════════════════════════════════════════════════════════
#
# Letzte Aktualisierung: Dezember 2024
# Version: 1.0
#
# Diese Datei enthält ALLES was der Design/UX-Agent benötigt um das 
# Frontend der AI Arena Plattform zu implementieren.
#
# ══════════════════════════════════════════════════════════════════════════════



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                        TEIL 1: PROJEKTÜBERSICHT                            ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## Was ist AI Arena?

AI Arena ist eine Multi-Model KI-Chat-Plattform die mehrere KI-Modelle 
(Claude, GPT-4, Gemini, Llama, etc.) orchestriert. 

Kernfeatures:
- 5 Arena-Modi für verschiedene Aufgabentypen
- Verschlüsseltes Memory-System (merkt sich User-Präferenzen)
- Duale Knowledge Base (verifiziert/unverifiziert)
- Team-Kollaboration
- Prompt-Bibliothek

## Die 5 Arena-Modi

| Modus           | Icon | Farbe   | Beschreibung                              |
|-----------------|------|---------|-------------------------------------------|
| Auto-Select     | 🎯   | Orange  | Arena wählt automatisch das beste Modell  |
| Collaborative   | 🤝   | Blue    | Mehrere Modelle arbeiten zusammen         |
| Divide & Conquer| ✂️   | Purple  | Aufgabe wird aufgeteilt an Spezialisten   |
| Project         | 📋   | Green   | Kollaborative Projektarbeit               |
| Tester          | 🧪   | Red     | Automatisierte Tests mit Verifikation     |

## Design-Philosophie

"Mächtig, aber nicht kompliziert.
 Schön, aber nicht ablenkend.
 Intelligent, aber nicht bevormundend."

Kernprinzipien:
1. CLARITY FIRST - Jedes Element hat einen klaren Zweck
2. INSTANT FEEDBACK - Sofortige visuelle Rückmeldung auf Aktionen
3. COGNITIVE LOAD REDUCTION - Komplexität verstecken, nicht zeigen
4. FLUID EXPERIENCE - Nahtlose Übergänge zwischen Zuständen
5. PREDICTABILITY - Konsistente Patterns überall



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                         TEIL 2: TECH STACK                                 ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## Verwendete Technologien

Framework:      React 18 mit TypeScript
Build Tool:     Vite 5
Styling:        Tailwind CSS 3.4
Icons:          Lucide React
Animations:     Framer Motion
State:          TanStack Query + Zustand
Routing:        React Router 6
Forms:          React Hook Form + Zod
Markdown:       react-markdown + react-syntax-highlighter
UI Primitives:  Radix UI

## Projektstruktur

frontend/src/
├── components/
│   ├── ui/                    # Design System Components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Switch.tsx
│   │   ├── Tabs.tsx
│   │   └── index.ts           # Barrel Export
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MainLayout.tsx
│   │   └── MobileNav.tsx
│   │
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── CodeBlock.tsx
│   │   └── MessageActions.tsx
│   │
│   ├── arena/
│   │   ├── ModeSelector.tsx
│   │   ├── ModelBadge.tsx
│   │   ├── ModelSelector.tsx
│   │   └── ProgressIndicator.tsx
│   │
│   └── memory/
│       ├── MemoryViewer.tsx
│       └── MemorySettings.tsx
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ChatPage.tsx
│   ├── ChatListPage.tsx
│   ├── KnowledgeBasePage.tsx
│   ├── TeamsPage.tsx
│   ├── PromptsPage.tsx
│   ├── SettingsPage.tsx
│   └── MemorySettingsPage.tsx
│
├── contexts/
│   ├── AuthContext.tsx        # ✅ Existiert
│   ├── ThemeContext.tsx       # ✅ Existiert
│   ├── ToastContext.tsx       # ✅ Existiert
│   └── WebSocketContext.tsx   # ✅ Existiert
│
├── hooks/
│   ├── useChat.ts
│   ├── useArena.ts
│   ├── useMemory.ts
│   └── useMediaQuery.ts
│
├── lib/
│   └── utils.ts               # ✅ Existiert (cn, formatDate, etc.)
│
├── types/
│   └── index.ts               # ✅ Existiert
│
└── utils/
    └── api.ts                 # ✅ Existiert



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                        TEIL 3: DESIGN SYSTEM                               ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 3.1 Farbpalette

### Primary - Cyan
cyan-50:  #ecfeff
cyan-100: #cffafe
cyan-200: #a5f3fc
cyan-300: #67e8f9
cyan-400: #22d3ee
cyan-500: #06b6d4  ← PRIMARY (Buttons, Links, Active States)
cyan-600: #0891b2
cyan-700: #0e7490
cyan-800: #155e75
cyan-900: #164e63

### Secondary - Blue
blue-500: #3b82f6  ← SECONDARY (Gradients, Accents)

### Neutral - Slate (Dark Theme)
slate-50:  #f8fafc  (Text auf dunklem BG)
slate-100: #f1f5f9
slate-200: #e2e8f0  (Heller Text)
slate-300: #cbd5e1  (Body Text)
slate-400: #94a3b8  (Muted Text)
slate-500: #64748b  (Placeholder)
slate-600: #475569
slate-700: #334155  (Borders)
slate-800: #1e293b  (Card Background)
slate-900: #0f172a  (App Background)
slate-950: #020617  (Darkest)

### Semantic Colors
success: #22c55e (green-500)
warning: #f59e0b (amber-500)
error:   #ef4444 (red-500)
info:    #06b6d4 (cyan-500)

### Arena Mode Gradients
auto-select:    from-amber-500 to-orange-600
collaborative:  from-blue-500 to-cyan-500
divide-conquer: from-purple-500 to-pink-500
project:        from-green-500 to-emerald-500
tester:         from-red-500 to-rose-500


## 3.2 Typografie

### Font Families
Sans:  Inter, system-ui, sans-serif
Mono:  JetBrains Mono, Consolas, monospace

### Font Sizes
text-xs:   12px / 16px line-height
text-sm:   14px / 20px line-height
text-base: 16px / 24px line-height
text-lg:   18px / 28px line-height
text-xl:   20px / 28px line-height
text-2xl:  24px / 32px line-height
text-3xl:  30px / 36px line-height
text-4xl:  36px / 40px line-height

### Usage
H1 (Page Title):  text-4xl font-bold text-white
H2 (Section):     text-2xl font-semibold text-white
H3 (Card Title):  text-lg font-semibold text-slate-200
Body:             text-base text-slate-300
Small:            text-sm text-slate-400
Caption:          text-xs text-slate-500 tracking-wide uppercase
Code:             font-mono text-sm text-cyan-400


## 3.3 Spacing (4px Grid)

0.5: 2px
1:   4px
2:   8px
3:   12px
4:   16px
5:   20px
6:   24px
8:   32px
10:  40px
12:  48px
16:  64px

### Semantic Spacing
Page Padding:     p-6 (24px)
Section Gap:      gap-8 (32px)
Card Padding:     p-4 (16px)
Input Padding:    px-3 py-2 (12px / 8px)
Button Padding:   px-4 py-2 (16px / 8px)
List Gap:         gap-2 (8px)
Stack Gap:        gap-4 (16px)


## 3.4 Border Radius

rounded-sm:   4px   (Small elements)
rounded-md:   6px   (Buttons, Inputs)
rounded-lg:   8px   (Cards)
rounded-xl:   12px  (Large cards)
rounded-2xl:  16px  (Modals)
rounded-full: 9999px (Pills, Avatars)


## 3.5 Shadows

shadow-sm:   0 1px 2px rgba(0,0,0,0.05)
shadow:      0 1px 3px rgba(0,0,0,0.1)
shadow-md:   0 4px 6px rgba(0,0,0,0.1)
shadow-lg:   0 10px 15px rgba(0,0,0,0.1)
shadow-xl:   0 20px 25px rgba(0,0,0,0.1)

### Glow Effects (Dark Mode)
shadow-glow-cyan: 0 0 20px rgba(6, 182, 212, 0.3)
shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.3)


## 3.6 Animation Timings

Micro:    75ms   (Hover states)
Fast:     150ms  (Buttons, toggles)
Normal:   200ms  (Transitions)
Medium:   300ms  (Modals, panels)
Slow:     500ms  (Page transitions)
Glacial:  1000ms (Background effects)

### Easing
ease-out:    Für eingehende Elemente
ease-in:     Für ausgehende Elemente
ease-in-out: Für Hover/Toggle



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                      TEIL 4: COMPONENT SPECS                               ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 4.1 Button Component

```tsx
// components/ui/Button.tsx

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center gap-2 rounded-md font-medium 
   transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
   focus-visible:ring-cyan-500 focus-visible:ring-offset-2 
   focus-visible:ring-offset-slate-900 disabled:pointer-events-none 
   disabled:opacity-50 active:scale-[0.98]`,
  {
    variants: {
      variant: {
        primary: `bg-gradient-to-r from-cyan-500 to-blue-500 text-white 
                  hover:opacity-90 shadow-lg shadow-cyan-500/25`,
        secondary: `border border-slate-700 bg-transparent text-slate-300 
                    hover:border-cyan-500 hover:text-white`,
        ghost: `bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white`,
        destructive: `bg-red-600 text-white hover:bg-red-700`,
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
```


## 4.2 Input Component

```tsx
// components/ui/Input.tsx

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            className={cn(
              `w-full rounded-md border bg-slate-900 px-3 py-2 text-white 
               placeholder:text-slate-500 transition-colors duration-200
               focus:border-cyan-500 focus:outline-none focus:ring-2 
               focus:ring-cyan-500/20`,
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-700',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-400">⚠️ {error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```


## 4.3 Card Component

```tsx
// components/ui/Card.tsx

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'gradient';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-slate-900 p-4',
        variant === 'default' && 'border-slate-800',
        variant === 'interactive' && 
          `border-slate-800 cursor-pointer transition-all duration-200 
           hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-lg`,
        variant === 'gradient' && 
          `border-transparent bg-gradient-to-r from-cyan-500/10 to-blue-500/10 
           ring-1 ring-inset ring-white/10`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-white', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-slate-300', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex items-center gap-2', className)} {...props} />;
}
```


## 4.4 Avatar Component

```tsx
// components/ui/Avatar.tsx

import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <div
      className={cn(
        `relative flex items-center justify-center rounded-full 
         bg-gradient-to-r from-cyan-500 to-blue-500 font-medium text-white`,
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || fallback}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}
```


## 4.5 Badge Component

```tsx
// components/ui/Badge.tsx

import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'cyan' | 'green' | 'amber' | 'red' | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-slate-700 text-slate-300',
        variant === 'cyan' && 'bg-cyan-500/10 text-cyan-400',
        variant === 'green' && 'bg-green-500/10 text-green-400',
        variant === 'amber' && 'bg-amber-500/10 text-amber-400',
        variant === 'red' && 'bg-red-500/10 text-red-400',
        variant === 'purple' && 'bg-purple-500/10 text-purple-400',
        className
      )}
      {...props}
    />
  );
}
```


## 4.6 Switch Component

```tsx
// components/ui/Switch.tsx

import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Switch({ checked, onCheckedChange, disabled, size = 'md' }: SwitchProps) {
  const sizes = {
    sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
    md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: 'translate-x-7' },
  };

  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        `relative inline-flex shrink-0 cursor-pointer rounded-full 
         transition-colors duration-200 focus-visible:outline-none 
         focus-visible:ring-2 focus-visible:ring-cyan-500`,
        sizes[size].track,
        checked ? 'bg-cyan-500' : 'bg-slate-700',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          `pointer-events-none inline-block rounded-full bg-white shadow-lg 
           ring-0 transition-transform duration-200`,
          sizes[size].thumb,
          checked ? sizes[size].translate : 'translate-x-0.5',
          'mt-0.5 ml-0.5'
        )}
      />
    </button>
  );
}
```


## 4.7 Skeleton Component

```tsx
// components/ui/Skeleton.tsx

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-slate-800',
        className
      )}
      {...props}
    />
  );
}

// Preset Skeletons
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn('h-4', i === lines - 1 && 'w-3/4')} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
```


## 4.8 Modal Component

```tsx
// components/ui/Modal.tsx

import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                `w-full rounded-2xl border border-slate-800 bg-slate-900 
                 shadow-2xl`,
                sizes[size]
              )}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
```


## 4.9 Tooltip Component

```tsx
// components/ui/Tooltip.tsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn(
              `absolute z-50 whitespace-nowrap rounded-md bg-slate-800 
               px-2 py-1 text-sm text-white shadow-lg`,
              positions[side]
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                      TEIL 5: CHAT COMPONENTS                               ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 5.1 Message Bubble

```tsx
// components/chat/MessageBubble.tsx

import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onFeedback?: (type: 'up' | 'down') => void;
}

export const MessageBubble = memo<MessageBubbleProps>(({
  message,
  onRegenerate,
  onFeedback,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 px-4 py-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <Avatar
        src={isUser ? undefined : `/models/${message.modelId}.svg`}
        fallback={isUser ? 'Du' : message.modelName?.[0] || 'AI'}
        size="sm"
        className="flex-shrink-0"
      />

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-cyan-600 text-white rounded-br-sm'
            : 'bg-slate-800 border border-slate-700 rounded-bl-sm'
        )}
      >
        {/* Model Badge (nur für AI) */}
        {!isUser && message.modelName && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-cyan-400">
              {message.modelName}
            </span>
            {message.mode && (
              <Badge variant="cyan">{message.mode}</Badge>
            )}
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-chat">
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const code = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    return (
                      <div className="relative group my-3">
                        <div className="absolute top-2 right-2 flex items-center gap-2 
                                        opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-slate-500">{match[1]}</span>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="p-1 rounded hover:bg-slate-700"
                          >
                            <Copy className="h-3 w-3 text-slate-400" />
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg !bg-slate-900 !mt-0"
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  return (
                    <code className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 text-sm">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Actions (nur für AI) */}
        {!isUser && (
          <div className="mt-3 flex items-center gap-3 border-t border-slate-700 pt-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-400 
                         hover:text-white transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Kopiert!' : 'Kopieren'}
            </button>
            
            <button
              onClick={() => onFeedback?.('up')}
              className="p-1 text-slate-400 hover:text-green-400 transition-colors"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            
            <button
              onClick={() => onFeedback?.('down')}
              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-xs text-slate-400 
                         hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Neu generieren
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
```


## 5.2 Chat Input

```tsx
// components/chat/ChatInput.tsx

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Mic, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onAttach, isLoading, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-4">
      <div className="relative flex items-end gap-2 rounded-xl border border-slate-700 
                      bg-slate-800 p-2 focus-within:border-cyan-500">
        {/* Attach Button */}
        <button
          onClick={onAttach}
          className="flex-shrink-0 rounded-lg p-2 text-slate-400 
                     hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder || 'Schreibe eine Nachricht...'}
          rows={1}
          className="flex-1 resize-none bg-transparent text-white 
                     placeholder:text-slate-500 focus:outline-none"
          style={{ maxHeight: '200px' }}
        />

        {/* Voice Button */}
        <button
          className="flex-shrink-0 rounded-lg p-2 text-slate-400 
                     hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Mic className="h-5 w-5" />
        </button>

        {/* Send Button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className={cn(
            'flex-shrink-0',
            !value.trim() && 'opacity-50'
          )}
        >
          {isLoading ? (
            <Sparkles className="h-5 w-5 animate-pulse" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Hint */}
      <p className="mt-2 text-center text-xs text-slate-500">
        Enter zum Senden • Shift+Enter für neue Zeile
      </p>
    </div>
  );
}
```


## 5.3 Typing Indicator

```tsx
// components/chat/TypingIndicator.tsx

import { Avatar } from '../ui/Avatar';

interface TypingIndicatorProps {
  modelName?: string;
}

export function TypingIndicator({ modelName = 'AI' }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <Avatar fallback={modelName[0]} size="sm" />
      
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm 
                      bg-slate-800 border border-slate-700 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-typing-dot" />
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-typing-dot" 
              style={{ animationDelay: '0.2s' }} />
        <span className="h-2 w-2 rounded-full bg-slate-400 animate-typing-dot" 
              style={{ animationDelay: '0.4s' }} />
      </div>
      
      <span className="text-sm text-slate-500">{modelName} schreibt...</span>
    </div>
  );
}
```



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                      TEIL 6: ARENA COMPONENTS                              ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 6.1 Mode Selector

```tsx
// components/arena/ModeSelector.tsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Users, GitBranch, FolderKanban, TestTube2,
  Check, ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArenaMode } from '@/types';

const modes = [
  {
    id: 'auto-select' as ArenaMode,
    name: 'Auto-Select',
    description: 'Arena wählt das beste Modell',
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'collaborative' as ArenaMode,
    name: 'Collaborative',
    description: 'Modelle arbeiten zusammen',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'divide-conquer' as ArenaMode,
    name: 'Divide & Conquer',
    description: 'Aufgabe wird aufgeteilt',
    icon: GitBranch,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'project' as ArenaMode,
    name: 'Project Mode',
    description: 'Kollaborative Projektarbeit',
    icon: FolderKanban,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'tester' as ArenaMode,
    name: 'Tester Mode',
    description: 'Automatisierte Tests',
    icon: TestTube2,
    gradient: 'from-red-500 to-rose-500',
  },
];

interface ModeSelectorProps {
  value: ArenaMode;
  onChange: (mode: ArenaMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedMode = modes.find(m => m.id === value) || modes[0];
  const Icon = selectedMode.icon;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 
                   bg-slate-800 px-3 py-2 transition-colors hover:border-slate-600"
      >
        <div className={cn('rounded-md bg-gradient-to-r p-1.5', selectedMode.gradient)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white">{selectedMode.name}</span>
        <ChevronDown className={cn(
          'h-4 w-4 text-slate-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl 
                         border border-slate-700 bg-slate-900 p-2 shadow-2xl"
            >
              <div className="mb-2 px-2 py-1">
                <h3 className="text-sm font-semibold text-white">Arena Modus</h3>
              </div>
              
              {modes.map((mode) => {
                const ModeIcon = mode.icon;
                const isSelected = mode.id === value;
                
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onChange(mode.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg p-3 transition-colors',
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                    )}
                  >
                    <div className={cn('rounded-lg bg-gradient-to-r p-2', mode.gradient)}>
                      <ModeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{mode.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-cyan-400" />}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-400">{mode.description}</p>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```


## 6.2 Model Badge

```tsx
// components/arena/ModelBadge.tsx

import { cn } from '@/lib/utils';

interface ModelBadgeProps {
  modelId: string;
  modelName: string;
  size?: 'sm' | 'md';
}

const modelColors: Record<string, string> = {
  'claude': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'gpt': 'bg-green-500/10 text-green-400 border-green-500/20',
  'gemini': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'llama': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'mistral': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export function ModelBadge({ modelId, modelName, size = 'md' }: ModelBadgeProps) {
  const provider = modelId.split('/')[0] || modelId.split('-')[0];
  const colorClass = modelColors[provider.toLowerCase()] || 
                     'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {modelName}
    </span>
  );
}
```



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                        TEIL 7: LAYOUT COMPONENTS                           ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 7.1 Sidebar

```tsx
// components/layout/Sidebar.tsx

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, BookOpen, Users, FileText,
  HelpCircle, Settings, Plus, ChevronLeft, ChevronRight, Zap, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chats', href: '/chats', icon: MessageSquare },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { name: 'Prompts', href: '/prompts', icon: FileText },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Handbuch', href: '/handbook', icon: HelpCircle },
  { name: 'Einstellungen', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.2 }}
      className="flex h-screen flex-col border-r border-slate-800 bg-slate-900"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg 
                          bg-gradient-to-r from-cyan-500 to-blue-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-white whitespace-nowrap"
              >
                AI Arena
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Link to="/chat/new">
          <Button variant="primary" className={cn('w-full', collapsed && 'px-0')}>
            <Plus className="h-4 w-4" />
            {!collapsed && <span>Neuer Chat</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-cyan-400')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-800 p-3">
        <Link 
          to="/settings/profile"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800"
        >
          <Avatar fallback={user?.name || 'U'} size="sm" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.plan} Plan</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.aside>
  );
}
```



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                          TEIL 8: PAGES                                     ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 8.1 Login Page

```tsx
// pages/auth/LoginPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success('Willkommen zurück!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login fehlgeschlagen', 'Bitte prüfe deine Anmeldedaten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 
                        -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center 
                          rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Arena</h1>
          <p className="mt-2 text-slate-400">Willkommen zurück!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="E-Mail"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Passwort"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-cyan-400 hover:underline">
              Passwort vergessen?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Anmelden
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-sm text-slate-500">oder</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <Button variant="secondary" className="w-full">
            Mit GitHub anmelden
          </Button>
          <Button variant="secondary" className="w-full">
            Mit Google anmelden
          </Button>
        </div>

        {/* Register Link */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
```


## 8.2 Dashboard Page

```tsx
// pages/DashboardPage.tsx

import { Link } from 'react-router-dom';
import { 
  MessageSquare, FileText, BookOpen, DollarSign,
  TrendingUp, Plus, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const stats = [
  { name: 'Chats', value: '127', change: '+12%', icon: MessageSquare, color: 'cyan' },
  { name: 'Nachrichten', value: '1,842', change: '+8%', icon: FileText, color: 'blue' },
  { name: 'KB Einträge', value: '456', change: '+24', icon: BookOpen, color: 'green' },
  { name: 'Kosten', value: '$12.50', change: 'diesen Monat', icon: DollarSign, color: 'amber' },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Willkommen zurück, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="mt-1 text-slate-400">Hier ist dein Überblick für heute</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.name}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
                <div className={`rounded-lg bg-${stat.color}-500/10 p-3`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                </div>
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full 
                            bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600`} />
          </Card>
        ))}
      </div>

      {/* New Chat CTA */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Bereit für einen neuen Chat?
            </h2>
            <p className="mt-1 text-slate-400">
              Starte eine Konversation mit der AI Arena
            </p>
          </div>
          <Link to="/chat/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Neuer Chat
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Chats Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Letzte Chats</h2>
          <Link to="/chats" className="flex items-center gap-1 text-sm text-cyan-400 hover:underline">
            Alle anzeigen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Chat List hier */}
      </div>
    </div>
  );
}
```



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                         TEIL 9: HOOKS                                      ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## 9.1 useChat Hook

```tsx
// hooks/useChat.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import type { Chat, Message, ArenaMode } from '@/types';

interface UseChatOptions {
  chatId?: string;
}

export function useChat({ chatId }: UseChatOptions = {}) {
  const queryClient = useQueryClient();
  const { subscribe, sendMessage: wsSend } = useWebSocket();
  const [isTyping, setIsTyping] = useState(false);

  // Fetch Chat
  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.get(`/chats/${chatId}`).then(r => r.data),
    enabled: !!chatId,
  });

  // Send Message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/chats/${chatId}/messages`, { content });
      return response.data;
    },
    onMutate: async (content) => {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: chatId!,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['chat', chatId], (old: Chat) => ({
        ...old,
        messages: [...old.messages, optimisticMessage],
      }));
    },
  });

  // Subscribe to real-time updates
  const subscribeToChat = useCallback(() => {
    if (!chatId) return () => {};

    const unsubMessage = subscribe('message:new', (message: Message) => {
      if (message.chatId === chatId) {
        queryClient.setQueryData(['chat', chatId], (old: Chat) => ({
          ...old,
          messages: [...old.messages, message],
        }));
      }
    });

    const unsubTyping = subscribe('typing:start', ({ chatId: cId }) => {
      if (cId === chatId) setIsTyping(true);
    });

    const unsubTypingStop = subscribe('typing:stop', ({ chatId: cId }) => {
      if (cId === chatId) setIsTyping(false);
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubTypingStop();
    };
  }, [chatId, subscribe, queryClient]);

  return {
    chat,
    messages: chat?.messages || [],
    isLoading,
    isTyping,
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
    subscribeToChat,
  };
}
```


## 9.2 useArena Hook

```tsx
// hooks/useArena.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import type { ArenaMode, Model } from '@/types';

export function useArena() {
  // Fetch available models
  const { data: models = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['models'],
    queryFn: () => api.get('/models').then(r => r.data.models),
  });

  // Create new chat
  const createChatMutation = useMutation({
    mutationFn: async (params: { mode: ArenaMode; modelIds?: string[] }) => {
      const response = await api.post('/chats', params);
      return response.data;
    },
  });

  // Change mode
  const changeModeMutation = useMutation({
    mutationFn: async ({ chatId, mode }: { chatId: string; mode: ArenaMode }) => {
      const response = await api.put(`/chats/${chatId}/mode`, { mode });
      return response.data;
    },
  });

  return {
    models,
    isLoadingModels,
    createChat: createChatMutation.mutateAsync,
    isCreating: createChatMutation.isPending,
    changeMode: changeModeMutation.mutate,
    isChangingMode: changeModeMutation.isPending,
  };
}
```


## 9.3 useMemory Hook

```tsx
// hooks/useMemory.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

export function useMemory() {
  const queryClient = useQueryClient();

  // Fetch memories
  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: () => api.get('/memory').then(r => r.data.memories),
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['memorySettings'],
    queryFn: () => api.get('/memory/settings').then(r => r.data.settings),
  });

  // Search memories (semantic)
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await api.post('/memory/recall', { query, limit: 20 });
      return response.data.memories;
    },
  });

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: (updates: any) => api.put('/memory/settings', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorySettings'] });
    },
  });

  // Delete memory
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/memory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  // Delete all
  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete('/memory/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  return {
    memories,
    settings,
    isLoading,
    search: searchMutation.mutateAsync,
    isSearching: searchMutation.isPending,
    updateSettings: updateSettingsMutation.mutate,
    deleteMemory: deleteMutation.mutate,
    deleteAll: deleteAllMutation.mutate,
  };
}
```



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                     TEIL 10: EXISTIERENDE MODULE                           ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

Die folgenden Module existieren bereits und können direkt verwendet werden:

## Contexts (in contexts/)

### AuthContext
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
```

### ThemeContext  
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { theme, setTheme, resolvedTheme } = useTheme();
// theme: 'dark' | 'light' | 'system'
```

### ToastContext
```typescript
import { useToast } from '@/contexts/ToastContext';

const toast = useToast();
toast.success('Titel', 'Nachricht');
toast.error('Titel', 'Nachricht');
toast.warning('Titel', 'Nachricht');
toast.info('Titel', 'Nachricht');
```

### WebSocketContext
```typescript
import { useWebSocket } from '@/contexts/WebSocketContext';

const { isConnected, sendMessage, subscribe } = useWebSocket();

// Subscribe to events
useEffect(() => {
  const unsub = subscribe('message:new', (data) => {
    console.log('New message:', data);
  });
  return unsub;
}, []);
```


## Utils (in lib/utils.ts)

```typescript
import { 
  cn,                    // Tailwind class merge
  formatRelativeTime,    // "vor 5 Min"
  formatDate,            // "23. Dezember 2024"
  formatTime,            // "14:30"
  truncate,              // Text kürzen
  getInitials,           // "Max Muster" → "MM"
  capitalize,            // "hello" → "Hello"
  formatNumber,          // 1500 → "1.5K"
  formatCurrency,        // 12.50 → "$12.50"
  formatBytes,           // 1048576 → "1 MB"
  debounce,              // Verzögerte Ausführung
  throttle,              // Limitierte Ausführung
  copyToClipboard,       // In Zwischenablage kopieren
  generateId,            // Random ID
  uuid,                  // UUID v4
} from '@/lib/utils';
```


## Types (in types/index.ts)

```typescript
import type {
  User,
  Chat,
  Message,
  ArenaMode,          // 'auto-select' | 'collaborative' | ...
  Model,
  KnowledgeEntry,
  Memory,
  Team,
  Prompt,
  ApiResponse,
  WebSocketEvent,
} from '@/types';
```



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                    TEIL 11: IMPLEMENTIERUNGS-PLAN                          ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## Phase 1: UI Components (Tag 1-3)

□ Button.tsx (4 Varianten, 4 Sizes, Loading State)
□ Input.tsx (Label, Error, Icons)
□ Card.tsx (3 Varianten)
□ Avatar.tsx (mit Fallback)
□ Badge.tsx (6 Farben)
□ Switch.tsx (3 Sizes)
□ Skeleton.tsx (Loading States)
□ Modal.tsx (mit Animation)
□ Tooltip.tsx
□ Dropdown.tsx
□ Tabs.tsx
□ index.ts (Barrel Export)


## Phase 2: Chat Components (Tag 4-5)

□ MessageBubble.tsx (Markdown, Code Highlighting, Actions)
□ ChatInput.tsx (Textarea, Attachments, Voice Button)
□ TypingIndicator.tsx (Animierte Dots)
□ CodeBlock.tsx (Syntax Highlighting, Copy)
□ MessageActions.tsx (Copy, Like, Regenerate)


## Phase 3: Arena Components (Tag 6)

□ ModeSelector.tsx (Dropdown mit Icons)
□ ModelBadge.tsx (Provider-Farben)
□ ModelSelector.tsx (Multi-Select)
□ ProgressIndicator.tsx (für lange Tasks)


## Phase 4: Layout Components (Tag 7-8)

□ Sidebar.tsx (Collapsible, Navigation)
□ Header.tsx (mit Search)
□ MainLayout.tsx (Sidebar + Content)
□ MobileNav.tsx (Bottom Tab Bar)


## Phase 5: Hooks (Tag 9)

□ useChat.ts
□ useArena.ts
□ useMemory.ts
□ useMediaQuery.ts


## Phase 6: Pages (Tag 10-14)

□ LoginPage.tsx
□ RegisterPage.tsx
□ DashboardPage.tsx
□ ChatPage.tsx (erweitern)
□ ChatListPage.tsx
□ KnowledgeBasePage.tsx
□ TeamsPage.tsx
□ PromptsPage.tsx
□ SettingsPage.tsx
□ MemorySettingsPage.tsx


## Phase 7: Polish (Tag 15-16)

□ Alle Animationen testen
□ Loading States überall
□ Error States überall
□ Empty States überall
□ Responsive Testing (Mobile, Tablet, Desktop)
□ Accessibility Check (ARIA Labels, Keyboard Nav)
□ Dark/Light Mode testen



# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║                        TEIL 12: CHECKLISTE                                 ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

## Design System ✓
- [ ] Tailwind Config vollständig
- [ ] Alle Farben definiert
- [ ] Typography Scale
- [ ] Spacing Scale  
- [ ] Border Radius
- [ ] Shadows + Glows
- [ ] Animations definiert

## UI Components ✓
- [ ] Button (alle Varianten)
- [ ] Input (mit Error State)
- [ ] Card (alle Varianten)
- [ ] Avatar
- [ ] Badge
- [ ] Switch
- [ ] Modal
- [ ] Dropdown
- [ ] Tooltip
- [ ] Tabs
- [ ] Skeleton

## Chat Components ✓
- [ ] MessageBubble
- [ ] ChatInput
- [ ] TypingIndicator
- [ ] CodeBlock
- [ ] MessageActions

## Arena Components ✓
- [ ] ModeSelector
- [ ] ModelBadge
- [ ] ModelSelector

## Layout ✓
- [ ] Sidebar (collapse funktioniert)
- [ ] Header
- [ ] MainLayout
- [ ] Mobile Navigation

## Hooks ✓
- [ ] useChat
- [ ] useArena
- [ ] useMemory
- [ ] useMediaQuery

## Pages ✓
- [ ] Login
- [ ] Register
- [ ] Dashboard
- [ ] Chat
- [ ] Chat List
- [ ] Knowledge Base
- [ ] Teams
- [ ] Prompts
- [ ] Settings
- [ ] Memory Settings

## Quality ✓
- [ ] Responsive (320px - 1536px)
- [ ] Dark Mode
- [ ] Alle Hover States
- [ ] Alle Focus States
- [ ] Loading States
- [ ] Error States
- [ ] Empty States
- [ ] Accessibility



# ══════════════════════════════════════════════════════════════════════════════
#                              ENDE DER ANLEITUNG
# ══════════════════════════════════════════════════════════════════════════════
#
# Bei Fragen:
# - Design System Details: /docs/DESIGN_UX_GUIDE.md
# - Memory System: /docs/MEMORY_SYSTEM_GUIDE.md
# - Backend API: /docs/PROJECT_DOCUMENTATION.md
# - Mobile App: /docs/MOBILE_APP_SPECIFICATION.md
#
# Viel Erfolg bei der Implementierung! 🚀
#
# ══════════════════════════════════════════════════════════════════════════════
