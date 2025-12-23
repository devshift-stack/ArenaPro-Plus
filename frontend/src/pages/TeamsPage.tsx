import { useState } from 'react';
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

// Mock data
const teams = [
  {
    id: '1',
    name: 'Entwicklung',
    description: 'Frontend & Backend Team',
    members: [
      { id: '1', name: 'Max Müller', email: 'max@example.com', role: 'owner', avatar: null },
      { id: '2', name: 'Anna Schmidt', email: 'anna@example.com', role: 'admin', avatar: null },
      { id: '3', name: 'Tom Weber', email: 'tom@example.com', role: 'member', avatar: null },
    ],
    chatsCount: 45,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Marketing',
    description: 'Content & Social Media',
    members: [
      { id: '4', name: 'Lisa Klein', email: 'lisa@example.com', role: 'owner', avatar: null },
      { id: '5', name: 'Jan Bauer', email: 'jan@example.com', role: 'member', avatar: null },
    ],
    chatsCount: 23,
    createdAt: '2024-02-20',
  },
];

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
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeam = () => {
    // TODO: API call
    console.log('Creating team:', { name: newTeamName, description: newTeamDescription });
    setIsCreateDialogOpen(false);
    setNewTeamName('');
    setNewTeamDescription('');
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
              <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
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

      {/* Teams Grid */}
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
                  <DropdownMenuItem>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Mitglied einladen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-400">
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
              <Button variant="outline" className="w-full mt-4" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Mitglied einladen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
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
