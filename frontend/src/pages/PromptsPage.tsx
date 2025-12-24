import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { promptsApi } from '@/utils/api';
import { copyToClipboard } from '@/lib/utils';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
}

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'development' });

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch prompts
  const { data: promptsData, isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const response = await promptsApi.getPrompts();
      return response.data.prompts as Prompt[];
    },
  });

  const prompts = promptsData || [];

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'all' || prompt.category === activeCategory;

    const matchesFavorites = !showFavoritesOnly || prompt.isFavorite;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Create prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string }) => {
      return promptsApi.createPrompt(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt erstellt',
        description: 'Der Prompt wurde erfolgreich erstellt.',
      });
      setIsCreateDialogOpen(false);
      setNewPrompt({ title: '', content: '', category: 'development' });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Prompt konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    },
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Prompt> }) => {
      return promptsApi.updatePrompt(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt aktualisiert',
        description: 'Der Prompt wurde erfolgreich aktualisiert.',
      });
      setIsEditDialogOpen(false);
      setEditingPrompt(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Prompt konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    },
  });

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      return promptsApi.deletePrompt(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt gelöscht',
        description: 'Der Prompt wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Prompt konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    },
  });

  const handleCreatePrompt = () => {
    if (!newPrompt.title.trim() || !newPrompt.content.trim()) return;
    createPromptMutation.mutate({
      title: newPrompt.title.trim(),
      content: newPrompt.content.trim(),
      category: newPrompt.category,
    });
  };

  const handleUpdatePrompt = () => {
    if (!editingPrompt) return;
    updatePromptMutation.mutate({
      id: editingPrompt.id,
      data: {
        title: editingPrompt.title,
        content: editingPrompt.content,
        category: editingPrompt.category,
      },
    });
  };

  const handleToggleFavorite = (prompt: Prompt) => {
    updatePromptMutation.mutate({
      id: prompt.id,
      data: { isFavorite: !prompt.isFavorite },
    });
  };

  const handleDeletePrompt = (id: string) => {
    if (window.confirm('Möchtest du diesen Prompt wirklich löschen?')) {
      deletePromptMutation.mutate(id);
    }
  };

  const openEditDialog = (prompt: Prompt) => {
    setEditingPrompt({ ...prompt });
    setIsEditDialogOpen(true);
  };

  const handleCopy = async (content: string) => {
    await copyToClipboard(content);
    toast({
      title: 'Kopiert!',
      description: 'Prompt wurde in die Zwischenablage kopiert.',
    });
  };

  const handleUsePrompt = (prompt: Prompt) => {
    // Navigate to chat with prompt pre-filled via query param
    navigate(`/chat/new?prompt=${encodeURIComponent(prompt.content)}`);
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

        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Neuer Prompt
        </Button>
      </div>

      {/* Create Prompt Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Neuen Prompt erstellen</DialogTitle>
            <DialogDescription>
              Erstelle einen neuen Prompt für deine Bibliothek.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                placeholder="z.B. Code Review Expert"
                value={newPrompt.title}
                onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Prompt-Inhalt</Label>
              <Textarea
                id="content"
                placeholder="Beschreibe den Prompt..."
                value={newPrompt.content}
                onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={newPrompt.category}
                onValueChange={(value) => setNewPrompt({ ...newPrompt, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.id !== 'all').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreatePrompt}
              disabled={!newPrompt.title.trim() || !newPrompt.content.trim() || createPromptMutation.isPending}
            >
              {createPromptMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prompt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Prompt bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite den Prompt.
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titel</Label>
                <Input
                  id="edit-title"
                  value={editingPrompt.title}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Prompt-Inhalt</Label>
                <Textarea
                  id="edit-content"
                  value={editingPrompt.content}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategorie</Label>
                <Select
                  value={editingPrompt.category}
                  onValueChange={(value) => setEditingPrompt({ ...editingPrompt, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.id !== 'all').map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPrompt(null);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdatePrompt}
              disabled={updatePromptMutation.isPending}
            >
              {updatePromptMutation.isPending && (
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
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          )}

          {/* Prompts Grid */}
          {!isLoading && (
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
                        <DropdownMenuItem onClick={() => openEditDialog(prompt)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFavorite(prompt)}>
                          <Star className="mr-2 h-4 w-4" />
                          {prompt.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={() => handleDeletePrompt(prompt.id)}
                        >
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
          )}

          {/* Empty State */}
          {!isLoading && filteredPrompts.length === 0 && (
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
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
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
