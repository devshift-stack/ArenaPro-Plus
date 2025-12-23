# 🎨 AI ARENA - DESIGN & UX AGENT BRIEFING

**Version:** 2.1 | **Stand:** Dezember 2024
**Status:** Frontend-Grundstruktur vorhanden, UI-Komponenten erstellt, Pages implementiert

---

## 📋 INHALTSVERZEICHNIS

1. [Projektübersicht](#1-projektübersicht)
2. [Technologie-Stack](#2-technologie-stack)
3. [Projektstruktur](#3-projektstruktur)
4. [Design System](#4-design-system)
5. [Existierende Komponenten](#5-existierende-komponenten)
6. [Existierende Pages](#6-existierende-pages)
7. [Existierende Hooks & Contexts](#7-existierende-hooks--contexts)
8. [Import-Konventionen](#8-import-konventionen)
9. [API-Integration](#9-api-integration)
10. [Noch zu implementieren](#10-noch-zu-implementieren)
11. [Qualitäts-Checkliste](#11-qualitäts-checkliste)

---

## 1. PROJEKTÜBERSICHT

### Was ist AI Arena?
AI Arena ist eine Multi-Modell-Orchestrierungsplattform, die verschiedene KI-Modelle intelligent kombiniert.

### Die 5 Arena-Modi

| Modus | Icon | Farbe | Beschreibung |
|-------|------|-------|--------------|
| **Auto-Select** | Sparkles | amber → orange | Automatische Modellauswahl |
| **Collaborative** | Users | blue → cyan | Modelle arbeiten zusammen |
| **Divide & Conquer** | GitBranch | purple → pink | Aufgaben werden verteilt |
| **Project** | FolderKanban | green → emerald | Projektplanung & Phasen |
| **Tester** | TestTube2 | red → rose | Automatisierte Tests |

### Design-Philosophie

> **"Mächtig, aber nicht kompliziert"**

- **Clarity First** - Jede Funktion ist sofort verständlich
- **Instant Feedback** - Nutzer wissen immer, was passiert
- **Cognitive Load Reduction** - Komplexität wird versteckt
- **Fluid Experience** - Sanfte Übergänge, keine harten Schnitte
- **Predictability** - Konsistente Patterns überall

---

## 2. TECHNOLOGIE-STACK

```
Frontend:
├── React 18 + TypeScript
├── Vite 5 (Build Tool)
├── Tailwind CSS 3.4
├── Radix UI (Headless Components)
├── Framer Motion (Animationen)
├── Lucide React (Icons)
├── React Router 6
├── Axios (HTTP Client)
├── TanStack Query (Server State) - optional
└── Zustand (Client State) - optional
```

---

## 3. PROJEKTSTRUKTUR

```
frontend/src/
├── components/
│   ├── ui/                    # ✅ VORHANDEN - Basis UI-Komponenten
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── tabs.tsx
│   │   ├── toaster.tsx
│   │   ├── tooltip.tsx
│   │   └── index.ts           # Barrel Export
│   │
│   ├── layouts/               # ✅ VORHANDEN
│   │   └── MainLayout.tsx
│   │
│   ├── chat/                  # ❌ FEHLT - Zu erstellen
│   └── arena/                 # ❌ FEHLT - Zu erstellen
│
├── pages/                     # ✅ VORHANDEN
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ChatPage.tsx
│   ├── TeamsPage.tsx
│   ├── KnowledgeBasePage.tsx
│   ├── PromptsPage.tsx
│   ├── SettingsPage.tsx
│   ├── HandbookPage.tsx
│   ├── LearningRulesPage.tsx  # NEU: Selbstlernendes Regel-System
│   └── index.ts
│
├── hooks/                     # ✅ VORHANDEN
│   ├── useChat.ts
│   ├── useArena.ts
│   └── index.ts
│
├── contexts/                  # ✅ VORHANDEN
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── ToastContext.tsx
│   └── WebSocketContext.tsx
│
├── lib/                       # ✅ VORHANDEN
│   └── utils.ts               # cn(), formatters, helpers
│
├── types/                     # ✅ VORHANDEN
│   └── index.ts               # Alle TypeScript Types
│
├── utils/                     # ✅ VORHANDEN
│   └── api.ts                 # Axios Instance + API Functions
│
├── App.tsx                    # ✅ VORHANDEN
├── main.tsx                   # ✅ VORHANDEN
├── index.css                  # ✅ VORHANDEN
└── vite-env.d.ts              # ✅ VORHANDEN
```

---

## 4. DESIGN SYSTEM

### 4.1 Farbpalette

```css
/* Primär - Cyan */
--cyan-400: #22d3ee;
--cyan-500: #06b6d4;
--cyan-600: #0891b2;

/* Sekundär - Blue */
--blue-400: #60a5fa;
--blue-500: #3b82f6;
--blue-600: #2563eb;

/* Dark Theme - Slate */
--slate-950: #020617;  /* Haupt-Hintergrund */
--slate-900: #0f172a;  /* Cards, Inputs */
--slate-800: #1e293b;  /* Borders, Hover */
--slate-700: #334155;  /* Subtle Borders */
--slate-400: #94a3b8;  /* Sekundärer Text */
--slate-500: #64748b;  /* Placeholder */

/* Semantische Farben */
--success: #22c55e (green-500)
--warning: #f59e0b (amber-500)
--error: #ef4444 (red-500)
--info: #3b82f6 (blue-500)
```

### 4.2 Arena-Modus-Gradienten

```css
/* Auto-Select */
.from-amber-500.to-orange-600

/* Collaborative */
.from-blue-500.to-cyan-500

/* Divide & Conquer */
.from-purple-500.to-pink-500

/* Project */
.from-green-500.to-emerald-500

/* Tester */
.from-red-500.to-rose-500
```

### 4.3 Typografie

```css
/* Font Family */
font-family: 'Inter', system-ui, sans-serif;

/* Größen */
text-xs: 0.75rem / 12px
text-sm: 0.875rem / 14px
text-base: 1rem / 16px
text-lg: 1.125rem / 18px
text-xl: 1.25rem / 20px
text-2xl: 1.5rem / 24px
text-3xl: 1.875rem / 30px
```

### 4.4 Spacing (4px Grid)

```css
space-1: 4px    space-2: 8px    space-3: 12px
space-4: 16px   space-5: 20px   space-6: 24px
space-8: 32px   space-10: 40px  space-12: 48px
```

### 4.5 Border Radius

```css
rounded-sm: 2px
rounded-md: 6px
rounded-lg: 8px
rounded-xl: 12px
rounded-2xl: 16px
rounded-full: 9999px
```

### 4.6 Animationen

```css
/* Timing */
duration-75: 75ms    /* Micro-Interactions */
duration-150: 150ms  /* Hover-States */
duration-200: 200ms  /* Standard */
duration-300: 300ms  /* Komplexere Animationen */
duration-500: 500ms  /* Page Transitions */

/* Easing */
ease-out: cubic-bezier(0, 0, 0.2, 1)  /* Standard */
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  /* Smooth */
```

---

## 5. EXISTIERENDE KOMPONENTEN

### 5.1 Button (`@/components/ui/button`)

```tsx
import { Button } from '@/components/ui/button';

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon

<Button variant="default" size="default" isLoading={false}>
  Click me
</Button>

<Button 
  variant="outline" 
  leftIcon={<Plus className="h-4 w-4" />}
  isLoading={isSubmitting}
>
  Hinzufügen
</Button>
```

### 5.2 Input (`@/components/ui/input`)

```tsx
import { Input } from '@/components/ui/input';

<Input
  placeholder="Suche..."
  leftIcon={<Search className="h-4 w-4" />}
  rightIcon={<X className="h-4 w-4" />}
  error="Pflichtfeld"
/>
```

### 5.3 Card (`@/components/ui/card`)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// Variants: default, interactive, gradient

<Card variant="interactive">
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>Inhalt</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### 5.4 Badge (`@/components/ui/badge`)

```tsx
import { Badge } from '@/components/ui/badge';

// Variants: default, primary, secondary, success, warning, destructive, purple, outline

<Badge variant="primary">Aktiv</Badge>
<Badge variant="success">Verifiziert</Badge>
```

### 5.5 Dialog (`@/components/ui/dialog`)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Öffnen</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titel</DialogTitle>
      <DialogDescription>Beschreibung</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Abbrechen</Button>
      <Button>Speichern</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5.6 Weitere Komponenten

| Komponente | Import | Beschreibung |
|------------|--------|--------------|
| Avatar | `@/components/ui/avatar` | Avatar mit Fallback, sizes: sm, md, lg, xl |
| Select | `@/components/ui/select` | Dropdown-Auswahl |
| Tabs | `@/components/ui/tabs` | Tab-Navigation |
| DropdownMenu | `@/components/ui/dropdown-menu` | Kontextmenü |
| Tooltip | `@/components/ui/tooltip` | Hover-Tooltips |
| Progress | `@/components/ui/progress` | Fortschrittsbalken |
| ScrollArea | `@/components/ui/scroll-area` | Custom Scrollbar |
| Separator | `@/components/ui/separator` | Trennlinie |
| Popover | `@/components/ui/popover` | Popover-Container |
| Label | `@/components/ui/label` | Form Labels |
| Toaster | `@/components/ui/toaster` | Toast-Notifications |

---

## 6. EXISTIERENDE PAGES

### 6.1 LoginPage
**Pfad:** `/login`
**Features:**
- E-Mail/Passwort Login
- Passwort anzeigen/verbergen
- "Angemeldet bleiben" Checkbox
- Social Login (GitHub, Google)
- Link zu Registrierung
- Hintergrund-Glow-Effekt

### 6.2 RegisterPage
**Pfad:** `/register`
**Features:**
- Name, E-Mail, Passwort, Passwort bestätigen
- Formvalidierung
- AGB-Checkbox
- Link zu Login

### 6.3 DashboardPage
**Pfad:** `/dashboard`
**Features:**
- Begrüßung mit Username
- 4 Statistik-Karten (Chats, Nachrichten, KB Einträge, Kosten)
- "Neuer Chat" CTA mit Gradient
- Letzte Chats Liste
- Schnellstart-Aktionen (Code Review, Brainstorming, Recherche)
- Memory Status Card

### 6.4 ChatPage
**Pfad:** `/chat` und `/chat/:chatId`
**Features:**
- Arena-Modus-Auswahl (Select Dropdown)
- Modell-Auswahl (Badge-Toggle)
- Nachrichten-Liste mit Animationen
- Message Bubbles mit Markdown-Rendering
- Code-Highlighting (Prism)
- Copy/Like/Dislike/Regenerate Buttons
- Progress-Anzeige beim Verarbeiten
- Typing Indicator

### 6.5 TeamsPage
**Pfad:** `/teams`
**Features:**
- Team-Karten mit Mitgliedern
- Rollen-Badges (Owner, Admin, Member)
- "Neues Team" Dialog
- Mitglieder einladen
- Team-Einstellungen Dropdown

### 6.6 KnowledgeBasePage
**Pfad:** `/knowledge`
**Features:**
- Such- und Filter-Funktionen
- Tag-Filter mit Multi-Select
- Status-Tabs (Alle, Verifiziert, Beta, Ausstehend)
- Eintrags-Karten mit Status-Badge
- Inline Tag-Toggle

### 6.7 PromptsPage
**Pfad:** `/prompts`
**Features:**
- Prompt-Bibliothek mit Kategorien
- Favoriten-Filter
- Kategorie-Tabs
- Copy/Use/Edit Aktionen
- Usage-Counter

### 6.8 SettingsPage
**Pfad:** `/settings`
**Features:**
- Profil-Tab (Avatar, Name, E-Mail)
- Darstellung-Tab (Theme: Light/Dark/System, Sprache)
- Benachrichtigungen-Tab (Toggle-Switches)
- Sicherheit-Tab (Passwort ändern, API Keys)
- Abrechnung-Tab (Plan, Usage-Balken)

### 6.9 HandbookPage
**Pfad:** `/handbook`
**Features:**
- Suchfunktion
- Featured Guides
- Sidebar-Navigation
- Artikel-Listen mit Lesezeit
- Hilfe-Kontakt-Card

### 6.10 LearningRulesPage (NEU!)
**Pfad:** `/learning` (Admin-Bereich)
**Features:**
- Statistik-Karten (Ausstehend, Aktiv, Abgelehnt, Events)
- Tabs: Vorgeschlagen, Aktiv, Analyse
- Vorgeschlagene Regeln mit Details
- Genehmigen/Ablehnen Buttons
- Ablehnungs-Dialog mit Begründung
- Analytics mit Progress-Balken

---

## 7. EXISTIERENDE HOOKS & CONTEXTS

### 7.1 useChat Hook

```tsx
import { useChat } from '@/hooks/useChat';

const { 
  chat,           // Single Chat Daten
  messages,       // Message Array
  chats,          // Chat Liste
  isLoading,      // Lade-Status
  isLoadingChats, // Chat-Liste Lade-Status
  sendMessage,    // (content: string) => void
  isSending,      // Sende-Status
  createChat,     // (params) => Promise<Chat>
  deleteChat,     // (chatId) => void
  isTyping,       // Boolean
  typingModel,    // string | null
} = useChat({ chatId: 'optional-id' });
```

### 7.2 useArena Hook

```tsx
import { useArena } from '@/hooks/useArena';

const {
  models,              // Model Array
  isLoadingModels,     // Boolean
  arenaModes,          // Mode Configurations
  getModeConfig,       // (modeId) => Config
  getModelById,        // (modelId) => Model
  createChat,          // (params) => Promise<Chat>
  changeMode,          // (chatId, mode) => void
  selectModels,        // (chatId, modelIds) => void
} = useArena();
```

### 7.3 AuthContext

```tsx
import { useAuth } from '@/contexts/AuthContext';

const {
  user,            // User | null
  isAuthenticated, // Boolean
  isLoading,       // Boolean
  login,           // (email, password) => Promise<void>
  register,        // (email, password, name) => Promise<void>
  logout,          // () => void
  updateProfile,   // (updates) => Promise<void>
} = useAuth();

// User Interface:
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  plan?: string;
}
```

### 7.4 ThemeContext

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { theme, setTheme } = useTheme();
// theme: 'light' | 'dark' | 'system'
```

### 7.5 ToastContext

```tsx
import { useToast } from '@/contexts/ToastContext';

const toast = useToast();

toast.success('Titel', 'Beschreibung');
toast.error('Fehler', 'Details');
toast.warning('Warnung', 'Details');
toast.info('Info', 'Details');
```

### 7.6 WebSocketContext

```tsx
import { useWebSocket } from '@/contexts/WebSocketContext';

const { isConnected, sendMessage, subscribe } = useWebSocket();

// Event abonnieren
const unsubscribe = subscribe('message:new', (data) => {
  console.log('Neue Nachricht:', data);
});
```

---

## 8. IMPORT-KONVENTIONEN

### ⚠️ WICHTIG: Unterschiedliche Import-Pfade je nach Ordner!

#### In `/pages/` - Verwende `@/` Alias:

```tsx
// ✅ RICHTIG
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import api from '@/utils/api';
```

#### In `/components/layouts/` - Verwende relative Pfade:

```tsx
// ✅ RICHTIG
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
```

#### In `/components/ui/` - Verwende `@/lib/utils`:

```tsx
// ✅ RICHTIG
import { cn } from '@/lib/utils';
```

#### Allgemeine Regeln:

```tsx
// Icons - Immer von lucide-react
import { Search, Plus, X } from 'lucide-react';

// Types - Aus @/types
import type { User, Chat, Message } from '@/types';

// Radix UI - Direkt importieren
import * as DialogPrimitive from '@radix-ui/react-dialog';
```

---

## 9. API-INTEGRATION

### ⚠️ WICHTIG: API hat default UND named Exports!

```tsx
// ✅ RICHTIG - Beide Import-Arten funktionieren:

// Default Import für die Axios Instance
import api from '@/utils/api';

// Named Imports für spezifische API-Module
import { authApi, chatApi, arenaApi, memoryApi, learningApi } from '@/utils/api';
```

### API-Module Übersicht:

```tsx
// Auth API
authApi.login(email, password)
authApi.register(email, password, name)
authApi.logout()
authApi.me()

// Chat API
chatApi.getChats()
chatApi.getChat(chatId)
chatApi.createChat({ title, mode, modelIds })
chatApi.deleteChat(chatId)
chatApi.sendMessage(chatId, content)
chatApi.getMessages(chatId)

// Arena API
arenaApi.getModels()
arenaApi.getModes()
arenaApi.changeMode(chatId, mode)
arenaApi.selectModels(chatId, modelIds)
arenaApi.analyzeTask(content)

// Memory API
memoryApi.getMemories({ type, limit })
memoryApi.recall(query, limit)
memoryApi.getContext(chatId)
memoryApi.getSettings()
memoryApi.updateSettings(settings)
memoryApi.deleteAll()
memoryApi.export()

// Knowledge API
knowledgeApi.getEntries({ status, tags })
knowledgeApi.createEntry({ content, tags })
knowledgeApi.verifyEntry(entryId)
knowledgeApi.search(query)

// Learning API (Selbstlernendes System)
learningApi.getProposedRules()
learningApi.getActiveRules()
learningApi.approveRule(ruleId)
learningApi.rejectRule(ruleId, reason)
learningApi.deleteRule(ruleId)
learningApi.getStatistics()
learningApi.recordEvent({ type, modelId, chatId, content })
learningApi.recordCorrection({ messageId, originalContent, correctedContent })
learningApi.recordFeedback({ messageId, isPositive, reason })

// Teams API
teamsApi.getTeams()
teamsApi.createTeam({ name, description })
teamsApi.inviteMember(teamId, email, role)
teamsApi.removeMember(teamId, userId)

// Prompts API
promptsApi.getPrompts({ category, favorites })
promptsApi.createPrompt({ title, content, category })
promptsApi.toggleFavorite(promptId)
promptsApi.suggest(description)
```

### Beispiel: API in einer Komponente verwenden

```tsx
import { useState, useEffect } from 'react';
import { chatApi } from '@/utils/api';

function ChatList() {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      try {
        const response = await chatApi.getChats();
        setChats(response.chats);
      } catch (error) {
        console.error('Fehler beim Laden:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadChats();
  }, []);

  // ...
}
```

---

## 10. NOCH ZU IMPLEMENTIEREN

### 10.1 Chat-Komponenten (Priorität: HOCH)

```
/components/chat/
├── MessageBubble.tsx      # Bereits inline in ChatPage - Extrahieren
├── MessageList.tsx        # Virtualisierte Liste
├── ChatInput.tsx          # Input mit Attachments
├── TypingIndicator.tsx    # Animierte Dots
├── CodeBlock.tsx          # Syntax Highlighting
└── index.ts
```

### 10.2 Arena-Komponenten (Priorität: HOCH)

```
/components/arena/
├── ModeSelector.tsx       # Dropdown mit Icons
├── ModelBadge.tsx         # Provider-spezifische Farben
├── ModelSelector.tsx      # Multi-Select für Modelle
├── ProgressPanel.tsx      # Fortschritt für D&C/Project
└── index.ts
```

### 10.3 Memory-Komponenten (Priorität: MITTEL)

```
/components/memory/
├── MemoryCard.tsx
├── MemoryList.tsx
├── MemorySearch.tsx
└── MemorySettings.tsx
```

### 10.4 Fehlende UI-Komponenten

| Komponente | Beschreibung |
|------------|--------------|
| Switch | Toggle Switch |
| Slider | Range Slider |
| Skeleton | Loading Skeletons |
| Alert | Alert Banners |
| Toast | Toast Container |
| Sheet | Slide-over Panel |
| Command | Command Palette |

### 10.5 Fehlende Pages

| Page | Pfad | Beschreibung |
|------|------|--------------|
| MemoryPage | `/memory` | Memory-Verwaltung |
| NotFoundPage | `*` | 404 Seite |
| OnboardingPage | `/onboarding` | Erste Schritte |

---

## 11. QUALITÄTS-CHECKLISTE

### Vor jedem Commit prüfen:

#### TypeScript
- [ ] Keine `any` Types (außer absolut notwendig)
- [ ] Props sind typisiert
- [ ] Keine TypeScript-Fehler

#### Styling
- [ ] Dark Mode funktioniert
- [ ] Responsive ab 320px
- [ ] Konsistente Spacing (4px Grid)
- [ ] Fokus-States sichtbar

#### Komponenten
- [ ] Loading States vorhanden
- [ ] Error States vorhanden
- [ ] Empty States vorhanden
- [ ] Animationen sind smooth (60fps)

#### Accessibility
- [ ] Keyboard-Navigation möglich
- [ ] ARIA Labels vorhanden
- [ ] Kontrast ausreichend (4.5:1)
- [ ] Screen Reader kompatibel

#### Performance
- [ ] Keine unnötigen Re-Renders
- [ ] Bilder optimiert
- [ ] Code-Splitting wo sinnvoll
- [ ] Lazy Loading für schwere Komponenten

---

## 📝 SCHNELL-REFERENZ

### Neue Komponente erstellen:

```tsx
// /components/ui/new-component.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

interface NewComponentProps {
  className?: string;
  children?: React.ReactNode;
}

const NewComponent = React.forwardRef<HTMLDivElement, NewComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('base-classes', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NewComponent.displayName = 'NewComponent';

export { NewComponent };
```

### Neue Page erstellen:

```tsx
// /pages/NewPage.tsx
import { useState } from 'react';
import { PageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NewPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <PageIcon className="h-8 w-8 text-cyan-400" />
          Page Title
        </h1>
        <p className="mt-1 text-slate-400">Description</p>
      </div>
      
      {/* Content */}
    </div>
  );
}
```

### Export in index.ts hinzufügen:

```tsx
// /pages/index.ts
export { NewPage } from './NewPage';
```

### Route in App.tsx hinzufügen:

```tsx
<Route path="/new-page" element={<NewPage />} />
```

---

## 🚀 LOS GEHT'S!

1. **Lese diese Anleitung vollständig**
2. **Prüfe existierende Komponenten** bevor du neue erstellst
3. **Halte dich an die Import-Konventionen**
4. **Nutze die API-Module** für Backend-Kommunikation
5. **Teste auf verschiedenen Bildschirmgrößen**
6. **Frage bei Unklarheiten nach**

**Viel Erfolg! 🎨**
