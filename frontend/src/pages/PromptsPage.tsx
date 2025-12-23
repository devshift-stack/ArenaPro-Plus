import { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Copy,
  MoreVertical,
  Edit,
  Trash2,
  Sparkles,
  Code,
  MessageSquare,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/contexts/ToastContext';
import { copyToClipboard } from '@/lib/utils';

// Mock data
const prompts = [
  {
    id: '1',
    title: 'Code Review Expert',
    content: 'Du bist ein erfahrener Software-Entwickler. Analysiere den folgenden Code auf: 1) Bugs und Fehler, 2) Performance-Probleme, 3) Best Practices, 4) Verbesserungsvorschläge. Sei konstruktiv und erkläre deine Vorschläge.',
    category: 'development',
    isFavorite: true,
    usageCount: 45,
    createdAt: '2024-10-15',
  },
  {
    id: '2',
    title: 'Creative Writer',
    content: 'Du bist ein kreativer Autor mit einem Talent für fesselnde Geschichten. Schreibe in einem lebendigen, bildhaften Stil. Achte auf Charakterentwicklung und Spannung.',
    category: 'creative',
    isFavorite: true,
    usageCount: 32,
    createdAt: '2024-11-01',
  },
  {
    id: '3',
    title: 'Business Analyst',
    content: 'Du bist ein erfahrener Business Analyst. Analysiere Geschäftsanforderungen systematisch, identifiziere Risiken und schlage datengetriebene Lösungen vor.',
    category: 'business',
    isFavorite: false,
    usageCount: 18,
    createdAt: '2024-11-20',
  },
  {
    id: '4',
    title: 'API Documentation',
    content: 'Erstelle eine vollständige API-Dokumentation im OpenAPI/Swagger-Format. Dokumentiere alle Endpoints, Parameter, Responses und Beispiele.',
    category: 'development',
    isFavorite: false,
    usageCount: 27,
    createdAt: '2024-12-01',
  },
];

const categories = [
  { id: 'all', label: 'Alle', icon: FileText },
  { id: 'development', label: 'Entwicklung', icon: Code },
  { id: 'creative', label: 'Kreativ', icon: Sparkles },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'conversation', label: 'Chat', icon: MessageSquare },
];

export function PromptsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const toast = useToast();

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'all' || prompt.category === activeCategory;

    const matchesFavorites = !showFavoritesOnly || prompt.isFavorite;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const handleCopy = async (content: string) => {
    await copyToClipboard(content);
    toast.success('Kopiert!', 'Prompt wurde in die Zwischenablage kopiert.');
  };

  const handleUsePrompt = (prompt: typeof prompts[0]) => {
    // TODO: Navigate to chat with prompt pre-filled
    toast.info('Prompt verwenden', `"${prompt.title}" wird in neuem Chat verwendet.`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-cyan-400" />
            Prompt-Bibliothek
          </h1>
          <p className="mt-1 text-slate-400">
            Speichere und organisiere deine besten Prompts
          </p>
        </div>

        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Neuer Prompt
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Prompts durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="flex-1"
        />

        <Button
          variant={showFavoritesOnly ? 'default' : 'outline'}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          leftIcon={<Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />}
        >
          Favoriten
        </Button>
      </div>

      {/* Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              <category.icon className="mr-2 h-4 w-4" />
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory}>
          {/* Prompts Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} variant="interactive">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{prompt.title}</h3>
                      {prompt.isFavorite && (
                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopy(prompt.content)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Kopieren
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          {prompt.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                    {prompt.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {categories.find((c) => c.id === prompt.category)?.label}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {prompt.usageCount}x verwendet
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUsePrompt(prompt)}
                    >
                      Verwenden
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredPrompts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-lg font-semibold text-white">
                  Keine Prompts gefunden
                </h3>
                <p className="mt-2 text-slate-400">
                  {searchQuery || showFavoritesOnly
                    ? 'Versuche andere Suchbegriffe oder Filter.'
                    : 'Erstelle deinen ersten Prompt.'}
                </p>
                {!searchQuery && !showFavoritesOnly && (
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Prompt erstellen
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
