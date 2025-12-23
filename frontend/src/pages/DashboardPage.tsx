import { Link } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  BookOpen,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  Users,
  Brain,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useStats } from '@/hooks/useStats';
import { formatRelativeTime } from '@/lib/utils';

const quickActions = [
  {
    title: 'Code Review',
    description: 'Lass deinen Code analysieren',
    icon: FileText,
    mode: 'auto-select',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Brainstorming',
    description: 'Mehrere KIs für Ideen',
    icon: Users,
    mode: 'collaborative',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Recherche',
    description: 'Aufgaben verteilen',
    icon: BookOpen,
    mode: 'divide-conquer',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { chats, isLoadingChats } = useChat();
  const { arenaStats, knowledgeStats, memoryStats, isLoading: isLoadingStats } = useStats();

  const recentChats = chats?.slice(0, 5) || [];

  // Build stats array from real data
  const stats = [
    {
      name: 'Chats',
      value: arenaStats.totalChats.toLocaleString(),
      change: 'gesamt',
      icon: MessageSquare,
      color: 'cyan',
    },
    {
      name: 'Nachrichten',
      value: arenaStats.totalMessages.toLocaleString(),
      change: `${(arenaStats.totalTokens / 1000).toFixed(0)}k Tokens`,
      icon: FileText,
      color: 'blue',
    },
    {
      name: 'KB Einträge',
      value: knowledgeStats.total.toLocaleString(),
      change: `${knowledgeStats.verified} verifiziert`,
      icon: BookOpen,
      color: 'green',
    },
    {
      name: 'Kosten',
      value: `$${arenaStats.estimatedCost}`,
      change: 'geschätzt',
      icon: DollarSign,
      color: 'amber',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Willkommen zurück, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="mt-1 text-slate-400">
          Hier ist dein Überblick für heute
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.name}</p>
                  {isLoadingStats ? (
                    <div className="mt-1 h-8 w-16 animate-pulse rounded bg-slate-800" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  )}
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    {stat.change}
                  </p>
                </div>
                <div className={`rounded-lg bg-${stat.color}-500/10 p-3`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                </div>
              </div>
            </CardContent>
            <div
              className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600`}
            />
          </Card>
        ))}
      </div>

      {/* New Chat CTA */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Bereit für einen neuen Chat?
              </h2>
              <p className="text-slate-400">
                Starte eine Konversation mit der AI Arena
              </p>
            </div>
          </div>
          <Link to="/chat/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Neuer Chat
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Chats */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Letzte Chats</h2>
            <Link
              to="/chats"
              className="flex items-center gap-1 text-sm text-cyan-400 hover:underline"
            >
              Alle anzeigen <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoadingChats ? (
              // Skeleton Loading
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded bg-slate-800" />
                        <div className="h-3 w-1/2 rounded bg-slate-800" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <Link key={chat.id} to={`/chat/${chat.id}`}>
                  <Card variant="interactive">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                          <MessageSquare className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {chat.title || 'Unbenannter Chat'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="primary" className="text-xs">
                              {chat.mode || 'auto-select'}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(chat.updatedAt || chat.createdAt)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-500" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-600" />
                  <p className="mt-4 text-slate-400">Noch keine Chats</p>
                  <Link to="/chat/new">
                    <Button variant="outline" className="mt-4">
                      <Plus className="h-4 w-4" />
                      Ersten Chat starten
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Schnellstart
          </h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={`/chat/new?mode=${action.mode}`}>
                <Card variant="interactive">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${action.gradient}`}
                      >
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{action.title}</p>
                        <p className="text-sm text-slate-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Memory Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-cyan-400" />
                Memory Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Gespeicherte Fakten</span>
                    <span className="text-white font-medium">{memoryStats.facts}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Präferenzen</span>
                    <span className="text-white font-medium">{memoryStats.preferences}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Kontext-Einträge</span>
                    <span className="text-white font-medium">{memoryStats.context}</span>
                  </div>
                </div>
              )}
              <Link to="/memory">
                <Button variant="ghost" className="w-full mt-4" size="sm">
                  Memory verwalten
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
