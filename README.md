# 🏛️ AI Arena

## Multi-Model Orchestration Platform

AI Arena ist eine fortschrittliche Plattform, die verschiedene KI-Modelle über OpenRouter zusammenbringt, um komplexe Aufgaben kollaborativ zu lösen.

![AI Arena Banner](docs/images/banner.png)

---

## ✨ Features

### 🎯 5 Arena-Modi

| Modus | Beschreibung |
|-------|-------------|
| **Auto-Select** | Arena wählt automatisch das beste Modell für die Aufgabe |
| **Collaborative** | Mehrere Modelle arbeiten zusammen, Ergebnisse werden synthetisiert |
| **Divide & Conquer** | Aufgabe wird aufgeteilt, spezialisierte Modelle bearbeiten Teilaufgaben |
| **Project Mode** | Kollaborative Planung → Spezialisierte Ausführung → Review |
| **Tester Mode** | Automatisierte Tests mit Cross-Verification |

### 📚 Dual Knowledge Base

- **KB Beta**: Unverified knowledge, automatisch extrahiert
- **KB Right**: 3x verifiziertes, produktionsreifes Wissen
- Semantische Suche mit Vector Embeddings

### 🧠 Persistentes Gedächtnis

- Unbegrenztes Gedächtnis pro User/Team
- AES-256-GCM Verschlüsselung
- Alle Modelle teilen das Gedächtnis

### 📝 Self-Improving Prompt Library

- Auto-Suggestion basierend auf Eingabe
- A/B-Testing von Prompt-Varianten
- Kontinuierliche Verbesserung durch Feedback

### 📜 Agent Rulebook

- Verbindliche Regeln für alle Agenten
- Sicherheits-, Ethik- und Qualitätsrichtlinien
- Automatische Durchsetzung

### 🔗 Integrationen

- Google Drive
- GitHub
- Local File Upload/Download

---

## 🚀 Schnellstart

### Voraussetzungen

- Docker & Docker Compose
- Node.js 20+ (für lokale Entwicklung)
- OpenRouter API Key
- OpenAI API Key (für Embeddings)

### Installation

```bash
# Repository klonen
git clone https://github.com/your-org/ai-arena.git
cd ai-arena

# Setup ausführen
./scripts/setup.sh

# API Keys in .env eintragen
nano .env

# Starten
docker compose up -d
```

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| MinIO Console | http://localhost:9001 |

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI ARENA                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   React     │    │   Node.js   │    │ PostgreSQL  │         │
│  │   Frontend  │◄──►│   Backend   │◄──►│ + pgvector  │         │
│  └─────────────┘    └──────┬──────┘    └─────────────┘         │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  ORCHESTRATION LAYER                     │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │ Router  │  │ Memory  │  │   KB    │  │ Prompts │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    OPENROUTER API                        │   │
│  │  Claude │ GPT-4 │ Gemini │ Mistral │ DeepSeek │ Llama   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Projektstruktur

```
ai-arena/
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── api/            # API Routes
│   │   ├── services/       # Business Logic
│   │   ├── utils/          # Utilities
│   │   ├── websocket/      # WebSocket Handler
│   │   └── config/         # Konfiguration
│   └── prisma/             # Datenbank Schema
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # UI Komponenten
│   │   ├── pages/          # Seiten
│   │   ├── contexts/       # React Contexts
│   │   ├── hooks/          # Custom Hooks
│   │   └── utils/          # Utilities
├── docs/                   # Dokumentation
│   ├── PROJECT_DOCUMENTATION.md
│   ├── USER_HANDBOOK.md
│   └── RULEBOOK.md
├── scripts/                # Setup Scripts
├── docker-compose.yml      # Docker Konfiguration
└── .env.example           # Umgebungsvariablen Template
```

---

## 🔧 Entwicklung

### Backend starten

```bash
cd backend
npm install
npm run dev
```

### Frontend starten

```bash
cd frontend
npm install
npm run dev
```

### Datenbank

```bash
cd backend

# Prisma Client generieren
npx prisma generate

# Schema auf DB anwenden
npx prisma db push

# Prisma Studio (DB Browser)
npx prisma studio
```

---

## 🔐 Sicherheit

- **Authentifizierung**: JWT mit Access/Refresh Tokens
- **Verschlüsselung**: AES-256-GCM für Gedächtnis & sensible Daten
- **Rate Limiting**: Schutz vor Überlastung
- **Input Validation**: Zod Schema Validation
- **CORS**: Konfigurierbare Origin-Whitelist

---

## 📊 Unterstützte Modelle

| Modell | Provider | Stärken |
|--------|----------|---------|
| Claude 3.5 Sonnet | Anthropic | Reasoning, Code, Writing |
| Claude 3 Opus | Anthropic | Best Quality, Complex Tasks |
| GPT-4o | OpenAI | Multimodal, Fast |
| GPT-4 Turbo | OpenAI | Reasoning, Code |
| Gemini 1.5 Pro | Google | Long Context, Research |
| DeepSeek Coder | DeepSeek | Code Specialist |
| Perplexity Sonar | Perplexity | Real-time Research |
| Mistral Large | Mistral | Reasoning, Code |
| Llama 3.1 405B | Meta | Open Source, Creative |

---

## 📈 Roadmap

- [x] 5 Arena-Modi
- [x] Knowledge Base System
- [x] Persistentes Gedächtnis
- [x] Prompt Library
- [x] Agent Rulebook
- [ ] Voice Input/Output
- [ ] Plugin System
- [ ] Mobile App
- [ ] Self-Hosting Wizard
- [ ] Enterprise Features

---

## 🤝 Contributing

Beiträge sind willkommen! Bitte lies unsere [Contributing Guidelines](CONTRIBUTING.md).

---

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

## 🙏 Credits

- [OpenRouter](https://openrouter.ai) - Multi-Model API
- [Anthropic](https://anthropic.com) - Claude Models
- [OpenAI](https://openai.com) - GPT Models & Embeddings
- Alle anderen großartigen KI-Modell-Anbieter

---

**Made with ❤️ for the AI Community**
