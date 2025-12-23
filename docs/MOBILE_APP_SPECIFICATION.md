# 📱 AI Arena Mobile App Spezifikation

## iOS & Android Native Apps - Komplette Anleitung

---

## 1. Übersicht

### App Vision
**"Die Kraft mehrerer KI-Modelle in deiner Tasche"**

- Chat on the go mit allen 5 Arena-Modi
- Nahtlose Synchronisation mit Web
- Offline Knowledge Base
- Push-Benachrichtigungen
- Voice Input

### Core Features

| Feature | iOS | Android |
|---------|-----|---------|
| Chat mit Arena (alle 5 Modi) | ✅ | ✅ |
| Team-Chats | ✅ | ✅ |
| Knowledge Base | ✅ | ✅ |
| Prompt Library | ✅ | ✅ |
| File Upload | ✅ | ✅ |
| Push Notifications | ✅ | ✅ |
| Offline Mode | ✅ | ✅ |
| Voice Input | ✅ | ✅ |
| Widgets | ✅ | ✅ |
| Biometric Auth | ✅ | ✅ |

### Target Devices
- **iOS:** iPhone 12+, iOS 16.0+, iPad optimiert
- **Android:** Android 10 (API 29)+, min. 4GB RAM

---

## 2. Technologie-Stack

### Empfehlung: React Native + Expo

```yaml
Framework: React Native 0.73+ mit Expo
Language: TypeScript 5.0+
State Management: Zustand
API Client: React Query + Axios
Navigation: React Navigation 6
UI Components: Tamagui oder NativeBase
Animations: React Native Reanimated 3
Storage: MMKV (key-value) + WatermelonDB (offline DB)
Push: Firebase Cloud Messaging + APNs
Real-time: Socket.io-client
Auth: expo-local-authentication (Biometric)
```

### Projektstruktur

```
ai-arena-mobile/
├── src/
│   ├── api/                    # API Clients
│   │   ├── arena.ts
│   │   ├── auth.ts
│   │   └── chat.ts
│   ├── components/
│   │   ├── arena/
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── ModelBadge.tsx
│   │   │   └── ProgressIndicator.tsx
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Avatar.tsx
│   ├── screens/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── knowledge/
│   │   └── settings/
│   ├── navigation/
│   ├── hooks/
│   ├── stores/
│   ├── services/
│   ├── theme/
│   └── App.tsx
├── ios/
├── android/
└── package.json
```

---

## 3. Screen Designs

### 3.1 Login Screen

```
┌─────────────────────────────────────────┐
│              [Status Bar]               │
├─────────────────────────────────────────┤
│                                         │
│                 ⚡                       │
│              AI Arena                   │
│                                         │
│        Willkommen zurück!               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📧  E-Mail                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒  Passwort               👁️   │   │
│  └─────────────────────────────────┘   │
│                                         │
│         Passwort vergessen?             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     ████ ANMELDEN ████          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────── oder ───────────          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🍎  Mit Apple anmelden          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔷  Mit Google anmelden         │   │
│  └─────────────────────────────────┘   │
│                                         │
│      Noch kein Konto? Registrieren     │
│                                         │
├─────────────────────────────────────────┤
│             [Home Indicator]            │
└─────────────────────────────────────────┘

Features:
• Face ID / Touch ID Button (wenn aktiviert)
• Auto-Login mit Biometric
• Gradient Primary Button
```

### 3.2 Dashboard Screen

```
┌─────────────────────────────────────────┐
│              [Status Bar]               │
├─────────────────────────────────────────┤
│ AI Arena                           👤  │
├─────────────────────────────────────────┤
│                                         │
│  Guten Morgen, Max! 👋                  │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │  127   │ │ 1,842  │ │ $12.50 │      │
│  │ Chats  │ │  Msgs  │ │ Kosten │      │
│  │ ↑12%   │ │  ↑8%   │ │ /Monat │      │
│  └────────┘ └────────┘ └────────┘      │
│         (Horizontal Scroll)             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      [+ Neuer Chat starten]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  LETZTE CHATS                          │
│  ┌─────────────────────────────────┐   │
│  │ 💬 API Integration       vor 5m │   │
│  │    Claude 3.5 • Auto-Select     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 💬 Code Review           vor 2h │   │
│  │    GPT-4o • Collaborative       │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 💬 Dokumentation       gestern  │   │
│  │    Gemini • Divide & Conquer    │   │
│  └─────────────────────────────────┘   │
│                                         │
│       Alle Chats anzeigen →            │
│                                         │
├─────────────────────────────────────────┤
│  🏠     💬      📚      👥      ⚙️    │
│ Home   Chat     KB    Teams  Settings  │
└─────────────────────────────────────────┘
```

### 3.3 Chat Screen (Core)

```
┌─────────────────────────────────────────┐
│              [Status Bar]               │
├─────────────────────────────────────────┤
│ ◀ API Integration       [🎯] [⋮]      │
│   Auto-Select Mode                      │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐│
││[🤖] Claude 3.5 Sonnet   [Auto-Select]││
││─────────────────────────────────────-││
││Hier ist der Code für deine API:      ││
││                                       ││
││```python                              ││
││def get_data():                        ││
││    response = api.fetch()             ││
││    return response.json()             ││
││```                                    ││
││                                       ││
││[📋 Copy] [👍] [👎] [🔄 Regenerate]   ││
│└─────────────────────────────────────┘│
│                                         │
│       ┌───────────────────────────────┐│
│       │ Danke! Kannst du auch        ││
│       │ die Tests dazu schreiben?    ││
│       └───────────────────────────────┘│
│                                  [👤]  │
│                                         │
│ ┌─────────────────────────────────────┐│
││ ● ● ●  (animiert)                    ││
││ Claude denkt nach...                 ││
│└─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│ [Claude✓] [GPT-4o] [Gemini] [+]        │
├─────────────────────────────────────────┤
│┌────────────────────────────────┐ ┌──┐│
││Nachricht schreiben...      📎🎤│ │➤ ││
│└────────────────────────────────┘ └──┘│
│ Enter senden • Shift+Enter neue Zeile  │
├─────────────────────────────────────────┤
│  🏠     💬      📚      👥      ⚙️    │
└─────────────────────────────────────────┘

Features:
• Pull to load older messages
• Long press für Kontext-Menü
• Double-tap zum Liken
• Swipe left zum Löschen
• Streaming Responses
• Syntax Highlighting
```

### 3.4 Arena Mode Selector (Bottom Sheet)

```
┌─────────────────────────────────────────┐
│ ──────  (Drag Handle)                   │
│                                         │
│       Arena Modus wählen                │
│                                         │
│ ┌─────────────────────────────────────┐│
││ 🎯  AUTO-SELECT                    ✓ ││
││     Arena wählt automatisch das      ││
││     beste Modell für deine Aufgabe   ││
│└─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
││ 🤝  COLLABORATIVE                    ││
││     Mehrere Modelle arbeiten         ││
││     zusammen und synthetisieren      ││
│└─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
││ ✂️  DIVIDE & CONQUER                 ││
││     Aufgabe wird aufgeteilt und      ││
││     von Spezialisten bearbeitet      ││
│└─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
││ 📋  PROJECT MODE                     ││
││     Kollaborative Planung,           ││
││     Ausführung und Review            ││
│└─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
││ 🧪  TESTER MODE                      ││
││     Automatisierte Tests mit         ││
││     Cross-Verification               ││
│└─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘

Interactions:
• Tap to select
• Haptic feedback
• Sheet dismisses after selection
• Swipe down to close
```

### 3.5 Knowledge Base Screen

```
┌─────────────────────────────────────────┐
│              [Status Bar]               │
├─────────────────────────────────────────┤
│ Knowledge Base              [🔍] [+]   │
├─────────────────────────────────────────┤
│┌───────────────────────────────────────┐│
││ 🔍 Wissen durchsuchen...             ││
│└───────────────────────────────────────┘│
│                                         │
│ [Verified ✓] [Beta] [Pending]          │
│                                         │
│ 456 verifizierte Einträge              │
│                                         │
│┌───────────────────────────────────────┐│
││ ✅ React Hooks Best Practices         ││
││    [Code] [React] [Frontend]          ││
││    useState und useEffect sollten...  ││
││                            vor 2 Tage ││
│└───────────────────────────────────────┘│
│                                         │
│┌───────────────────────────────────────┐│
││ ✅ PostgreSQL Index Optimization      ││
││    [Database] [PostgreSQL]            ││
││    Für häufig abgefragte Spalten...   ││
││                            vor 5 Tage ││
│└───────────────────────────────────────┘│
│                                         │
│┌───────────────────────────────────────┐│
││ 🔄 API Design Patterns                ││
││    [API] [REST] [Design]              ││
││    RESTful APIs sollten...            ││
││                           vor 1 Woche ││
│└───────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  🏠     💬      📚      👥      ⚙️    │
└─────────────────────────────────────────┘

Features:
• Offline verfügbar (cached)
• Pull to refresh
• Infinite scroll
• Tap to view details
```

---

## 4. Navigation Structure

```
ROOT NAVIGATOR (Stack)
│
├── Auth Navigator (Stack)
│   ├── Login Screen
│   ├── Register Screen
│   └── Forgot Password Screen
│
└── Main Navigator (Bottom Tabs)
    │
    ├── 🏠 Home Tab
    │   └── Dashboard Screen
    │
    ├── 💬 Chat Tab (Stack)
    │   ├── Chat List Screen
    │   ├── Chat Screen
    │   │   └── Mode Selector (Bottom Sheet)
    │   └── New Chat Screen
    │
    ├── 📚 Knowledge Tab (Stack)
    │   ├── Knowledge List Screen
    │   └── Entry Detail Screen
    │
    ├── 👥 Teams Tab (Stack)
    │   ├── Teams List Screen
    │   ├── Team Detail Screen
    │   └── Team Chat Screen
    │
    └── ⚙️ Settings Tab (Stack)
        ├── Settings Screen
        ├── Profile Screen
        ├── Notifications Screen
        ├── Appearance Screen
        └── About Screen

GLOBAL OVERLAYS:
├── Command Palette (Modal)
├── Model Selector (Bottom Sheet)
├── File Preview (Full Screen Modal)
└── Error/Success Toasts
```

### Tab Bar Spezifikation

```
┌─────────────────────────────────────────────────────────────┐
│    🏠         💬         📚         👥         ⚙️          │
│   Home      Chats       KB       Teams     Settings        │
│    ●                                                       │
└─────────────────────────────────────────────────────────────┘

• Height: 83px (inkl. Safe Area auf iOS)
• Background: Slate-900 mit Blur-Effekt
• Border-top: 1px Slate-800
• Active Icon: Cyan-500, scale 1.1
• Inactive Icon: Slate-500
• Badge: Red dot für ungelesene Notifications
• Haptic: Light impact beim Tab-Wechsel
```

---

## 5. Gestures & Interactions

### Gesture Catalog

| Gesture | Aktion | Feedback |
|---------|--------|----------|
| **Tap** | Select, Navigate, Toggle | Light haptic |
| **Double Tap** | Like/Favorite message | Medium haptic + Animation |
| **Long Press (500ms)** | Context menu | Heavy haptic |
| **Swipe Left** | Delete/Archive | Red background reveal |
| **Swipe Right** | Pin/Mark Read | Green background reveal |
| **Pull Down** | Refresh content | Spinner animation |
| **Pinch** | Zoom images/code | Scale transformation |
| **Edge Swipe (iOS)** | Back navigation | Interactive dismissal |

### Haptic Feedback Mapping

```typescript
const haptics = {
  // Light - UI Feedback
  light: {
    use: ['Button tap', 'Toggle switch', 'Selection change', 'Tab switch'],
    iOS: 'UIImpactFeedbackGenerator.light',
    Android: 'KEYBOARD_TAP',
  },
  
  // Medium - Bedeutsame Aktionen
  medium: {
    use: ['Send message', 'Mode change', 'Complete action'],
    iOS: 'UIImpactFeedbackGenerator.medium',
    Android: 'CONTEXT_CLICK',
  },
  
  // Heavy - Wichtige Benachrichtigungen
  heavy: {
    use: ['Delete confirmation', 'Error', 'Important alert'],
    iOS: 'UIImpactFeedbackGenerator.heavy',
    Android: 'LONG_PRESS',
  },
  
  // Success
  success: {
    use: ['Message sent', 'Task complete', 'Save success'],
    iOS: 'UINotificationFeedbackGenerator.success',
  },
  
  // Error  
  error: {
    use: ['Validation error', 'Network error', 'Failed action'],
    iOS: 'UINotificationFeedbackGenerator.error',
  },
};
```

---

## 6. Offline Mode

### Offline Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: MMKV (Schneller Key-Value Store)                     │
│  ─────────────────────────────────────────                      │
│  • Auth Tokens                                                  │
│  • User Preferences                                             │
│  • App State                                                    │
│  • Draft Messages                                               │
│                                                                 │
│  Layer 2: WatermelonDB (SQLite Wrapper)                        │
│  ─────────────────────────────────────────                      │
│  • Chat Messages (bis zu 1000 pro Chat)                        │
│  • Knowledge Base Einträge                                      │
│  • Team Daten                                                   │
│  • Prompt Library                                               │
│                                                                 │
│  Layer 3: File System Cache                                     │
│  ─────────────────────────────────────────                      │
│  • Images                                                       │
│  • Attachments                                                  │
│  • Code Snippets                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

SYNC STRATEGY:
1. Queue alle lokalen Änderungen
2. Erkenne Konnektivität (NetInfo)
3. Sync bei Reconnect (Push local → Pull server)
4. Background Sync (iOS: Background Fetch, Android: WorkManager)

OFFLINE CAPABILITIES:
✅ Gespeicherte Chats lesen
✅ Knowledge Base durchsuchen
✅ Draft Messages erstellen (werden gequeued)
✅ Prompt Library browsen
❌ Neue AI Requests (werden gequeued bis online)
❌ Real-time Team Collaboration
```

### Offline UI Indicator

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  Offline – Änderungen werden synchronisiert sobald online   │
└─────────────────────────────────────────────────────────────────┘
Background: Amber-500/20
Position: Top of screen, unter Status Bar
Animation: Subtle pulse
Auto-dismiss: Wenn wieder online
```

---

## 7. Push Notifications

### Notification Types

| Typ | Titel | Body | Deep Link |
|-----|-------|------|-----------|
| NEW_MESSAGE | "{{model}} hat geantwortet" | "{{preview}}..." | `/chat/{{id}}` |
| TEAM_MESSAGE | "Neue Nachricht in {{team}}" | "{{user}}: {{preview}}" | `/teams/{{id}}/chat` |
| KB_VERIFIED | "Wissen verifiziert ✅" | "\"{{title}}\" ist jetzt in KB Right" | `/knowledge/{{id}}` |
| ARENA_COMPLETE | "Arena Aufgabe abgeschlossen" | "Dein Projekt ist bereit" | `/chat/{{id}}` |
| WEEKLY_SUMMARY | "Deine Woche mit AI Arena" | "{{chats}} Chats, {{tokens}} Tokens" | `/dashboard` |

### Notification Settings Screen

```
┌─────────────────────────────────────────┐
│ ◀  Benachrichtigungen                  │
├─────────────────────────────────────────┤
│                                         │
│  Push-Benachrichtigungen         [🟢]  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  NACHRICHTEN                            │
│  AI-Antworten                    [🟢]  │
│  Team-Nachrichten                [🟢]  │
│                                         │
│  KNOWLEDGE BASE                         │
│  Verifizierte Einträge           [🟢]  │
│  Neue Beta Einträge              [⚪]  │
│                                         │
│  SYSTEM                                 │
│  Wöchentliche Zusammenfassung    [🟢]  │
│  App-Updates                     [🟢]  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  RUHEZEITEN                             │
│  ┌─────────────────────────────────┐   │
│  │ 22:00 – 08:00     [Bearbeiten] │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 8. Platform Guidelines

### iOS Specific

```
DESIGN:
• Human Interface Guidelines folgen
• SF Symbols für Icons
• SF Pro System Font
• Native Blur Effects (UIVisualEffectView)
• Dynamic Type unterstützen
• Dark Mode unterstützen

NAVIGATION:
• Large Titles in Navigation Bars
• Edge Swipe für Back Navigation
• Pull to Dismiss für Modals

FEATURES NUTZEN:
• Face ID / Touch ID
• Siri Shortcuts
• Spotlight Search Integration
• Share Extension
• Home Screen Widgets
• Live Activities (iOS 16+)
• Handoff zu Mac

SAFE AREAS:
• Notch / Dynamic Island respektieren
• Home Indicator Spacing
• Landscape Support
```

### Android Specific

```
DESIGN:
• Material Design 3 folgen
• Material Icons
• Roboto Font Family
• Ripple Effects on Touch
• Dynamic Color (Material You, Android 12+)

NAVIGATION:
• Bottom Navigation Bar
• System Back Button Handling
• Predictive Back Gesture (Android 14+)

FEATURES NUTZEN:
• Fingerprint / Face Unlock
• Google Assistant Integration
• App Shortcuts (Long Press Icon)
• Share Targets
• Home Screen Widgets
• Picture-in-Picture
• Split Screen Support

ADAPTATIONEN:
• Verschiedene Screen Sizes
• Foldable Devices
• Tablets (Two-Pane Layout)
• Gesture vs Button Navigation
```

---

## 9. Implementation Guide

### Development Phases

```
PHASE 1: FOUNDATION (Wochen 1-4)
├── Project Setup (React Native + Expo + TypeScript)
├── Navigation Structure
├── Theme System (Colors, Typography, Spacing)
├── Core UI Components
├── Auth Flow (Login, Register, Biometric)
└── API Client Setup

PHASE 2: CORE FEATURES (Wochen 5-10)
├── Chat Screen Implementation
├── Message Bubbles mit Markdown
├── Arena Mode Selection
├── Real-time Updates (WebSocket)
├── Chat List mit Search
├── Model Selector
└── Progress Indicators

PHASE 3: ADDITIONAL FEATURES (Wochen 11-14)
├── Knowledge Base Screens
├── Team Features
├── Push Notifications
├── Settings Screens
├── File Upload/Download
└── Voice Input

PHASE 4: POLISH (Wochen 15-18)
├── Offline Mode
├── Performance Optimization
├── Animations & Transitions
├── Error Handling
├── Accessibility
└── Testing (Unit, Integration, E2E)

PHASE 5: RELEASE (Wochen 19-20)
├── Beta Testing (TestFlight, Firebase)
├── App Store Assets
├── Store Listings
├── Submission & Review
└── Launch!
```

### Performance Targets

```yaml
Startup Time:
  cold_start: "< 2 seconds"
  warm_start: "< 500ms"

Frame Rate:
  target: "60 fps"
  minimum: "30 fps"

Response Time:
  user_input: "< 100ms"
  navigation: "< 300ms"
  api_call: "< 3s (with timeout)"

Memory:
  idle: "< 150 MB"
  active: "< 300 MB"

Bundle Size:
  ios: "< 50 MB"
  android: "< 40 MB (APK)"
```

---

## 10. Code Examples

### Package.json

```json
{
  "name": "ai-arena-mobile",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android"
  },
  "dependencies": {
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@shopify/flash-list": "^1.6.3",
    "@tanstack/react-query": "^5.18.0",
    "axios": "^1.6.5",
    "expo": "~50.0.0",
    "expo-clipboard": "~5.0.1",
    "expo-haptics": "~12.8.0",
    "expo-local-authentication": "~13.8.0",
    "expo-notifications": "~0.27.0",
    "expo-secure-store": "~12.8.0",
    "lucide-react-native": "^0.321.0",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-markdown-display": "^7.0.0",
    "react-native-mmkv": "^2.11.0",
    "react-native-reanimated": "~3.6.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "socket.io-client": "^4.7.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.7",
    "@types/react": "~18.2.48",
    "typescript": "^5.3.3"
  }
}
```

### Theme System

```typescript
// theme/colors.ts
export const colors = {
  // Primary
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  // Neutral
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
};

// theme/spacing.ts
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

// theme/typography.ts
export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};
```

### Chat Input Component

```tsx
// components/chat/ChatInput.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Send, Paperclip, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../theme';

interface Props {
  onSend: (message: string) => void;
  onAttachment: () => void;
  onVoice: () => void;
  isLoading?: boolean;
}

export const ChatInput: React.FC<Props> = ({
  onSend,
  onAttachment,
  onVoice,
  isLoading,
}) => {
  const [message, setMessage] = useState('');
  const buttonScale = useSharedValue(1);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSend(message.trim());
      setMessage('');
      
      buttonScale.value = withSpring(0.9, {}, () => {
        buttonScale.value = withSpring(1);
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onAttachment}>
          <Paperclip size={22} color={colors.slate[400]} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Nachricht schreiben..."
          placeholderTextColor={colors.slate[500]}
          multiline
          maxLength={4000}
        />

        <TouchableOpacity style={styles.iconBtn} onPress={onVoice}>
          <Mic size={22} color={colors.slate[400]} />
        </TouchableOpacity>

        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!message.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            <Send size={20} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.slate[800],
    backgroundColor: colors.slate[900],
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    gap: spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: colors.slate[800],
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    fontSize: 16,
    color: colors.white,
    maxHeight: 120,
    minHeight: 40,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cyan[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.slate[600],
  },
});
```

---

## 11. Security

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUTHENTICATION:                                                │
│  • Biometric (Face ID / Fingerprint)                           │
│  • PIN/Pattern Fallback                                         │
│  • JWT Tokens mit Refresh                                       │
│  • Secure Storage (Keychain / Keystore)                        │
│  • Auto-Logout nach Inaktivität (15 min)                       │
│                                                                 │
│  DATA PROTECTION:                                               │
│  • TLS 1.3 für alle API Calls                                   │
│  • Certificate Pinning                                          │
│  • Encrypted Local Database (SQLCipher)                        │
│  • Keine sensitiven Daten in Logs                               │
│                                                                 │
│  RUNTIME PROTECTION:                                            │
│  • Jailbreak/Root Detection (Warnung)                          │
│  • Debugger Detection                                           │
│  • Screenshot Prevention (optional für sensitive screens)       │
│                                                                 │
│  CODE PROTECTION:                                               │
│  • ProGuard/R8 Obfuscation (Android)                           │
│  • Keine Hardcoded Secrets                                      │
│  • Environment-based Configuration                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. App Store Requirements

### iOS App Store

```yaml
App Info:
  Name: "AI Arena"
  Subtitle: "Multi-Model AI Chat"
  Category: Productivity
  Secondary: Developer Tools
  Age Rating: 4+

Privacy:
  Policy URL: https://aiarena.io/privacy
  Data Collection:
    - Contact Info (Account)
    - Usage Data (Analytics)
  Tracking: false (no ATT required)

Review:
  Demo Account:
    email: demo@aiarena.io
    password: AppReview2024!
  Notes: "Test API key included"

Screenshots:
  - iPhone 15 Pro Max (6.7")
  - iPhone 8 Plus (5.5")
  - iPad Pro 12.9"
```

### Google Play Store

```yaml
App Info:
  Name: "AI Arena"
  Short Description: "Chat mit mehreren KI-Modellen"
  Category: Productivity
  Content Rating: Everyone

Data Safety:
  Collected:
    - Email (Account management)
    - App interactions (Analytics)
  Security:
    - Encrypted in transit
    - Can be deleted on request

Release:
  Track: Production
  Rollout: 10% (staged)
  Initial Countries: DE, AT, CH
```

---

*Letzte Aktualisierung: Dezember 2024*
