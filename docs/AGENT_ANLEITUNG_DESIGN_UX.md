# 🎨 AI Arena - Design & UX Agent Anleitung

## Vollständige Arbeitsanweisung für Frontend-Implementierung

---

## 📋 Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Deine Aufgaben](#2-deine-aufgaben)
3. [Tech Stack](#3-tech-stack)
4. [Design System](#4-design-system)
5. [Component Spezifikationen](#5-component-spezifikationen)
6. [Screen Layouts](#6-screen-layouts)
7. [Interaction Patterns](#7-interaction-patterns)
8. [Implementierungsreihenfolge](#8-implementierungsreihenfolge)
9. [Code Standards](#9-code-standards)
10. [Checkliste](#10-checkliste)

---

## 1. Projektübersicht

### Was ist AI Arena?

AI Arena ist eine Multi-Model KI-Chat-Plattform, die mehrere KI-Modelle (Claude, GPT-4, Gemini, etc.) orchestriert. Der User kann zwischen 5 Arena-Modi wählen:

| Modus | Beschreibung | Icon | Farbe |
|-------|--------------|------|-------|
| **Auto-Select** | Arena wählt das beste Modell | 🎯 | Orange→Red Gradient |
| **Collaborative** | Modelle arbeiten zusammen | 🤝 | Blue→Cyan Gradient |
| **Divide & Conquer** | Aufgabe wird aufgeteilt | ✂️ | Purple→Pink Gradient |
| **Project** | Kollaborative Projektarbeit | 📋 | Green Gradient |
| **Tester** | Automatisierte Tests | 🧪 | Red Gradient |

### Zielgruppe
- Entwickler und Tech-Teams
- Power-User die KI produktiv nutzen
- Unternehmen mit Kollaborationsbedarf

### Design-Philosophie

```
"Mächtig, aber nicht kompliziert.
 Schön, aber nicht ablenkend.
 Intelligent, aber nicht bevormundend."
```

**Kernprinzipien:**
1. **Clarity First** - Jedes Element hat einen klaren Zweck
2. **Instant Feedback** - Sofortige visuelle Rückmeldung
3. **Cognitive Load Reduction** - Komplexität verstecken
4. **Fluid Experience** - Nahtlose Übergänge
5. **Predictability** - Konsistente Patterns

---

## 2. Deine Aufgaben

### Was du erstellen sollst:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELIVERABLES                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REACT COMPONENTS                                            │
│     □ Design System Components (Button, Input, Card, etc.)     │
│     □ Layout Components (Sidebar, Header, MainLayout)          │
│     □ Chat Components (MessageBubble, ChatInput, etc.)         │
│     □ Arena Components (ModeSelector, ModelBadge, etc.)        │
│     □ Navigation Components (TabBar, Breadcrumbs)              │
│                                                                 │
│  2. SCREENS/PAGES                                               │
│     □ LoginPage & RegisterPage                                 │
│     □ DashboardPage                                            │
│     □ ChatPage (bereits vorhanden - erweitern)                 │
│     □ ChatListPage                                             │
│     □ KnowledgeBasePage                                        │
│     □ TeamsPage                                                │
│     □ PromptsPage                                              │
│     □ SettingsPage                                             │
│                                                                 │
│  3. STYLING                                                     │
│     □ Tailwind Config mit Design Tokens                        │
│     □ Global Styles                                            │
│     □ Animation Classes                                        │
│     □ Dark/Light Theme                                         │
│                                                                 │
│  4. HOOKS & UTILS                                               │
│     □ useTheme                                                 │
│     □ useMediaQuery                                            │
│     □ useAnimation                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Verwendete Technologien

```yaml
Framework: React 18 mit TypeScript
Styling: Tailwind CSS 3.4
Icons: Lucide React
Animations: Framer Motion
State: TanStack Query + Zustand
Routing: React Router 6
Forms: React Hook Form + Zod
Markdown: react-markdown + Prism.js
```

### Projektstruktur

```
frontend/src/
├── components/
│   ├── ui/                    # Design System
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MainLayout.tsx
│   │   └── MobileNav.tsx
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── CodeBlock.tsx
│   │   └── MessageActions.tsx
│   ├── arena/
│   │   ├── ModeSelector.tsx
│   │   ├── ModelBadge.tsx
│   │   ├── ModelSelector.tsx
│   │   └── ProgressIndicator.tsx
│   └── knowledge/
│       ├── KnowledgeCard.tsx
│       └── StatusBadge.tsx
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
│   └── SettingsPage.tsx
├── hooks/
│   ├── useTheme.ts
│   ├── useMediaQuery.ts
│   └── useToast.ts
├── styles/
│   ├── globals.css
│   └── animations.css
├── lib/
│   └── utils.ts
└── types/
    └── index.ts
```

---

## 4. Design System

### 4.1 Farbpalette

```typescript
// tailwind.config.js erweitern

const colors = {
  // PRIMARY - Cyan
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',  // ← Primary
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  
  // SECONDARY - Blue
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // ← Secondary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // NEUTRAL - Slate (Dark Theme Base)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',  // ← Card Background
    900: '#0f172a',  // ← App Background
    950: '#020617',  // ← Darkest
  },
  
  // SEMANTIC
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

// ARENA MODE COLORS (als Gradients)
const arenaModes = {
  'auto-select': 'linear-gradient(135deg, #f59e0b, #ea580c)',
  'collaborative': 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'divide-conquer': 'linear-gradient(135deg, #a855f7, #ec4899)',
  'project': 'linear-gradient(135deg, #22c55e, #10b981)',
  'tester': 'linear-gradient(135deg, #ef4444, #f43f5e)',
};
```

### 4.2 Typografie

```css
/* Fonts laden in index.html oder globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

```typescript
// Typography Scale
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  },
};

// Usage Guidelines:
// H1 (Page Title):    text-4xl font-bold text-white
// H2 (Section):       text-2xl font-semibold text-white
// H3 (Card Title):    text-lg font-semibold text-slate-200
// Body:               text-base text-slate-300
// Small:              text-sm text-slate-400
// Caption:            text-xs text-slate-500 tracking-wide
// Code:               font-mono text-sm text-cyan-400
```

### 4.3 Spacing

```typescript
// 4px Grid System
const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
};

// Semantic Spacing:
// Page Padding:      p-6 (24px)
// Section Gap:       gap-8 (32px)
// Card Padding:      p-4 (16px)
// Input Padding:     px-3 py-2 (12px / 8px)
// Button Padding:    px-4 py-2 (16px / 8px)
// List Gap:          gap-2 (8px)
```

### 4.4 Border Radius

```typescript
const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px - Small elements
  DEFAULT: '0.375rem', // 6px - Buttons, Inputs
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px - Cards
  xl: '0.75rem',    // 12px - Large cards
  '2xl': '1rem',    // 16px - Modals
  '3xl': '1.5rem',  // 24px - Hero elements
  full: '9999px',   // Pills, Avatars
};

// Usage:
// Buttons:      rounded-md
// Inputs:       rounded-md
// Cards:        rounded-lg
// Modals:       rounded-2xl
// Avatars:      rounded-full
// Badges:       rounded-full
```

### 4.5 Shadows

```typescript
const boxShadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Glow Effects (für Dark Mode)
  'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
  'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
};
```

---

## 5. Component Spezifikationen

### 5.1 Button Component

```tsx
// components/ui/Button.tsx

import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-cyan-500/25',
        secondary: 'border border-slate-700 bg-transparent text-slate-300 hover:border-cyan-500 hover:text-white',
        ghost: 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
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
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 5.2 Input Component

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
              'w-full rounded-md border bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500',
              'transition-colors duration-200',
              'focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
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
          <p className="mt-1.5 flex items-center gap-1 text-sm text-red-400">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### 5.3 Card Component

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
        variant === 'interactive' && 'border-slate-800 cursor-pointer transition-all duration-200 hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-lg',
        variant === 'gradient' && 'border-transparent bg-gradient-to-r from-cyan-500/10 to-blue-500/10 ring-1 ring-inset ring-white/10',
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

### 5.4 Message Bubble Component

```tsx
// components/chat/MessageBubble.tsx

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '../ui/Avatar';
import { ModelBadge } from '../arena/ModelBadge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelId?: string;
  modelName?: string;
  mode?: string;
  processingTime?: number;
  timestamp: Date;
}

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
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-2',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <Avatar
        src={isUser ? undefined : `/models/${message.modelId}.svg`}
        fallback={isUser ? 'U' : message.modelName?.[0] || 'A'}
        className="h-8 w-8 flex-shrink-0"
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
        {/* Header (nur für AI) */}
        {!isUser && message.modelName && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-cyan-400">
              {message.modelName}
            </span>
            {message.mode && <ModelBadge mode={message.mode} size="sm" />}
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="relative group">
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-slate-500">{match[1]}</span>
                        <button
                          onClick={handleCopy}
                          className="p-1 rounded hover:bg-slate-700"
                        >
                          {copied ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg !bg-slate-900 !mt-0"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400" {...props}>
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
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
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
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Neu generieren
            </button>
            {message.processingTime && (
              <span className="ml-auto text-xs text-slate-500">
                {(message.processingTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
```

### 5.5 Arena Mode Selector

```tsx
// components/arena/ModeSelector.tsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Users, 
  GitBranch, 
  FolderKanban, 
  TestTube2,
  Check,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const modes = [
  {
    id: 'auto-select',
    name: 'Auto-Select',
    description: 'Arena wählt das beste Modell für deine Aufgabe',
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'collaborative',
    name: 'Collaborative',
    description: 'Mehrere Modelle arbeiten zusammen und synthetisieren',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'divide-conquer',
    name: 'Divide & Conquer',
    description: 'Aufgabe wird aufgeteilt und von Spezialisten bearbeitet',
    icon: GitBranch,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'project',
    name: 'Project Mode',
    description: 'Kollaborative Planung, Ausführung und Review',
    icon: FolderKanban,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'tester',
    name: 'Tester Mode',
    description: 'Automatisierte Tests mit Cross-Verification',
    icon: TestTube2,
    gradient: 'from-red-500 to-rose-500',
  },
];

interface ModeSelectorProps {
  value: string;
  onChange: (mode: string) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedMode = modes.find(m => m.id === value) || modes[0];
  const Icon = selectedMode.icon;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2',
          'transition-colors hover:border-slate-600'
        )}
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
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
            >
              <div className="mb-2 px-2 py-1">
                <h3 className="text-sm font-semibold text-white">Arena Modus wählen</h3>
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
                      isSelected 
                        ? 'bg-slate-800' 
                        : 'hover:bg-slate-800/50'
                    )}
                  >
                    <div className={cn(
                      'rounded-lg bg-gradient-to-r p-2',
                      mode.gradient
                    )}>
                      <ModeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{mode.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-cyan-400" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {mode.description}
                      </p>
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

### 5.6 Sidebar Component

```tsx
// components/layout/Sidebar.tsx

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Users,
  FileText,
  HelpCircle,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chats', href: '/chats', icon: MessageSquare },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { name: 'Prompts', href: '/prompts', icon: FileText },
  { name: 'Handbuch', href: '/handbook', icon: HelpCircle },
  { name: 'Einstellungen', href: '/settings', icon: Settings },
];

interface SidebarProps {
  recentChats?: Array<{ id: string; title: string }>;
}

export function Sidebar({ recentChats = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.2 }}
      className="flex h-screen flex-col border-r border-slate-800 bg-slate-900"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
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
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          variant="primary"
          className={cn('w-full', collapsed && 'px-0')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {!collapsed && 'Neuer Chat'}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
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
              <item.icon className={cn('h-5 w-5', isActive && 'text-cyan-400')} />
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
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Recent Chats */}
      <AnimatePresence>
        {!collapsed && recentChats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-800 px-3 py-4"
          >
            <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Letzte Chats
            </h4>
            <div className="space-y-1">
              {recentChats.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{chat.title}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Section */}
      <div className="border-t border-slate-800 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-sm font-medium text-white">
            M
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-left"
              >
                <p className="text-sm font-medium text-white">Max Mustermann</p>
                <p className="text-xs text-slate-400">Pro Plan</p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
```

---

## 6. Screen Layouts

### 6.1 Login Page

```tsx
// pages/auth/LoginPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Ungültige Anmeldedaten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Arena</h1>
          <p className="mt-2 text-slate-400">Willkommen zurück!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-white"
              >
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
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Mit GitHub anmelden
          </Button>
          
          <Button variant="secondary" className="w-full">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
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

### 6.2 Dashboard Page

```tsx
// pages/DashboardPage.tsx

import { 
  MessageSquare, 
  FileText, 
  BookOpen, 
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const stats = [
  { name: 'Chats', value: '127', change: '+12%', icon: MessageSquare, color: 'cyan' },
  { name: 'Nachrichten', value: '1,842', change: '+8%', icon: FileText, color: 'blue' },
  { name: 'KB Einträge', value: '456', change: '+24', icon: BookOpen, color: 'green' },
  { name: 'Kosten', value: '$12.50', change: 'diesen Monat', icon: DollarSign, color: 'amber' },
];

const recentChats = [
  { id: '1', title: 'API Integration', model: 'Claude 3.5 Sonnet', mode: 'Auto-Select', time: 'vor 5 Min' },
  { id: '2', title: 'Code Review', model: 'GPT-4o', mode: 'Collaborative', time: 'vor 2 Std' },
  { id: '3', title: 'Dokumentation', model: 'Gemini 1.5 Pro', mode: 'Divide & Conquer', time: 'gestern' },
];

export function DashboardPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Willkommen zurück, Max! 👋</h1>
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
            {/* Gradient Border Bottom */}
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600`} />
          </Card>
        ))}
      </div>

      {/* New Chat CTA */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Bereit für einen neuen Chat?</h2>
            <p className="mt-1 text-slate-400">Starte eine Konversation mit der AI Arena</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Neuer Chat
          </Button>
        </CardContent>
      </Card>

      {/* Recent Chats */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Letzte Chats</h2>
          <Link to="/chats" className="flex items-center gap-1 text-sm text-cyan-400 hover:underline">
            Alle anzeigen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentChats.map((chat) => (
            <Link key={chat.id} to={`/chat/${chat.id}`}>
              <Card variant="interactive">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                    <MessageSquare className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{chat.title}</h3>
                    <p className="text-sm text-slate-400">
                      {chat.model} • {chat.mode}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">{chat.time}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Interaction Patterns

### 7.1 Hover States

```css
/* Alle interaktiven Elemente */
.interactive {
  @apply transition-all duration-200;
}

/* Buttons */
.btn-hover {
  @apply hover:opacity-90 active:scale-[0.98];
}

/* Cards */
.card-hover {
  @apply hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-lg;
}

/* Links */
.link-hover {
  @apply hover:text-cyan-400 hover:underline;
}

/* Icons */
.icon-hover {
  @apply hover:text-white hover:scale-110;
}
```

### 7.2 Focus States

```css
/* Keyboard Focus Ring */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900;
}
```

### 7.3 Loading States

```tsx
// Skeleton Loader
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-slate-800', className)} />
  );
}

// Usage
<Skeleton className="h-4 w-32" />  // Text
<Skeleton className="h-10 w-full" /> // Input
<Skeleton className="h-32 w-full" /> // Card
```

### 7.4 Animations

```css
/* globals.css */

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
  50% { box-shadow: 0 0 20px 10px rgba(6, 182, 212, 0); }
}

.animate-fade-in { animation: fade-in 0.2s ease-out; }
.animate-slide-up { animation: slide-up 0.3s ease-out; }
.animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
.animate-pulse-glow { animation: pulse-glow 2s infinite; }
```

---

## 8. Implementierungsreihenfolge

### Phase 1: Foundation (Tag 1-2)

```
□ Tailwind Config mit allen Design Tokens
□ globals.css mit Base Styles
□ lib/utils.ts mit cn() Helper
□ types/index.ts mit TypeScript Types
```

### Phase 2: UI Components (Tag 3-5)

```
□ Button (alle Varianten)
□ Input (mit Label, Error, Icons)
□ Card (alle Varianten)
□ Avatar
□ Badge
□ Tooltip
□ Modal
□ Dropdown
□ Toast System
```

### Phase 3: Layout Components (Tag 6-7)

```
□ Sidebar (collapsed/expanded)
□ Header mit Search
□ MainLayout
□ MobileNav (responsive)
```

### Phase 4: Feature Components (Tag 8-10)

```
□ MessageBubble mit Markdown
□ ChatInput mit Attachments
□ TypingIndicator
□ CodeBlock mit Syntax Highlighting
□ ModeSelector
□ ModelBadge
□ ModelSelector
□ ProgressIndicator
```

### Phase 5: Pages (Tag 11-14)

```
□ LoginPage
□ RegisterPage
□ DashboardPage
□ ChatPage (erweitern)
□ ChatListPage
□ KnowledgeBasePage
□ TeamsPage
□ PromptsPage
□ SettingsPage
```

### Phase 6: Polish (Tag 15-16)

```
□ Alle Animationen
□ Loading States
□ Error States
□ Empty States
□ Responsive Testing
□ Accessibility Check
```

---

## 9. Code Standards

### Naming Conventions

```typescript
// Components: PascalCase
Button.tsx, MessageBubble.tsx

// Hooks: camelCase mit use-Prefix
useTheme.ts, useMediaQuery.ts

// Utils: camelCase
formatDate.ts, cn.ts

// Types: PascalCase mit Interface/Type Suffix
interface ButtonProps {}
type ArenaMode = 'auto-select' | 'collaborative' | ...

// CSS Classes: kebab-case
.message-bubble, .arena-mode-selector
```

### Component Structure

```tsx
// Standard Component Template
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// 1. Types
interface ComponentProps {
  // props
}

// 2. Component
export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    // 3. Hooks
    
    // 4. Handlers
    
    // 5. Render
    return (
      <div ref={ref} className={cn('base-classes', className)} {...props}>
        {/* content */}
      </div>
    );
  }
);

// 6. Display Name
Component.displayName = 'Component';
```

### File Organization

```
// Jede Component in eigenem File
// Index.ts für Exports

components/ui/
├── Button.tsx
├── Input.tsx
├── Card.tsx
└── index.ts  // export { Button } from './Button'; ...
```

---

## 10. Checkliste

### Design System ✓

- [ ] Tailwind Config vollständig
- [ ] Alle Farben definiert
- [ ] Typography Scale
- [ ] Spacing Scale
- [ ] Border Radius
- [ ] Shadows
- [ ] Animations

### Components ✓

- [ ] Button (4 Varianten, 4 Sizes)
- [ ] Input (mit Error State)
- [ ] Card (3 Varianten)
- [ ] Avatar
- [ ] Badge
- [ ] Modal
- [ ] Dropdown
- [ ] Tooltip
- [ ] Toast

### Layout ✓

- [ ] Sidebar (collapse funktioniert)
- [ ] Header
- [ ] MainLayout
- [ ] Mobile Navigation

### Pages ✓

- [ ] Login
- [ ] Register
- [ ] Dashboard
- [ ] Chat
- [ ] Chat List
- [ ] Knowledge Base
- [ ] Teams
- [ ] Prompts
- [ ] Settings

### Quality ✓

- [ ] Responsive (Mobile, Tablet, Desktop)
- [ ] Dark Mode funktioniert
- [ ] Alle Hover States
- [ ] Alle Focus States
- [ ] Loading States
- [ ] Error States
- [ ] Empty States
- [ ] Accessibility (ARIA Labels)

---

## Referenzen

- **Design Guide:** `/docs/DESIGN_UX_GUIDE.md`
- **Mobile Spec:** `/docs/MOBILE_APP_SPECIFICATION.md`
- **Projekt Docs:** `/docs/PROJECT_DOCUMENTATION.md`
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/icons
- **Framer Motion:** https://www.framer.com/motion/

---

**Viel Erfolg bei der Implementierung! 🚀**

*Bei Fragen zur Design-Spezifikation siehe DESIGN_UX_GUIDE.md*
