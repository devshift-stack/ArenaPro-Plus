# 🧩 AI Arena - Modul-Dokumentation für Design/UX-Agent

## Übersicht der hinzugefügten Module

Diese Dokumentation beschreibt alle Frontend-Module, die bereits implementiert wurden und wie der Design/UX-Agent damit arbeiten soll.

---

## 📁 Projektstruktur

```
frontend/src/
├── main.tsx              # App-Einstiegspunkt
├── App.tsx               # Router & Layout
├── index.css             # Globale Styles + Tailwind
│
├── components/
│   └── layouts/
│       └── MainLayout.tsx    # Haupt-Layout mit Sidebar
│
├── contexts/
│   ├── AuthContext.tsx       # Authentifizierung
│   ├── WebSocketContext.tsx  # Real-time Verbindung
│   ├── ThemeContext.tsx      # Dark/Light Mode
│   └── ToastContext.tsx      # Benachrichtigungen
│
├── hooks/                    # (noch zu erstellen)
│
├── lib/
│   └── utils.ts              # Utility-Funktionen
│
├── pages/
│   └── ChatPage.tsx          # Chat-Seite (Basis)
│
├── types/
│   └── index.ts              # TypeScript Definitionen
│
└── utils/
    └── api.ts                # API Client
```

---

## 1. Context Module

### 1.1 AuthContext (`contexts/AuthContext.tsx`)

**Zweck:** Verwaltet Benutzer-Authentifizierung

```typescript
// Verfügbare Werte & Funktionen
interface AuthContextType {
  user: User | null;           // Aktueller Benutzer
  isAuthenticated: boolean;    // Login-Status
  isLoading: boolean;          // Lade-Status
  login: (email, password) => Promise<void>;
  register: (email, password, name) => Promise<void>;
  logout: () => void;
  updateProfile: (data) => Promise<void>;
}

// Usage in Components:
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <div>Hallo {user.name}!</div>;
}
```

**Für Design-Agent:**
- Nutze `isLoading` für Skeleton-States
- Zeige `user.avatar` und `user.name` in Sidebar/Header
- Prüfe `user.plan` für Feature-Gating (free/pro/enterprise)

---

### 1.2 ThemeContext (`contexts/ThemeContext.tsx`)

**Zweck:** Dark/Light Mode Steuerung

```typescript
interface ThemeContextType {
  theme: 'dark' | 'light' | 'system';  // Gewähltes Theme
  setTheme: (theme) => void;            // Theme ändern
  resolvedTheme: 'dark' | 'light';      // Tatsächlich aktives Theme
}

// Usage:
import { useTheme } from '@/contexts/ThemeContext';

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}
```

**Für Design-Agent:**
- Standard ist `dark` - alle Designs primär für Dark Mode
- `system` respektiert OS-Einstellung
- Theme wird in localStorage gespeichert

---

### 1.3 ToastContext (`contexts/ToastContext.tsx`)

**Zweck:** Benachrichtigungs-System

```typescript
interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// Usage:
import { useToast } from '@/contexts/ToastContext';

function SaveButton() {
  const toast = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Gespeichert!', 'Deine Änderungen wurden übernommen.');
    } catch (e) {
      toast.error('Fehler', 'Speichern fehlgeschlagen.');
    }
  };
}
```

**Toast-Typen & Farben:**
| Typ | Icon | Farbe |
|-----|------|-------|
| success | ✓ CheckCircle | Green-400 |
| error | ✕ AlertCircle | Red-400 |
| warning | ⚠ AlertTriangle | Amber-400 |
| info | ℹ Info | Cyan-400 |

**Für Design-Agent:**
- Toasts erscheinen oben rechts
- Auto-dismiss nach 5s (error: 7s)
- Animation: slide-down + fade

---

### 1.4 WebSocketContext (`contexts/WebSocketContext.tsx`)

**Zweck:** Real-time Verbindung zum Backend

```typescript
interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
  subscribe: (event: string, callback: Function) => () => void;
}

// Usage:
import { useWebSocket } from '@/contexts/WebSocketContext';

function ChatMessages() {
  const { isConnected, subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('message:new', (message) => {
      // Neue Nachricht empfangen
      addMessage(message);
    });
    
    return unsubscribe;
  }, []);
}
```

**Events die der Design-Agent kennen sollte:**
| Event | Payload | Verwendung |
|-------|---------|------------|
| `message:new` | Message | Neue Chat-Nachricht |
| `message:update` | Partial<Message> | Streaming-Update |
| `typing:start` | { chatId, modelId } | Typing-Indicator |
| `typing:stop` | { chatId, modelId } | Typing beenden |
| `chat:updated` | Partial<Chat> | Chat-Metadaten |

**Für Design-Agent:**
- Zeige Connection-Status in UI (grün/rot Dot)
- Bei `!isConnected` → Offline-Banner anzeigen

---

## 2. Utility Module

### 2.1 Utils (`lib/utils.ts`)

**Wichtigste Funktionen:**

```typescript
// ═══════════════════════════════════════════════════════════════
// CLASS NAMES (Tailwind Merge)
// ═══════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';

// Kombiniert Klassen und löst Tailwind-Konflikte
<div className={cn(
  'base-class',
  isActive && 'active-class',
  className  // von Props
)} />

// ═══════════════════════════════════════════════════════════════
// DATUM & ZEIT
// ═══════════════════════════════════════════════════════════════

formatRelativeTime(date)  // → "vor 5 Min", "gestern"
formatDate(date)          // → "23. Dezember 2024"
formatTime(date)          // → "14:30"

// ═══════════════════════════════════════════════════════════════
// STRINGS
// ═══════════════════════════════════════════════════════════════

truncate(text, 100)       // → "Langer Text wird..." 
getInitials("Max Muster") // → "MM"
capitalize("hello")       // → "Hello"
slugify("Mein Titel")     // → "mein-titel"

// ═══════════════════════════════════════════════════════════════
// ZAHLEN
// ═══════════════════════════════════════════════════════════════

formatNumber(1500)        // → "1.5K"
formatCurrency(12.50)     // → "$12.50"
formatBytes(1048576)      // → "1 MB"

// ═══════════════════════════════════════════════════════════════
// ASYNC
// ═══════════════════════════════════════════════════════════════

debounce(fn, 300)         // Verzögert Ausführung
throttle(fn, 100)         // Limitiert Ausführungsrate
sleep(1000)               // Wartet 1 Sekunde

// ═══════════════════════════════════════════════════════════════
// CLIPBOARD
// ═══════════════════════════════════════════════════════════════

await copyToClipboard(text)  // Kopiert in Zwischenablage

// ═══════════════════════════════════════════════════════════════
// IDs
// ═══════════════════════════════════════════════════════════════

generateId()              // → "a1b2c3d4e5f6"
uuid()                    // → "550e8400-e29b-41d4-a716-446655440000"
```

---

### 2.2 API Client (`utils/api.ts`)

**Vorkonfigurierter Axios Client:**

```typescript
import api from '@/utils/api';

// GET Request
const chats = await api.get('/chats');

// POST Request
const newChat = await api.post('/chats', { title: 'Neuer Chat' });

// Mit Query-Params
const results = await api.get('/search', { 
  params: { q: 'react', limit: 10 } 
});
```

**Für Design-Agent:**
- Basis-URL wird aus `VITE_API_URL` gelesen
- JWT-Token wird automatisch angehängt
- Bei 401 → automatischer Logout

---

## 3. TypeScript Types (`types/index.ts`)

### Wichtigste Typen für UI:

```typescript
// ═══════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
}

// ═══════════════════════════════════════════════════════════════
// CHAT & MESSAGES
// ═══════════════════════════════════════════════════════════════

interface Chat {
  id: string;
  title: string;
  mode: ArenaMode;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  modelName?: string;
  mode?: ArenaMode;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// ARENA MODES
// ═══════════════════════════════════════════════════════════════

type ArenaMode = 
  | 'auto-select'      // 🎯 Orange
  | 'collaborative'    // 🤝 Blue
  | 'divide-conquer'   // ✂️ Purple
  | 'project'          // 📋 Green
  | 'tester';          // 🧪 Red

// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'pending' | 'beta' | 'verified';
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// MEMORY
// ═══════════════════════════════════════════════════════════════

interface Memory {
  id: string;
  type: 'short_term' | 'long_term' | 'semantic' | 'episodic';
  content: string;
  importance: number;  // 0-1
  createdAt: string;
}
```

---

## 4. Styling System

### 4.1 Tailwind Config Highlights

```javascript
// tailwind.config.js - Wichtige Custom-Werte

colors: {
  cyan: { 500: '#06b6d4' },      // Primary
  blue: { 500: '#3b82f6' },      // Secondary
  slate: { 900: '#0f172a' },     // Background
  arena: {
    'auto-select': '#f59e0b',
    'collaborative': '#3b82f6',
    'divide-conquer': '#a855f7',
    'project': '#22c55e',
    'tester': '#ef4444',
  }
}

animation: {
  'fade-in': 'fade-in 0.2s ease-out',
  'slide-up': 'slide-up 0.3s ease-out',
  'pulse-glow': 'pulse-glow 2s infinite',
  'shimmer': 'shimmer 2s infinite',  // Skeleton Loading
}

boxShadow: {
  'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
  'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
}
```

### 4.2 Vordefinierte CSS-Klassen (`index.css`)

```css
/* Buttons */
.btn-primary    /* Gradient Cyan→Blue, Shadow */
.btn-secondary  /* Border, Transparent */
.btn-ghost      /* Nur Hover-Effekt */

/* Inputs */
.input          /* Standard Input */
.input-error    /* Mit rotem Border */

/* Cards */
.card           /* Standard Card */
.card-interactive  /* Mit Hover-Effekt */
.card-gradient     /* Gradient Border */

/* Badges */
.badge-cyan
.badge-green
.badge-amber
.badge-red

/* Animations */
.animate-fade-in
.animate-slide-up
.animate-pulse-glow
.animate-shimmer    /* Skeleton Loading */

/* Prose/Markdown */
.prose-chat     /* Für AI-Antworten */
```

---

## 5. Was der Design-Agent als Nächstes erstellen soll

### Priorität 1: UI Components (`components/ui/`)

```
□ Button.tsx      - Mit cva für Varianten
□ Input.tsx       - Mit Label, Error, Icons
□ Card.tsx        - 3 Varianten
□ Avatar.tsx      - Mit Fallback-Initials
□ Badge.tsx       - Für Tags, Status
□ Modal.tsx       - Mit Framer Motion
□ Dropdown.tsx    - Für Selects
□ Tooltip.tsx     - Info-Tooltips
□ Skeleton.tsx    - Loading States
□ index.ts        - Barrel Export
```

### Priorität 2: Chat Components (`components/chat/`)

```
□ MessageBubble.tsx    - User & AI Bubbles
□ ChatInput.tsx        - Mit Attachments, Voice
□ TypingIndicator.tsx  - Animierte Dots
□ CodeBlock.tsx        - Syntax Highlighting
□ MessageActions.tsx   - Copy, Like, Regenerate
```

### Priorität 3: Arena Components (`components/arena/`)

```
□ ModeSelector.tsx     - Dropdown mit Icons
□ ModelBadge.tsx       - Zeigt aktives Modell
□ ModelSelector.tsx    - Multi-Select für Modelle
□ ProgressIndicator.tsx - Für lange Tasks
```

### Priorität 4: Pages

```
□ LoginPage.tsx
□ RegisterPage.tsx
□ DashboardPage.tsx
□ ChatListPage.tsx
□ KnowledgeBasePage.tsx
□ TeamsPage.tsx
□ SettingsPage.tsx
```

---

## 6. Code-Beispiel: Neue Component erstellen

```tsx
// components/ui/Button.tsx

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25',
        secondary: 'border border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white',
        ghost: 'text-slate-400 hover:bg-slate-800 hover:text-white',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
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
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
```

---

## Zusammenfassung für Design-Agent

| Modul | Status | Verwendung |
|-------|--------|------------|
| AuthContext | ✅ Fertig | `useAuth()` für Login-Status |
| ThemeContext | ✅ Fertig | `useTheme()` für Dark/Light |
| ToastContext | ✅ Fertig | `useToast()` für Notifications |
| WebSocketContext | ✅ Fertig | `useWebSocket()` für Real-time |
| Utils (cn, format*) | ✅ Fertig | Import aus `@/lib/utils` |
| API Client | ✅ Fertig | Import aus `@/utils/api` |
| Types | ✅ Fertig | Import aus `@/types` |
| Tailwind Config | ✅ Fertig | Alle Design Tokens verfügbar |
| CSS Classes | ✅ Fertig | .btn-*, .card-*, .badge-* |

**Nächste Schritte:**
1. UI Components erstellen (Button, Input, Card, etc.)
2. Chat Components erstellen
3. Arena Components erstellen
4. Pages implementieren

---

*Letzte Aktualisierung: Dezember 2024*
