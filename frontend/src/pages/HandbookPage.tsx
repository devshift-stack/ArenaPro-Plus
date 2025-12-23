import { useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronRight,
  Sparkles,
  Users,
  GitBranch,
  FolderKanban,
  TestTube2,
  Brain,
  MessageSquare,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const sections = [
  {
    id: 'getting-started',
    title: 'Erste Schritte',
    icon: Zap,
    articles: [
      { id: '1', title: 'Was ist AI Arena?', readTime: '3 min' },
      { id: '2', title: 'Deinen ersten Chat starten', readTime: '5 min' },
      { id: '3', title: 'Die Oberfläche verstehen', readTime: '4 min' },
    ],
  },
  {
    id: 'arena-modes',
    title: 'Arena-Modi',
    icon: Sparkles,
    articles: [
      { id: '4', title: 'Auto-Select Modus', readTime: '4 min', icon: Sparkles },
      { id: '5', title: 'Collaborative Modus', readTime: '6 min', icon: Users },
      { id: '6', title: 'Divide & Conquer Modus', readTime: '5 min', icon: GitBranch },
      { id: '7', title: 'Project Modus', readTime: '7 min', icon: FolderKanban },
      { id: '8', title: 'Tester Modus', readTime: '5 min', icon: TestTube2 },
    ],
  },
  {
    id: 'memory',
    title: 'Memory System',
    icon: Brain,
    articles: [
      { id: '9', title: 'Wie funktioniert Memory?', readTime: '6 min' },
      { id: '10', title: 'Memory-Einstellungen', readTime: '4 min' },
      { id: '11', title: 'Datenschutz & Privatsphäre', readTime: '5 min' },
    ],
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    icon: BookOpen,
    articles: [
      { id: '12', title: 'Wissen hinzufügen', readTime: '4 min' },
      { id: '13', title: 'Verifiziertes vs. Beta Wissen', readTime: '3 min' },
      { id: '14', title: 'Wissen in Chats nutzen', readTime: '5 min' },
    ],
  },
  {
    id: 'teams',
    title: 'Team-Funktionen',
    icon: Users,
    articles: [
      { id: '15', title: 'Ein Team erstellen', readTime: '4 min' },
      { id: '16', title: 'Mitglieder verwalten', readTime: '5 min' },
      { id: '17', title: 'Geteilte Chats', readTime: '4 min' },
    ],
  },
  {
    id: 'chat',
    title: 'Chat-Funktionen',
    icon: MessageSquare,
    articles: [
      { id: '18', title: 'Nachrichten formatieren', readTime: '3 min' },
      { id: '19', title: 'Code-Blöcke verwenden', readTime: '4 min' },
      { id: '20', title: 'Dateien hochladen', readTime: '3 min' },
    ],
  },
];

const featuredGuides = [
  {
    title: 'Schnellstart-Guide',
    description: 'Lerne die Grundlagen in 5 Minuten',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Arena-Modi meistern',
    description: 'Wähle den richtigen Modus für jede Aufgabe',
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Memory optimal nutzen',
    description: 'Personalisiere deine AI-Erfahrung',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-500',
  },
];

export function HandbookPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const filteredSections = sections.filter((section) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.articles.some((article) =>
        article.title.toLowerCase().includes(query)
      )
    );
  });

  const selectedSectionData = sections.find((s) => s.id === selectedSection);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 mb-4">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Handbuch</h1>
        <p className="mt-2 text-slate-400 max-w-lg mx-auto">
          Alles was du über AI Arena wissen musst – von den Grundlagen bis zu
          fortgeschrittenen Funktionen.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-8">
        <Input
          placeholder="Im Handbuch suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="h-12"
        />
      </div>

      {/* Featured Guides */}
      {!searchQuery && !selectedSection && (
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          {featuredGuides.map((guide) => (
            <Card
              key={guide.title}
              variant="interactive"
              className="overflow-hidden"
            >
              <CardContent className="p-4">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${guide.gradient} mb-3`}
                >
                  <guide.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">{guide.title}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {guide.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inhalt</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-1">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() =>
                        setSelectedSection(
                          selectedSection === section.id ? null : section.id
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedSection === section.id
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <section.icon className="h-4 w-4" />
                        {section.title}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          selectedSection === section.id ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedSectionData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                    <selectedSectionData.icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <CardTitle>{selectedSectionData.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedSectionData.articles.map((article) => {
                    const ArticleIcon = (article as any).icon || BookOpen;
                    return (
                      <button
                        key={article.id}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-4 text-left transition-colors hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <ArticleIcon className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-white">
                            {article.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{article.readTime}</Badge>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-800/50 p-4 text-left transition-colors hover:bg-slate-800"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 flex-shrink-0">
                        <section.icon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {section.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {section.articles.length} Artikel
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="mt-6">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <HelpCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Brauchst du Hilfe?</p>
                <p className="text-sm text-slate-400">
                  Unser Support-Team ist für dich da.
                </p>
              </div>
              <button className="text-sm text-cyan-400 hover:underline">
                Kontaktieren
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
