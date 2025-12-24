import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { knowledgeApi } from '@/utils/api';
import { formatRelativeTime } from '@/lib/utils';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', tags: '' });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch entries
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn: async () => {
      const response = await knowledgeApi.getEntries();
      return response.data.entries as KnowledgeEntry[];
    },
  });

  const entries = entriesData || [];

  // Get all unique tags
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags || [])));

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' || entry.status === activeTab;

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => (entry.tags || []).includes(tag));

    return matchesSearch && matchesTab && matchesTags;
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; tags: string[] }) => {
      return knowledgeApi.createEntry(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      toast({
        title: 'Eintrag erstellt',
        description: 'Der Wissenseintrag wurde erfolgreich erstellt.',
      });
      setIsCreateDialogOpen(false);
      setNewEntry({ title: '', content: '', tags: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Eintrag konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    },
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; content?: string; tags?: string[]; status?: string } }) => {
      return knowledgeApi.updateEntry(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      toast({
        title: 'Eintrag aktualisiert',
        description: 'Der Wissenseintrag wurde erfolgreich aktualisiert.',
      });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Eintrag konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      return knowledgeApi.deleteEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      toast({
        title: 'Eintrag gelöscht',
        description: 'Der Wissenseintrag wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Eintrag konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    const tags = newEntry.tags.split(',').map(t => t.trim()).filter(Boolean);
    createEntryMutation.mutate({
      title: newEntry.title.trim(),
      content: newEntry.content.trim(),
      tags,
    });
  };

  const handleUpdateEntry = () => {
    if (!editingEntry) return;
    const tags = typeof editingEntry.tags === 'string'
      ? (editingEntry.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
      : editingEntry.tags;
    updateEntryMutation.mutate({
      id: editingEntry.id,
      data: {
        title: editingEntry.title,
        content: editingEntry.content,
        tags,
      },
    });
  };

  const handleVerifyEntry = (entry: KnowledgeEntry) => {
    updateEntryMutation.mutate({
      id: entry.id,
      data: { status: 'verified' },
    });
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
      deleteEntryMutation.mutate(id);
    }
  };

  const openEditDialog = (entry: KnowledgeEntry) => {
    setEditingEntry({
      ...entry,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
    });
    setIsEditDialogOpen(true);
  };

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

        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Neuer Eintrag
        </Button>
      </div>

      {/* Create Entry Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Neuen Eintrag erstellen</DialogTitle>
            <DialogDescription>
              Füge einen neuen Wissenseintrag hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                placeholder="z.B. React Best Practices"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Inhalt</Label>
              <Textarea
                id="content"
                placeholder="Beschreibe das Wissen..."
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (kommagetrennt)</Label>
              <Input
                id="tags"
                placeholder="z.B. react, frontend, best-practices"
                value={newEntry.tags}
                onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateEntry}
              disabled={!newEntry.title.trim() || !newEntry.content.trim() || createEntryMutation.isPending}
            >
              {createEntryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Eintrag bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite den Wissenseintrag.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titel</Label>
                <Input
                  id="edit-title"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Inhalt</Label>
                <Textarea
                  id="edit-content"
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (kommagetrennt)</Label>
                <Input
                  id="edit-tags"
                  value={Array.isArray(editingEntry.tags) ? editingEntry.tags.join(', ') : editingEntry.tags}
                  onChange={(e) => setEditingEntry({ ...editingEntry, tags: e.target.value.split(',').map(t => t.trim()) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingEntry(null);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdateEntry}
              disabled={updateEntryMutation.isPending}
            >
              {updateEntryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          )}

          {/* Entries List */}
          {!isLoading && (
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
                          <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          {entry.status !== 'verified' && (
                            <DropdownMenuItem onClick={() => handleVerifyEntry(entry)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Als verifiziert markieren
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
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
          )}

          {/* Empty State */}
          {!isLoading && filteredEntries.length === 0 && (
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
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
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
