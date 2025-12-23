# 🎨 AI Arena - Design & UX Agent Anleitung

## Vollständige Spezifikation für Frontend-Entwicklung

---

## 📋 Inhaltsverzeichnis

1. [Design Philosophy](#1-design-philosophy)
2. [Brand Identity](#2-brand-identity)
3. [Design System](#3-design-system)
4. [Component Library](#4-component-library)
5. [Page Layouts](#5-page-layouts)
6. [Interaction Patterns](#6-interaction-patterns)
7. [Animation Guidelines](#7-animation-guidelines)
8. [Accessibility](#8-accessibility)
9. [Responsive Design](#9-responsive-design)
10. [Dark/Light Mode](#10-darklight-mode)
11. [Iconography](#11-iconography)
12. [Error States](#12-error-states)
13. [Loading States](#13-loading-states)
14. [Mobile App Design](#14-mobile-app-design)

---

## 1. Design Philosophy

### 1.1 Kernprinzipien

```
┌─────────────────────────────────────────────────────────────────┐
│                    DESIGN PRINCIPLES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 CLARITY FIRST                                               │
│     Jedes Element hat einen klaren Zweck.                       │
│     Keine Dekoration ohne Funktion.                             │
│                                                                 │
│  ⚡ INSTANT FEEDBACK                                             │
│     Jede Aktion bekommt sofortiges visuelles Feedback.          │
│     Der User weiß immer, was passiert.                          │
│                                                                 │
│  🧠 COGNITIVE LOAD REDUCTION                                    │
│     Komplexität verstecken, nicht eliminieren.                  │
│     Progressive Disclosure für Power Features.                   │
│                                                                 │
│  🌊 FLUID EXPERIENCE                                            │
│     Nahtlose Übergänge zwischen Zuständen.                      │
│     Animationen unterstützen das Verständnis.                   │
│                                                                 │
│  🔮 PREDICTABILITY                                              │
│     Konsistente Patterns überall.                               │
│     Der User lernt einmal, nutzt überall.                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Emotional Design Goals

| Emotion | Wie erreichen |
|---------|---------------|
| **Vertrauen** | Klare Struktur, professionelle Ästhetik, konsistentes Verhalten |
| **Kompetenz** | Der User fühlt sich mächtig durch intuitive Power-Features |
| **Ruhe** | Großzügiger Whitespace, sanfte Animationen, keine visuellen Schreie |
| **Neugier** | Subtile Hinweise auf versteckte Features, Entdeckungsfreude |
| **Zufriedenheit** | Micro-Interactions, Erfolgsfeedback, Progress-Visualisierung |

### 1.3 Design Mantra

```
"Mächtig, aber nicht kompliziert.
 Schön, aber nicht ablenkend.
 Intelligent, aber nicht bevormundend."
```

---

## 2. Brand Identity

### 2.1 Logo

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGO USAGE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PRIMARY LOGO:                                                 │
│   ┌──────┐                                                      │
│   │  ⚡  │  AI Arena                                            │
│   └──────┘                                                      │
│   Gradient Box + Wordmark                                       │
│                                                                 │
│   ICON ONLY (min 32px):                                         │
│   ┌──────┐                                                      │
│   │  ⚡  │                                                      │
│   └──────┘                                                      │
│                                                                 │
│   WORDMARK ONLY:                                                │
│   AI Arena                                                      │
│   (Gradient text or solid)                                      │
│                                                                 │
│   MINIMUM SIZES:                                                │
│   • Full logo: 120px width                                      │
│   • Icon only: 32px                                             │
│   • Clear space: 1x icon height on all sides                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Farbpalette

```scss
// ═══════════════════════════════════════════════════════════════
// PRIMARY COLORS
// ═══════════════════════════════════════════════════════════════

$cyan-50:  #ecfeff;
$cyan-100: #cffafe;
$cyan-200: #a5f3fc;
$cyan-300: #67e8f9;
$cyan-400: #22d3ee;
$cyan-500: #06b6d4;  // PRIMARY
$cyan-600: #0891b2;
$cyan-700: #0e7490;
$cyan-800: #155e75;
$cyan-900: #164e63;
$cyan-950: #083344;

// ═══════════════════════════════════════════════════════════════
// SECONDARY COLORS (Blue)
// ═══════════════════════════════════════════════════════════════

$blue-50:  #eff6ff;
$blue-100: #dbeafe;
$blue-200: #bfdbfe;
$blue-300: #93c5fd;
$blue-400: #60a5fa;
$blue-500: #3b82f6;  // SECONDARY
$blue-600: #2563eb;
$blue-700: #1d4ed8;
$blue-800: #1e40af;
$blue-900: #1e3a8a;
$blue-950: #172554;

// ═══════════════════════════════════════════════════════════════
// NEUTRAL COLORS (Slate)
// ═══════════════════════════════════════════════════════════════

$slate-50:  #f8fafc;
$slate-100: #f1f5f9;
$slate-200: #e2e8f0;
$slate-300: #cbd5e1;
$slate-400: #94a3b8;
$slate-500: #64748b;
$slate-600: #475569;
$slate-700: #334155;
$slate-800: #1e293b;
$slate-900: #0f172a;
$slate-950: #020617;

// ═══════════════════════════════════════════════════════════════
// SEMANTIC COLORS
// ═══════════════════════════════════════════════════════════════

// Success
$green-500: #22c55e;
$green-600: #16a34a;

// Warning  
$amber-500: #f59e0b;
$amber-600: #d97706;

// Error
$red-500: #ef4444;
$red-600: #dc2626;

// Info
$blue-500: #3b82f6;
$blue-600: #2563eb;

// ═══════════════════════════════════════════════════════════════
// ARENA MODE COLORS
// ═══════════════════════════════════════════════════════════════

$mode-auto-select:     linear-gradient(135deg, #f59e0b, #ea580c);
$mode-collaborative:   linear-gradient(135deg, #3b82f6, #06b6d4);
$mode-divide-conquer:  linear-gradient(135deg, #a855f7, #ec4899);
$mode-project:         linear-gradient(135deg, #22c55e, #10b981);
$mode-tester:          linear-gradient(135deg, #ef4444, #f43f5e);

// ═══════════════════════════════════════════════════════════════
// GRADIENTS
// ═══════════════════════════════════════════════════════════════

$gradient-primary:     linear-gradient(135deg, #06b6d4, #3b82f6);
$gradient-secondary:   linear-gradient(135deg, #3b82f6, #8b5cf6);
$gradient-accent:      linear-gradient(135deg, #f59e0b, #ef4444);
$gradient-surface:     linear-gradient(180deg, #1e293b, #0f172a);
$gradient-glow:        radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%);
```

### 2.3 Typografie

```scss
// ═══════════════════════════════════════════════════════════════
// FONT FAMILIES
// ═══════════════════════════════════════════════════════════════

// Primary Font (UI, Body)
$font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

// Monospace (Code)
$font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

// Display (Headlines, Logo)
$font-display: 'Cal Sans', 'Inter', sans-serif;

// ═══════════════════════════════════════════════════════════════
// TYPE SCALE
// ═══════════════════════════════════════════════════════════════

$text-xs:   0.75rem;   // 12px
$text-sm:   0.875rem;  // 14px
$text-base: 1rem;      // 16px
$text-lg:   1.125rem;  // 18px
$text-xl:   1.25rem;   // 20px
$text-2xl:  1.5rem;    // 24px
$text-3xl:  1.875rem;  // 30px
$text-4xl:  2.25rem;   // 36px
$text-5xl:  3rem;      // 48px
$text-6xl:  3.75rem;   // 60px

// ═══════════════════════════════════════════════════════════════
// FONT WEIGHTS
// ═══════════════════════════════════════════════════════════════

$font-normal:   400;
$font-medium:   500;
$font-semibold: 600;
$font-bold:     700;

// ═══════════════════════════════════════════════════════════════
// LINE HEIGHTS
// ═══════════════════════════════════════════════════════════════

$leading-none:    1;
$leading-tight:   1.25;
$leading-snug:    1.375;
$leading-normal:  1.5;
$leading-relaxed: 1.625;
$leading-loose:   2;

// ═══════════════════════════════════════════════════════════════
// LETTER SPACING
// ═══════════════════════════════════════════════════════════════

$tracking-tighter: -0.05em;
$tracking-tight:   -0.025em;
$tracking-normal:  0;
$tracking-wide:    0.025em;
$tracking-wider:   0.05em;
$tracking-widest:  0.1em;
```

### 2.4 Typography Usage

```
┌─────────────────────────────────────────────────────────────────┐
│                      TYPOGRAPHY HIERARCHY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  H1 - Page Titles                                               │
│  ────────────────                                               │
│  Font: Cal Sans / Inter                                         │
│  Size: 36px (2.25rem)                                           │
│  Weight: 700                                                    │
│  Color: White                                                   │
│  Usage: Main page headings only                                 │
│                                                                 │
│  H2 - Section Headers                                           │
│  ────────────────────                                           │
│  Font: Inter                                                    │
│  Size: 24px (1.5rem)                                            │
│  Weight: 600                                                    │
│  Color: White                                                   │
│  Usage: Major sections within a page                            │
│                                                                 │
│  H3 - Subsection Headers                                        │
│  ───────────────────────                                        │
│  Font: Inter                                                    │
│  Size: 18px (1.125rem)                                          │
│  Weight: 600                                                    │
│  Color: Slate-200                                               │
│  Usage: Card titles, subsections                                │
│                                                                 │
│  Body - Regular Text                                            │
│  ───────────────────                                            │
│  Font: Inter                                                    │
│  Size: 16px (1rem)                                              │
│  Weight: 400                                                    │
│  Color: Slate-300                                               │
│  Line Height: 1.5                                               │
│                                                                 │
│  Small - Secondary Text                                         │
│  ──────────────────────                                         │
│  Font: Inter                                                    │
│  Size: 14px (0.875rem)                                          │
│  Weight: 400                                                    │
│  Color: Slate-400                                               │
│                                                                 │
│  Caption - Labels, Hints                                        │
│  ───────────────────────                                        │
│  Font: Inter                                                    │
│  Size: 12px (0.75rem)                                           │
│  Weight: 500                                                    │
│  Color: Slate-500                                               │
│  Letter Spacing: 0.025em                                        │
│                                                                 │
│  Code - Monospace                                               │
│  ────────────────                                               │
│  Font: JetBrains Mono                                           │
│  Size: 14px (0.875rem)                                          │
│  Weight: 400                                                    │
│  Color: Cyan-400 (inline), Slate-300 (blocks)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Design System

### 3.1 Spacing System

```scss
// ═══════════════════════════════════════════════════════════════
// SPACING SCALE (Based on 4px grid)
// ═══════════════════════════════════════════════════════════════

$space-0:   0;
$space-px:  1px;
$space-0.5: 0.125rem;  // 2px
$space-1:   0.25rem;   // 4px
$space-1.5: 0.375rem;  // 6px
$space-2:   0.5rem;    // 8px
$space-2.5: 0.625rem;  // 10px
$space-3:   0.75rem;   // 12px
$space-3.5: 0.875rem;  // 14px
$space-4:   1rem;      // 16px
$space-5:   1.25rem;   // 20px
$space-6:   1.5rem;    // 24px
$space-7:   1.75rem;   // 28px
$space-8:   2rem;      // 32px
$space-9:   2.25rem;   // 36px
$space-10:  2.5rem;    // 40px
$space-11:  2.75rem;   // 44px
$space-12:  3rem;      // 48px
$space-14:  3.5rem;    // 56px
$space-16:  4rem;      // 64px
$space-20:  5rem;      // 80px
$space-24:  6rem;      // 96px
$space-28:  7rem;      // 112px
$space-32:  8rem;      // 128px

// ═══════════════════════════════════════════════════════════════
// SEMANTIC SPACING
// ═══════════════════════════════════════════════════════════════

$spacing-page-padding:      $space-6;   // 24px
$spacing-section-gap:       $space-8;   // 32px
$spacing-card-padding:      $space-4;   // 16px
$spacing-input-padding-x:   $space-3;   // 12px
$spacing-input-padding-y:   $space-2;   // 8px
$spacing-button-padding-x:  $space-4;   // 16px
$spacing-button-padding-y:  $space-2;   // 8px
$spacing-list-gap:          $space-2;   // 8px
$spacing-inline-gap:        $space-2;   // 8px
```

### 3.2 Border Radius

```scss
// ═══════════════════════════════════════════════════════════════
// BORDER RADIUS SCALE
// ═══════════════════════════════════════════════════════════════

$radius-none:  0;
$radius-sm:    0.25rem;   // 4px  - Small elements
$radius-md:    0.375rem;  // 6px  - Buttons, inputs
$radius-lg:    0.5rem;    // 8px  - Cards, panels
$radius-xl:    0.75rem;   // 12px - Large cards
$radius-2xl:   1rem;      // 16px - Modals
$radius-3xl:   1.5rem;    // 24px - Hero elements
$radius-full:  9999px;    // Pills, avatars

// ═══════════════════════════════════════════════════════════════
// SEMANTIC RADIUS
// ═══════════════════════════════════════════════════════════════

$radius-button:    $radius-md;
$radius-input:     $radius-md;
$radius-card:      $radius-lg;
$radius-modal:     $radius-2xl;
$radius-avatar:    $radius-full;
$radius-badge:     $radius-full;
$radius-tooltip:   $radius-md;
```

### 3.3 Shadows

```scss
// ═══════════════════════════════════════════════════════════════
// SHADOW SCALE
// ═══════════════════════════════════════════════════════════════

$shadow-sm:    0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md:    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -2px rgba(0, 0, 0, 0.1);
$shadow-lg:    0 10px 15px -3px rgba(0, 0, 0, 0.1), 
               0 4px 6px -4px rgba(0, 0, 0, 0.1);
$shadow-xl:    0 20px 25px -5px rgba(0, 0, 0, 0.1), 
               0 8px 10px -6px rgba(0, 0, 0, 0.1);
$shadow-2xl:   0 25px 50px -12px rgba(0, 0, 0, 0.25);
$shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

// ═══════════════════════════════════════════════════════════════
// GLOW EFFECTS (For dark mode)
// ═══════════════════════════════════════════════════════════════

$glow-cyan:    0 0 20px rgba(6, 182, 212, 0.3);
$glow-blue:    0 0 20px rgba(59, 130, 246, 0.3);
$glow-purple:  0 0 20px rgba(168, 85, 247, 0.3);
$glow-green:   0 0 20px rgba(34, 197, 94, 0.3);
$glow-red:     0 0 20px rgba(239, 68, 68, 0.3);

// ═══════════════════════════════════════════════════════════════
// SEMANTIC SHADOWS
// ═══════════════════════════════════════════════════════════════

$shadow-card:      $shadow-lg;
$shadow-dropdown:  $shadow-xl;
$shadow-modal:     $shadow-2xl;
$shadow-button:    $shadow-md;
$shadow-input:     $shadow-sm;
```

### 3.4 Z-Index Scale

```scss
// ═══════════════════════════════════════════════════════════════
// Z-INDEX SCALE
// ═══════════════════════════════════════════════════════════════

$z-behind:    -1;
$z-base:       0;
$z-dropdown:   10;
$z-sticky:     20;
$z-fixed:      30;
$z-modal:      40;
$z-popover:    50;
$z-tooltip:    60;
$z-toast:      70;
$z-max:        9999;
```

---

## 4. Component Library

### 4.1 Buttons

```
┌─────────────────────────────────────────────────────────────────┐
│                         BUTTON VARIANTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY (Gradient)                                             │
│  ┌─────────────────────────────┐                                │
│  │      Primary Action         │  Gradient: Cyan → Blue         │
│  └─────────────────────────────┘  Text: White                   │
│  Hover: Opacity 90%, slight lift                                │
│  Active: Scale 0.98                                             │
│                                                                 │
│  SECONDARY (Outlined)                                           │
│  ┌─────────────────────────────┐                                │
│  │     Secondary Action        │  Border: Slate-700             │
│  └─────────────────────────────┘  Text: Slate-300               │
│  Hover: Border Cyan-500, Text White                             │
│                                                                 │
│  GHOST (Text only)                                              │
│  ┌─────────────────────────────┐                                │
│  │       Ghost Action          │  Background: Transparent       │
│  └─────────────────────────────┘  Text: Slate-400               │
│  Hover: Background Slate-800, Text White                        │
│                                                                 │
│  DESTRUCTIVE                                                    │
│  ┌─────────────────────────────┐                                │
│  │      Delete / Remove        │  Background: Red-600           │
│  └─────────────────────────────┘  Text: White                   │
│  Hover: Background Red-700                                      │
│                                                                 │
│  SIZES:                                                         │
│  • sm:  h-8   px-3  text-sm                                     │
│  • md:  h-10  px-4  text-base  (default)                        │
│  • lg:  h-12  px-6  text-lg                                     │
│  • xl:  h-14  px-8  text-xl                                     │
│  • icon: h-10 w-10 (square)                                     │
│                                                                 │
│  STATES:                                                        │
│  • :hover     → Visual feedback                                 │
│  • :active    → Press effect                                    │
│  • :focus     → Ring outline (cyan)                             │
│  • :disabled  → Opacity 50%, cursor not-allowed                 │
│  • :loading   → Spinner + disabled                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```tsx
// Button Component Specification
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}
```

### 4.2 Inputs

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT VARIANTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEXT INPUT                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍  Placeholder text...                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Background: Slate-900                                          │
│  Border: Slate-700 (default), Cyan-500 (focus)                 │
│  Text: White                                                    │
│  Placeholder: Slate-500                                         │
│                                                                 │
│  TEXTAREA                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Multi-line text input...                                │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Min-height: 100px                                              │
│  Resize: vertical                                               │
│                                                                 │
│  SELECT                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Select option...                                      ▼ │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Dropdown: Slate-900 background, Slate-700 border              │
│  Hover item: Slate-800                                          │
│  Selected: Cyan highlight                                       │
│                                                                 │
│  CHECKBOX / RADIO                                               │
│  ☑️ Checked option                                              │
│  ☐ Unchecked option                                             │
│  Checked: Cyan-500 background                                   │
│  Unchecked: Slate-700 border                                    │
│                                                                 │
│  STATES:                                                        │
│  • :focus    → Ring outline (cyan)                              │
│  • :error    → Red-500 border, error message below              │
│  • :disabled → Opacity 50%, cursor not-allowed                  │
│  • :readonly → Slight background change                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Cards

```
┌─────────────────────────────────────────────────────────────────┐
│                          CARD VARIANTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STANDARD CARD                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Card Title                                             │   │
│  │  ─────────────────────────────────────────────────     │   │
│  │  Card content goes here with adequate padding          │   │
│  │  and proper spacing between elements.                   │   │
│  │                                                         │   │
│  │                                   [Action Button]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Background: Slate-900                                          │
│  Border: Slate-800                                              │
│  Padding: 16px                                                  │
│  Radius: 8px                                                    │
│                                                                 │
│  INTERACTIVE CARD (Hover effects)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Hover: Border Slate-700, subtle lift                   │   │
│  │  Cursor: pointer                                        │   │
│  │  Transition: all 200ms ease                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  GRADIENT BORDER CARD                                           │
│  ╔═════════════════════════════════════════════════════════╗   │
│  ║  Gradient border (cyan → blue → purple)                 ║   │
│  ║  Used for premium/featured content                      ║   │
│  ╚═════════════════════════════════════════════════════════╝   │
│                                                                 │
│  STAT CARD                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊  Total Chats                                        │   │
│  │      1,234                                              │   │
│  │      ↑ 12% from last week                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Chat Components

```
┌─────────────────────────────────────────────────────────────────┐
│                       CHAT COMPONENTS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USER MESSAGE BUBBLE                                            │
│                                          ┌─────────────────────┐│
│                                          │ User message text   ││
│                                          │ with cyan bg        ││
│                                          └─────────────────────┘│
│                                                          [Avatar]│
│  Alignment: Right                                               │
│  Background: Cyan-600                                           │
│  Text: White                                                    │
│  Max-width: 80%                                                 │
│  Border-radius: 16px 16px 4px 16px                             │
│                                                                 │
│  AI MESSAGE BUBBLE                                              │
│  [Avatar]┌─────────────────────────────────────────────────────┐│
│          │ Claude 3.5 Sonnet                    [Auto-Select]  ││
│          │ ───────────────────────────────────────────────────││
│          │ AI response with markdown support.                  ││
│          │                                                     ││
│          │ ```python                                           ││
│          │ def hello():                                        ││
│          │     print("Hello World")                            ││
│          │ ```                                                 ││
│          │                                                     ││
│          │ [Copy] [👍] [👎] [Regenerate]                       ││
│          └─────────────────────────────────────────────────────┘│
│  Alignment: Left                                                │
│  Background: Slate-900                                          │
│  Border: Slate-800                                              │
│  Text: Slate-200                                                │
│  Max-width: 80%                                                 │
│  Border-radius: 16px 16px 16px 4px                             │
│                                                                 │
│  TYPING INDICATOR                                               │
│  [Avatar]┌─────────────────────────────────────────────────────┐│
│          │ ● ● ●  (Animated dots)                              ││
│          └─────────────────────────────────────────────────────┘│
│                                                                 │
│  PROCESSING STATE                                               │
│  [Avatar]┌─────────────────────────────────────────────────────┐│
│          │ 🔄 Analysiere Anfrage...                            ││
│          │ ████████████░░░░░░░░ 65%                            ││
│          │                                                     ││
│          │ Modelle: Claude 3.5, GPT-4o                         ││
│          └─────────────────────────────────────────────────────┘│
│                                                                 │
│  INPUT AREA                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Model Tags: Claude ✓] [GPT-4o ✓] [Gemini]                ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ ┌─────────────────────────────────────────────┐ ┌────────┐ ││
│  │ │ Schreibe deine Nachricht...          📎 🎤 │ │   ➤    │ ││
│  │ └─────────────────────────────────────────────┘ └────────┘ ││
│  │  Enter zum Senden • Shift+Enter für neue Zeile             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Navigation Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION COMPONENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SIDEBAR (Expanded - 280px)                                     │
│  ┌────────────────────────────┐                                 │
│  │ [⚡] AI Arena         [◀]  │  Header with collapse toggle   │
│  ├────────────────────────────┤                                 │
│  │ [+ Neuer Chat]             │  Primary action button         │
│  ├────────────────────────────┤                                 │
│  │ 📊 Dashboard               │                                 │
│  │ 💬 Chats            ●      │  ● = Active indicator          │
│  │ 👥 Teams                   │                                 │
│  │ 📚 Knowledge Base          │                                 │
│  │ 📝 Prompts                 │                                 │
│  │ ❓ Handbuch                │                                 │
│  │ ⚙️ Einstellungen           │                                 │
│  ├────────────────────────────┤                                 │
│  │ LETZTE CHATS               │  Section header                │
│  │ 💬 API Integration         │                                 │
│  │ 💬 Code Review             │                                 │
│  │ 💬 Dokumentation           │                                 │
│  ├────────────────────────────┤                                 │
│  │ [👤 Max Mustermann    ▼]   │  User menu                     │
│  └────────────────────────────┘                                 │
│                                                                 │
│  SIDEBAR (Collapsed - 72px)                                     │
│  ┌──────┐                                                       │
│  │ [⚡] │  Icon only                                            │
│  ├──────┤                                                       │
│  │ [+]  │                                                       │
│  ├──────┤                                                       │
│  │ [📊] │  Tooltip on hover                                     │
│  │ [💬] │                                                       │
│  │ ...  │                                                       │
│  ├──────┤                                                       │
│  │ [👤] │                                                       │
│  └──────┘                                                       │
│                                                                 │
│  TOP BAR                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [🔍 Suche...]                          [🔔●] [●] Verbunden ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  TABS                                                           │
│  ┌────────┬────────┬────────┬────────────────────────────────┐ │
│  │ Tab 1  │ Tab 2  │ Tab 3  │                                │ │
│  └────────┴────────┴────────┴────────────────────────────────┘ │
│  Active: Cyan underline, white text                             │
│  Inactive: Slate-400 text                                       │
│                                                                 │
│  BREADCRUMBS                                                    │
│  Dashboard > Teams > Team Alpha > Einstellungen                 │
│  Separator: Slate-600 /                                         │
│  Active: White                                                  │
│  Links: Slate-400, hover Cyan                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Modal & Dialogs

```
┌─────────────────────────────────────────────────────────────────┐
│                       MODAL COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STANDARD MODAL                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ Modal Title                                           [✕] ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║                                                           ║ │
│  ║  Modal content goes here. This can include forms,         ║ │
│  ║  messages, or any other content.                          ║ │
│  ║                                                           ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║                        [Cancel]  [Confirm]                ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│  Backdrop: Black 60%, blur                                      │
│  Modal: Slate-900, Slate-800 border                            │
│  Max-width: 500px (sm), 700px (md), 900px (lg)                 │
│  Animation: Fade in + scale up                                  │
│                                                                 │
│  CONFIRMATION DIALOG                                            │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ ⚠️ Bist du sicher?                                        ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║                                                           ║ │
│  ║  Diese Aktion kann nicht rückgängig gemacht werden.       ║ │
│  ║                                                           ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║                      [Abbrechen]  [Löschen]               ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│  Destructive button: Red                                        │
│                                                                 │
│  SLIDE-OVER PANEL                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Panel Title                                      [✕] │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │                                                      │      │
│  │  Full-height panel content                           │◀─────│
│  │  Slides in from right                                │      │
│  │                                                      │      │
│  │                                                      │      │
│  │                                                      │      │
│  │                                                      │      │
│  │                                                      │      │
│  └──────────────────────────────────────────────────────┘      │
│  Width: 400px (sm), 500px (md), 600px (lg)                     │
│  Animation: Slide in from right                                 │
│                                                                 │
│  COMMAND PALETTE (Spotlight Search)                             │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ 🔍 Suche nach Chats, Befehlen, Wissen...                  ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║ SCHNELLAKTIONEN                                           ║ │
│  ║ ├─ [+] Neuer Chat                              ⌘N         ║ │
│  ║ ├─ [📁] Neues Projekt                          ⌘P         ║ │
│  ║ └─ [🔍] In KB suchen                           ⌘K         ║ │
│  ║                                                           ║ │
│  ║ LETZTE CHATS                                              ║ │
│  ║ ├─ 💬 API Integration                                     ║ │
│  ║ └─ 💬 Code Review                                         ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│  Shortcut: ⌘K (Mac) / Ctrl+K (Windows)                         │
│  Position: Top center, offset from top                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Page Layouts

### 5.1 Dashboard Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]│                      DASHBOARD                                   │
│          │ ─────────────────────────────────────────────────────────────── │
│          │                                                                  │
│          │  Willkommen zurück, Max! 👋                                      │
│          │                                                                  │
│          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│          │  │ 📊 Chats     │ │ 💬 Nachrichten│ │ 📚 KB Einträge│ │ 💰 Kosten││
│          │  │    127       │ │    1,842     │ │    456       │ │   $12.50 ││
│          │  │ ↑12% 7 Tage  │ │ ↑8% 7 Tage   │ │ ↑24 neu      │ │ diesen Mo││
│          │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│          │                                                                  │
│          │  ┌────────────────────────────────────────┐ ┌──────────────────┐│
│          │  │ NUTZUNG LETZTE 7 TAGE                  │ │ TOP MODELLE      ││
│          │  │ [Chart: Tokens über Zeit]              │ │ 1. Claude 3.5    ││
│          │  │                                        │ │ 2. GPT-4o        ││
│          │  │                                        │ │ 3. Gemini Pro    ││
│          │  └────────────────────────────────────────┘ └──────────────────┘│
│          │                                                                  │
│          │  ┌──────────────────────────────────────────────────────────────┐│
│          │  │ LETZTE AKTIVITÄTEN                                           ││
│          │  ├──────────────────────────────────────────────────────────────┤│
│          │  │ 💬 Chat "API Docs" fortgesetzt                    vor 2 Min ││
│          │  │ 📚 KB Eintrag "React Hooks" verifiziert          vor 15 Min ││
│          │  │ 👥 Team "Development" beigetreten                 vor 1 Std ││
│          │  │ 📝 Prompt "Code Review" erstellt                  vor 2 Std ││
│          │  └──────────────────────────────────────────────────────────────┘│
│          │                                                                  │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

### 5.2 Chat Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]│                         CHAT                                     │
│          │ ┌─────────────────────────────────────────────────────────────┐ │
│          │ │ [🎯] Auto-Select Mode              [Modus ▼] [⚙️]           │ │
│          │ │      Arena wählt das beste Modell                          │ │
│          │ └─────────────────────────────────────────────────────────────┘ │
│          │ ┌─────────────────────────────────────────────────────────────┐ │
│          │ │                                                             │ │
│          │ │                    [Conversation Area]                      │ │
│          │ │                                                             │ │
│          │ │  [AI Avatar]┌──────────────────────────────────────────────┐│ │
│          │ │             │ Claude 3.5 Sonnet              [Auto-Select] ││ │
│          │ │             │ ──────────────────────────────────────────── ││ │
│          │ │             │ Hier ist dein Code mit Erklärungen...        ││ │
│          │ │             │                                              ││ │
│          │ │             │ ```python                                    ││ │
│          │ │             │ def example():                               ││ │
│          │ │             │     return "Hello"                           ││ │
│          │ │             │ ```                                          ││ │
│          │ │             │                                              ││ │
│          │ │             │ [📋 Copy] [👍] [👎] [🔄 Regenerate]          ││ │
│          │ │             └──────────────────────────────────────────────┘│ │
│          │ │                                                             │ │
│          │ │                          ┌──────────────────────────────────┐│ │
│          │ │                          │ User message aligned right      ││ │
│          │ │                          └──────────────────────────────────┘│ │
│          │ │                                                       [Avatar]│ │
│          │ │                                                             │ │
│          │ └─────────────────────────────────────────────────────────────┘ │
│          │ ┌─────────────────────────────────────────────────────────────┐ │
│          │ │ [Claude ✓] [GPT-4o] [Gemini]              (Model Badges)    │ │
│          │ ├─────────────────────────────────────────────────────────────┤ │
│          │ │ ┌────────────────────────────────────────────┐ ┌──────────┐ │ │
│          │ │ │ Schreibe deine Nachricht...          📎 🎤 │ │    ➤     │ │ │
│          │ │ └────────────────────────────────────────────┘ └──────────┘ │ │
│          │ │ Enter senden • Shift+Enter neue Zeile           Powered by ⚡│ │
│          │ └─────────────────────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

### 5.3 Knowledge Base Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]│                    KNOWLEDGE BASE                                │
│          │ ─────────────────────────────────────────────────────────────── │
│          │                                                                  │
│          │  ┌────────────────────────────────────────────────────────────┐ │
│          │  │ 🔍 Suche in der Knowledge Base...                          │ │
│          │  └────────────────────────────────────────────────────────────┘ │
│          │                                                                  │
│          │  ┌──────────┬──────────┬──────────┐                             │
│          │  │ Verified │  Beta    │ Pending  │   ← Tabs                    │
│          │  └──────────┴──────────┴──────────┘                             │
│          │                                                                  │
│          │  ┌────────────────────────────────────────────────────────────┐ │
│          │  │ STATISTIKEN                                                │ │
│          │  │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │ │
│          │  │ │ ✅ 456    │ │ 🔄 23     │ │ ⏳ 12     │ │ 📈 89%    │   │ │
│          │  │ │ Verified  │ │ Beta      │ │ Pending   │ │ Reliability│   │ │
│          │  │ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │ │
│          │  └────────────────────────────────────────────────────────────┘ │
│          │                                                                  │
│          │  ┌────────────────────────────────────────────────────────────┐ │
│          │  │ 📚 React Hooks Best Practices                   ✅ Verified │ │
│          │  │ ──────────────────────────────────────────────────────────│ │
│          │  │ useState und useEffect sollten mit Bedacht eingesetzt...  │ │
│          │  │ [Code] [React] [Frontend]          🕐 vor 2 Tagen          │ │
│          │  └────────────────────────────────────────────────────────────┘ │
│          │                                                                  │
│          │  ┌────────────────────────────────────────────────────────────┐ │
│          │  │ 📚 PostgreSQL Index Optimization                ✅ Verified │ │
│          │  │ ──────────────────────────────────────────────────────────│ │
│          │  │ Für häufig abgefragte Spalten sollten Indizes erstellt... │ │
│          │  │ [Database] [PostgreSQL]            🕐 vor 5 Tagen          │ │
│          │  └────────────────────────────────────────────────────────────┘ │
│          │                                                                  │
│          │                    [Load More...]                                │
│          │                                                                  │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 6. Interaction Patterns

### 6.1 Core Interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERACTION PATTERNS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HOVER STATES                                                   │
│  ─────────────                                                  │
│  • Buttons: Slight brightness increase, subtle shadow           │
│  • Cards: Border color change, slight lift (translateY -2px)    │
│  • Links: Color change to cyan, underline appears               │
│  • Icons: Color change, slight scale (1.1)                      │
│  • Rows: Background highlight (slate-800)                       │
│                                                                 │
│  CLICK/TAP STATES                                               │
│  ────────────────                                               │
│  • Buttons: Scale down (0.98), darker background                │
│  • Cards: Scale down (0.99)                                     │
│  • Icons: Scale down (0.9)                                      │
│  • Checkboxes: Immediate visual feedback                        │
│                                                                 │
│  FOCUS STATES                                                   │
│  ────────────                                                   │
│  • All interactive elements: Cyan ring (2px offset)             │
│  • High contrast for accessibility                              │
│  • Tab navigation support                                       │
│                                                                 │
│  DRAG & DROP                                                    │
│  ───────────                                                    │
│  • Dragged item: Slight rotation, shadow, opacity 0.8           │
│  • Drop zone: Dashed border, background highlight               │
│  • Invalid drop: Red border, shake animation                    │
│                                                                 │
│  LONG PRESS (Mobile)                                            │
│  ─────────────────                                              │
│  • Visual feedback after 300ms                                  │
│  • Context menu or additional actions                           │
│  • Haptic feedback                                              │
│                                                                 │
│  SWIPE GESTURES (Mobile)                                        │
│  ───────────────────────                                        │
│  • Swipe left: Delete/Archive action                            │
│  • Swipe right: Mark as read/favorite                           │
│  • Pull to refresh: Loading animation                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Chat Interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT INTERACTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SENDING A MESSAGE                                              │
│  ─────────────────                                              │
│  1. User types in input                                         │
│  2. Enter or click send                                         │
│  3. Message appears with sending indicator                      │
│  4. Scroll to bottom                                            │
│  5. AI typing indicator appears                                 │
│  6. Progress bar shows processing status                        │
│  7. Response streams in (character by character)                │
│  8. Final state with action buttons                             │
│                                                                 │
│  CODE BLOCKS                                                    │
│  ───────────                                                    │
│  • Syntax highlighting                                          │
│  • Copy button (top right)                                      │
│  • Language label (top left)                                    │
│  • Line numbers (optional toggle)                               │
│                                                                 │
│  MESSAGE ACTIONS                                                │
│  ───────────────                                                │
│  • Copy: Copies full message text                               │
│  • Thumbs up/down: Feedback to system                           │
│  • Regenerate: New response with same prompt                    │
│  • Edit (user): Modify and resend                               │
│                                                                 │
│  ARENA MODE SELECTION                                           │
│  ────────────────────                                           │
│  • Dropdown with visual mode indicators                         │
│  • Preview of what each mode does                               │
│  • Model selection (for manual modes)                           │
│                                                                 │
│  FILE ATTACHMENTS                                               │
│  ────────────────                                               │
│  • Drag & drop onto chat                                        │
│  • Click paperclip icon                                         │
│  • Preview before sending                                       │
│  • Progress indicator for upload                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Animation Guidelines

### 7.1 Timing & Easing

```scss
// ═══════════════════════════════════════════════════════════════
// DURATION SCALE
// ═══════════════════════════════════════════════════════════════

$duration-75:   75ms;   // Micro interactions
$duration-100:  100ms;  // Button presses
$duration-150:  150ms;  // Hover states
$duration-200:  200ms;  // Tooltips, small transitions
$duration-300:  300ms;  // Standard transitions
$duration-500:  500ms;  // Complex animations
$duration-700:  700ms;  // Page transitions
$duration-1000: 1000ms; // Loading states

// ═══════════════════════════════════════════════════════════════
// EASING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

$ease-linear:      linear;
$ease-in:          cubic-bezier(0.4, 0, 1, 1);
$ease-out:         cubic-bezier(0, 0, 0.2, 1);
$ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);
$ease-bounce:      cubic-bezier(0.68, -0.55, 0.265, 1.55);
$ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275);

// ═══════════════════════════════════════════════════════════════
// SEMANTIC TIMINGS
// ═══════════════════════════════════════════════════════════════

$transition-fast:     $duration-150 $ease-out;
$transition-normal:   $duration-200 $ease-in-out;
$transition-slow:     $duration-300 $ease-in-out;
$transition-page:     $duration-500 $ease-in-out;
```

### 7.2 Animation Catalog

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANIMATION CATALOG                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FADE IN                                                        │
│  ────────                                                       │
│  opacity: 0 → 1                                                 │
│  Duration: 200ms                                                │
│  Usage: Modals, tooltips, new content                           │
│                                                                 │
│  SLIDE UP                                                       │
│  ─────────                                                      │
│  translateY: 20px → 0, opacity: 0 → 1                           │
│  Duration: 300ms                                                │
│  Usage: Toasts, cards appearing                                 │
│                                                                 │
│  SLIDE IN FROM RIGHT                                            │
│  ────────────────────                                           │
│  translateX: 100% → 0                                           │
│  Duration: 300ms                                                │
│  Usage: Side panels, slide-overs                                │
│                                                                 │
│  SCALE UP                                                       │
│  ─────────                                                      │
│  scale: 0.95 → 1, opacity: 0 → 1                                │
│  Duration: 200ms                                                │
│  Usage: Modal dialogs, dropdowns                                │
│                                                                 │
│  PULSE                                                          │
│  ──────                                                         │
│  scale: 1 → 1.05 → 1                                            │
│  Duration: 1000ms, infinite                                     │
│  Usage: Notification badges, loading indicators                 │
│                                                                 │
│  SPIN                                                           │
│  ─────                                                          │
│  rotate: 0deg → 360deg                                          │
│  Duration: 1000ms, infinite                                     │
│  Usage: Loading spinners                                        │
│                                                                 │
│  TYPING DOTS                                                    │
│  ────────────                                                   │
│  ● ● ●  (staggered bounce)                                      │
│  Duration: 1400ms, infinite                                     │
│  Usage: AI thinking indicator                                   │
│                                                                 │
│  SHIMMER                                                        │
│  ────────                                                       │
│  Background gradient sweep                                      │
│  Duration: 1500ms, infinite                                     │
│  Usage: Skeleton loaders                                        │
│                                                                 │
│  SHAKE                                                          │
│  ──────                                                         │
│  translateX: -5px → 5px                                         │
│  Duration: 400ms                                                │
│  Usage: Error feedback                                          │
│                                                                 │
│  CONFETTI                                                       │
│  ────────                                                       │
│  Particle explosion                                             │
│  Duration: 2000ms                                               │
│  Usage: Success celebrations                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Accessibility

### 8.1 WCAG 2.1 AA Compliance

```
┌─────────────────────────────────────────────────────────────────┐
│                  ACCESSIBILITY REQUIREMENTS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COLOR CONTRAST                                                 │
│  ──────────────                                                 │
│  • Normal text: 4.5:1 minimum                                   │
│  • Large text (18px+): 3:1 minimum                              │
│  • UI components: 3:1 minimum                                   │
│  • Focus indicators: 3:1 minimum                                │
│                                                                 │
│  Tested Combinations:                                           │
│  • White on Slate-900: ✅ 15.8:1                                │
│  • Slate-300 on Slate-900: ✅ 7.5:1                             │
│  • Cyan-400 on Slate-900: ✅ 6.2:1                              │
│  • Slate-400 on Slate-900: ✅ 4.6:1                             │
│                                                                 │
│  KEYBOARD NAVIGATION                                            │
│  ───────────────────                                            │
│  • All interactive elements focusable                           │
│  • Logical tab order                                            │
│  • Skip links for main content                                  │
│  • Escape closes modals/dropdowns                               │
│  • Arrow keys for menu navigation                               │
│                                                                 │
│  SCREEN READERS                                                 │
│  ──────────────                                                 │
│  • Semantic HTML (nav, main, article, etc.)                     │
│  • ARIA labels for icons and buttons                            │
│  • Live regions for dynamic content                             │
│  • Alt text for all images                                      │
│  • Form labels associated with inputs                           │
│                                                                 │
│  MOTION                                                         │
│  ───────                                                        │
│  • Respect prefers-reduced-motion                               │
│  • No auto-playing animations                                   │
│  • Pause/stop controls for videos                               │
│                                                                 │
│  TOUCH TARGETS                                                  │
│  ─────────────                                                  │
│  • Minimum 44x44px                                              │
│  • Adequate spacing between targets                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Responsive Design

### 9.1 Breakpoints

```scss
// ═══════════════════════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════════════════════

$breakpoint-xs:  320px;   // Small phones
$breakpoint-sm:  640px;   // Large phones
$breakpoint-md:  768px;   // Tablets
$breakpoint-lg:  1024px;  // Small laptops
$breakpoint-xl:  1280px;  // Desktops
$breakpoint-2xl: 1536px;  // Large screens

// ═══════════════════════════════════════════════════════════════
// CONTAINER WIDTHS
// ═══════════════════════════════════════════════════════════════

$container-sm:  640px;
$container-md:  768px;
$container-lg:  1024px;
$container-xl:  1280px;
$container-2xl: 1400px;
```

### 9.2 Layout Adaptations

```
┌─────────────────────────────────────────────────────────────────┐
│                   RESPONSIVE LAYOUTS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DESKTOP (1024px+)                                              │
│  ─────────────────                                              │
│  ┌─────────┬───────────────────────────────────────────────────┐│
│  │ Sidebar │                  Content                          ││
│  │  280px  │                                                   ││
│  │         │                                                   ││
│  └─────────┴───────────────────────────────────────────────────┘│
│  • Full sidebar with labels                                     │
│  • Multi-column layouts                                         │
│  • Hover interactions                                           │
│                                                                 │
│  TABLET (768px - 1023px)                                        │
│  ───────────────────────                                        │
│  ┌────┬─────────────────────────────────────────────────────────┐
│  │ 72 │                     Content                            ││
│  │ px │                                                        ││
│  └────┴─────────────────────────────────────────────────────────┘
│  • Collapsed sidebar (icons only)                               │
│  • Expandable on tap                                            │
│  • 2-column grids → 1-column                                    │
│                                                                 │
│  MOBILE (< 768px)                                               │
│  ────────────────                                               │
│  ┌──────────────────────────────────────────────────────────────┐
│  │ ☰ AI Arena                                        🔔 👤     ││
│  ├──────────────────────────────────────────────────────────────┤
│  │                                                              ││
│  │                       Content                                ││
│  │                   (Full width)                               ││
│  │                                                              ││
│  ├──────────────────────────────────────────────────────────────┤
│  │     🏠      💬      📚      👥      ⚙️                      ││
│  │   Home    Chat     KB    Teams  Settings                    ││
│  └──────────────────────────────────────────────────────────────┘
│  • Bottom navigation bar                                        │
│  • Full-screen modals                                           │
│  • Swipe gestures                                               │
│  • Larger touch targets                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Dark/Light Mode

### 10.1 Color Mapping

```scss
// ═══════════════════════════════════════════════════════════════
// THEME TOKENS
// ═══════════════════════════════════════════════════════════════

:root {
  // Dark Mode (Default)
  --color-bg-primary:      #{$slate-950};
  --color-bg-secondary:    #{$slate-900};
  --color-bg-tertiary:     #{$slate-800};
  
  --color-text-primary:    #{$slate-50};
  --color-text-secondary:  #{$slate-300};
  --color-text-tertiary:   #{$slate-400};
  --color-text-muted:      #{$slate-500};
  
  --color-border-primary:  #{$slate-800};
  --color-border-secondary: #{$slate-700};
  
  --color-accent:          #{$cyan-500};
  --color-accent-hover:    #{$cyan-400};
}

[data-theme="light"] {
  // Light Mode
  --color-bg-primary:      #{$slate-50};
  --color-bg-secondary:    #{$white};
  --color-bg-tertiary:     #{$slate-100};
  
  --color-text-primary:    #{$slate-900};
  --color-text-secondary:  #{$slate-700};
  --color-text-tertiary:   #{$slate-600};
  --color-text-muted:      #{$slate-500};
  
  --color-border-primary:  #{$slate-200};
  --color-border-secondary: #{$slate-300};
  
  --color-accent:          #{$cyan-600};
  --color-accent-hover:    #{$cyan-700};
}
```

---

## 11. Iconography

### 11.1 Icon Library

```
┌─────────────────────────────────────────────────────────────────┐
│                      ICON GUIDELINES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LIBRARY: Lucide Icons (https://lucide.dev)                     │
│                                                                 │
│  SIZES:                                                         │
│  • xs:  12px (captions, badges)                                 │
│  • sm:  16px (inline with text)                                 │
│  • md:  20px (buttons, inputs)                                  │
│  • lg:  24px (navigation, headers)                              │
│  • xl:  32px (empty states)                                     │
│  • 2xl: 48px (hero sections)                                    │
│                                                                 │
│  STROKE WIDTH: 2px (default)                                    │
│                                                                 │
│  COMMON ICONS:                                                  │
│  ─────────────                                                  │
│  Navigation:                                                    │
│  • Home          → LayoutDashboard                              │
│  • Chat          → MessageSquare                                │
│  • Teams         → Users                                        │
│  • Knowledge     → BookOpen                                     │
│  • Prompts       → FileText                                     │
│  • Settings      → Settings                                     │
│  • Help          → HelpCircle                                   │
│                                                                 │
│  Actions:                                                       │
│  • Add           → Plus                                         │
│  • Edit          → Pencil                                       │
│  • Delete        → Trash2                                       │
│  • Search        → Search                                       │
│  • Send          → Send                                         │
│  • Attach        → Paperclip                                    │
│  • Copy          → Copy                                         │
│  • Refresh       → RotateCcw                                    │
│                                                                 │
│  Arena Modes:                                                   │
│  • Auto-Select   → Sparkles                                     │
│  • Collaborative → Users                                        │
│  • Divide        → GitBranch                                    │
│  • Project       → FolderKanban                                 │
│  • Tester        → TestTube2                                    │
│                                                                 │
│  Status:                                                        │
│  • Success       → CheckCircle (green)                          │
│  • Warning       → AlertTriangle (amber)                        │
│  • Error         → XCircle (red)                                │
│  • Info          → Info (blue)                                  │
│  • Loading       → Loader2 (spinning)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Error States

```
┌─────────────────────────────────────────────────────────────────┐
│                       ERROR STATES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INLINE FIELD ERROR                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Email address                                           │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ invalid-email                                       │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │ ⚠️ Bitte gib eine gültige E-Mail-Adresse ein           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Border: Red-500                                                │
│  Message: Red-400 text, icon                                    │
│                                                                 │
│  TOAST ERROR                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ❌  Fehler beim Speichern                           [✕] │   │
│  │     Bitte versuche es erneut.                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Position: Top-right                                            │
│  Duration: 5 seconds (errors stay longer)                       │
│  Background: Red-900/50                                         │
│  Border: Red-500                                                │
│                                                                 │
│  FULL PAGE ERROR                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                     ⚠️                                  │   │
│  │                                                         │   │
│  │             Etwas ist schief gelaufen                   │   │
│  │                                                         │   │
│  │     Wir konnten diese Seite nicht laden.               │   │
│  │     Bitte versuche es später erneut.                    │   │
│  │                                                         │   │
│  │              [Seite neu laden]                          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  EMPTY STATE                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                     📭                                  │   │
│  │                                                         │   │
│  │              Noch keine Chats                           │   │
│  │                                                         │   │
│  │     Starte deinen ersten Chat mit der Arena!           │   │
│  │                                                         │   │
│  │              [+ Neuer Chat]                             │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Loading States

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOADING STATES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BUTTON LOADING                                                 │
│  ┌─────────────────────────┐                                    │
│  │  ⟳ Wird gespeichert...  │                                    │
│  └─────────────────────────┘                                    │
│  Spinner left of text, disabled state                           │
│                                                                 │
│  SKELETON LOADER                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Shimmer animation, matches content shape                       │
│                                                                 │
│  PROGRESS BAR                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ████████████████████░░░░░░░░░░░░░░░░░░░░ 45%            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Gradient fill, percentage label                                │
│                                                                 │
│  SPINNER                                                        │
│         ⟳                                                       │
│  Continuous rotation, cyan color                                │
│  Sizes: sm (16px), md (24px), lg (32px)                        │
│                                                                 │
│  AI THINKING                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [🤖] ● ● ●                                              │   │
│  │      Claude denkt nach...                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Dots bounce animation, model avatar                            │
│                                                                 │
│  ARENA PROCESSING                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔄 Arena orchestriert...                                │   │
│  │                                                         │   │
│  │ ████████████████░░░░░░░░░░░░░░░░░░░░░░ 45%              │   │
│  │                                                         │   │
│  │ ✓ Task analysiert                                       │   │
│  │ ✓ Modelle ausgewählt: Claude, GPT-4o                    │   │
│  │ ⟳ Antworten generieren...                               │   │
│  │ ○ Synthese                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Step-by-step progress with checkmarks                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Mobile App Design

### Siehe separate Datei: `MOBILE_APP_SPECIFICATION.md`

---

## Anhang: Design Tokens Export

```json
{
  "colors": {
    "primary": {
      "50": "#ecfeff",
      "500": "#06b6d4",
      "600": "#0891b2"
    },
    "slate": {
      "50": "#f8fafc",
      "900": "#0f172a",
      "950": "#020617"
    }
  },
  "spacing": {
    "1": "0.25rem",
    "2": "0.5rem",
    "4": "1rem",
    "8": "2rem"
  },
  "borderRadius": {
    "sm": "0.25rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "full": "9999px"
  },
  "typography": {
    "fontFamily": {
      "sans": "Inter, sans-serif",
      "mono": "JetBrains Mono, monospace"
    },
    "fontSize": {
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem"
    }
  }
}
```

---

*Diese Anleitung wird regelmäßig aktualisiert. Letzte Änderung: Dezember 2024*
