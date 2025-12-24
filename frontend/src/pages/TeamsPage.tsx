import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Settings,
  UserPlus,
  Mail,
  Crown,
  Shield,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { teamsApi } from '@/utils/api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  chatsCount?: number;
  createdAt: string;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: Users,
};

const roleBadges = {
  owner: 'warning',
  admin: 'primary',
  member: 'default',
} as const;

export function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teams
  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await teamsApi.getTeams();
      return response.data.teams as Team[];
    },
  });

  const teams = teamsData || [];

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return teamsApi.createTeam(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: 'Team erstellt',
        description: 'Das Team wurde erfolgreich erstellt.',
      });
      setIsCreateDialogOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Team konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      return teamsApi.inviteMember(teamId, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: 'Einladung gesendet',
        description: 'Die Einladung wurde erfolgreich gesendet.',
      });
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setSelectedTeamId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Einladung konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    },
  });

  // Leave team mutation
  const leaveTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return teamsApi.leaveTeam(teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: 'Team verlassen',
        description: 'Du hast das Team verlassen.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Team konnte nicht verlassen werden.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    createTeamMutation.mutate({
      name: newTeamName.trim(),
      description: newTeamDescription.trim() || undefined,
    });
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedTeamId) return;
    inviteMemberMutation.mutate({
      teamId: selectedTeamId,
      email: inviteEmail.trim(),
    });
  };

  const handleLeaveTeam = (teamId: string) => {
    if (window.confirm('Möchtest du dieses Team wirklich verlassen?')) {
      leaveTeamMutation.mutate(teamId);
    }
  };

  const openInviteDialog = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsInviteDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Teams</h1>
          <p className="mt-1 text-slate-400">
            Verwalte deine Teams und Mitglieder
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Neues Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Team erstellen</DialogTitle>
              <DialogDescription>
                Erstelle ein neues Team um mit anderen zusammenzuarbeiten.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team-Name</Label>
                <Input
                  id="name"
                  placeholder="z.B. Entwicklung"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  placeholder="Worum geht es in diesem Team?"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim() || createTeamMutation.isPending}
              >
                {createTeamMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Team erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Teams durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      )}

      {/* Teams Grid */}
      {!isLoading && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredTeams.map((team) => (
          <Card key={team.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  {team.name}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-400">{team.description}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Einstellungen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openInviteDialog(team.id)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Mitglied einladen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-400"
                    onClick={() => handleLeaveTeam(team.id)}
                  >
                    Team verlassen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="mb-4 flex items-center gap-4 text-sm">
                <span className="text-slate-400">
                  <strong className="text-white">{team.members.length}</strong> Mitglieder
                </span>
                <span className="text-slate-400">
                  <strong className="text-white">{team.chatsCount}</strong> Chats
                </span>
              </div>

              {/* Members */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Mitglieder
                </p>
                {team.members.map((member) => {
                  const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback>
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={roleBadges[member.role as keyof typeof roleBadges]}>
                        <RoleIcon className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Invite Button */}
              <Button
                variant="outline"
                className="w-full mt-4"
                size="sm"
                onClick={() => openInviteDialog(team.id)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Mitglied einladen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied einladen</DialogTitle>
            <DialogDescription>
              Gib die E-Mail-Adresse der Person ein, die du einladen möchtest.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="beispiel@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsInviteDialogOpen(false);
                setInviteEmail('');
                setSelectedTeamId(null);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
            >
              {inviteMemberMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Einladung senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!isLoading && filteredTeams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              Keine Teams gefunden
            </h3>
            <p className="mt-2 text-slate-400">
              {searchQuery
                ? 'Versuche einen anderen Suchbegriff.'
                : 'Erstelle dein erstes Team um loszulegen.'}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Team erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
