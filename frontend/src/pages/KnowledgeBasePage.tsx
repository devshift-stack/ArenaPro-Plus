import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Tag,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatRelativeTime } from '@/lib/utils';

// Mock data
const entries = [
  {
    id: '1',
    title: 'React Best Practices 2024',
    content: 'Eine Sammlung der besten Praktiken für moderne React-Entwicklung...',
    tags: ['react', 'frontend', 'best-practices'],
    status: 'verified',
    source: 'manual',
    createdAt: '2024-11-15T10:30:00Z',
    updatedAt: '2024-12-01T14:20:00Z',
  },
  {
    id: '2',
    title: 'TypeScript Generics Erklärung',
    content: 'Generics ermöglichen wiederverwendbare Komponenten die mit verschiedenen Typen arbeiten...',
    tags: ['typescript', 'generics'],
    status: 'beta',
    source: 'ai-extracted',
    createdAt: '2024-11-20T09:15:00Z',
    updatedAt: '2024-11-20T09:15:00Z',
  },
  {
    id: '3',
    title: 'API Design Patterns',
    content: 'RESTful API Design Patterns und Best Practices für skalierbare Backends...',
    tags: ['api', 'backend', 'design-patterns'],
    status: 'pending',
    source: 'imported',
    createdAt: '2024-12-10T16:45:00Z',
    updatedAt: '2024-12-10T16:45:00Z',
  },
];

const statusConfig = {
  verified: {
    label: 'Verifiziert',
    icon: CheckCircle,
    variant: 'success' as const,
  },
  beta: {
    label: 'Beta',
    icon: AlertCircle,
    variant: 'warning' as const,
  },
  pending: {
    label: 'Ausstehend',
    icon: Clock,
    variant: 'default' as const,
  },
};

export function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags)));

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' || entry.status === activeTab;

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => entry.tags.includes(tag));

    return matchesSearch && matchesTab && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-cyan-400" />
            Knowledge Base
          </h1>
          <p className="mt-1 text-slate-400">
            Verwalte dein Wissen für bessere AI-Antworten
          </p>
        </div>

        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Neuer Eintrag
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Einträge durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="flex-1"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {allTags.map((tag) => (
              <DropdownMenuItem
                key={tag}
                onClick={() => toggleTag(tag)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
                {selectedTags.includes(tag) && (
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Tag Filters */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="primary"
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <span className="ml-1">×</span>
            </Badge>
          ))}
          <button
            onClick={() => setSelectedTags([])}
            className="text-sm text-slate-400 hover:text-white"
          >
            Alle entfernen
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            Alle ({entries.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verifiziert ({entries.filter((e) => e.status === 'verified').length})
          </TabsTrigger>
          <TabsTrigger value="beta">
            Beta ({entries.filter((e) => e.status === 'beta').length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ausstehend ({entries.filter((e) => e.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Entries List */}
          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              const status = statusConfig[entry.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <Card key={entry.id} variant="interactive">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <h3 className="font-semibold text-white truncate">
                            {entry.title}
                          </h3>
                          <Badge variant={status.variant}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                          {entry.content}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          {entry.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-slate-800"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                          <span className="text-xs text-slate-500">
                            Aktualisiert {formatRelativeTime(entry.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          {entry.status !== 'verified' && (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Als verifiziert markieren
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredEntries.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-lg font-semibold text-white">
                  Keine Einträge gefunden
                </h3>
                <p className="mt-2 text-slate-400">
                  {searchQuery || selectedTags.length > 0
                    ? 'Versuche andere Suchbegriffe oder Filter.'
                    : 'Füge deinen ersten Wissenseintrag hinzu.'}
                </p>
                {!searchQuery && selectedTags.length === 0 && (
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Eintrag erstellen
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
