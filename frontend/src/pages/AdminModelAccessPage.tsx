import { useState, useEffect } from 'react';
import {
  Shield,
  Check,
  X,
  Clock,
  Zap,
  Crown,
  Star,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';

interface ModelAccessRequest {
  id: string;
  modelId: string;
  modelName: string;
  modelProvider: string;
  modelTier: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  duration: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionNote?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ModelAccess {
  id: string;
  modelId: string;
  modelName: string;
  modelProvider: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  expiresAt: string;
  isExpired: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

const tierConfig = {
  BASIC: { icon: Star, color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Basic' },
  STANDARD: { icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: 'Standard' },
  PREMIUM: { icon: Crown, color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: 'Premium' },
};

export function AdminModelAccessPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [pendingRequests, setPendingRequests] = useState<ModelAccessRequest[]>([]);
  const [allAccesses, setAllAccesses] = useState<ModelAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, accessesRes] = await Promise.all([
        api.get('/models/admin/requests/pending'),
        api.get('/models/admin/accesses'),
      ]);
      setPendingRequests(requestsRes.data.requests || []);
      setAllAccesses(accessesRes.data.accesses || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.post('/models/admin/requests/approve', { requestId });
      toast.success('Anfrage genehmigt');
      fetchData();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Fehler beim Genehmigen');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string, rejectionNote?: string) => {
    setProcessingId(requestId);
    try {
      await api.post('/models/admin/requests/reject', { requestId, rejectionNote });
      toast.success('Anfrage abgelehnt');
      fetchData();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Fehler beim Ablehnen');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    setProcessingId(accessId);
    try {
      await api.delete(`/models/admin/accesses/${accessId}`);
      toast.success('Zugriff entzogen');
      fetchData();
    } catch (error) {
      console.error('Failed to revoke:', error);
      toast.error('Fehler beim Entziehen');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const days = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Zugriff verweigert</h2>
            <p className="text-slate-400">
              Diese Seite ist nur für Administratoren zugänglich.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-cyan-400" />
            Modell-Zugangsverwaltung
          </h1>
          <p className="mt-1 text-slate-400">
            Verwalte Premium-Zugriffsanfragen und aktive Berechtigungen
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Aktualisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingRequests.length}</p>
                <p className="text-sm text-slate-400">Ausstehende Anfragen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {allAccesses.filter(a => !a.isExpired).length}
                </p>
                <p className="text-sm text-slate-400">Aktive Zugriffe</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Crown className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {allAccesses.filter(a => a.tier === 'PREMIUM' && !a.isExpired).length}
                </p>
                <p className="text-sm text-slate-400">Premium-Zugriffe</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Ausstehend ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            <Check className="mr-2 h-4 w-4" />
            Aktive Zugriffe
          </TabsTrigger>
          <TabsTrigger value="expired">
            <X className="mr-2 h-4 w-4" />
            Abgelaufen
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Ausstehende Anfragen</CardTitle>
              <CardDescription>
                Premium-Anfragen, die auf deine Genehmigung warten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine ausstehenden Anfragen</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => {
                    const tier = tierConfig[request.tier];
                    const TierIcon = tier.icon;

                    return (
                      <div
                        key={request.id}
                        className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                              <TierIcon className={`h-5 w-5 ${tier.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white">
                                  {request.modelName}
                                </h3>
                                <Badge variant="outline" className={tier.color}>
                                  {tier.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400">
                                {request.modelProvider}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {request.user.name} ({request.user.email})
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(request.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {request.duration} Tage angefragt
                                </span>
                              </div>
                              {request.reason && (
                                <p className="mt-2 text-sm text-slate-300 bg-slate-900/50 rounded p-2">
                                  "{request.reason}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              isLoading={processingId === request.id}
                              leftIcon={<Check className="h-4 w-4" />}
                            >
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                              disabled={processingId === request.id}
                              leftIcon={<X className="h-4 w-4" />}
                            >
                              Ablehnen
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Accesses */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Aktive Zugriffe</CardTitle>
              <CardDescription>
                Nutzer mit aktiven Premium- oder Standard-Zugriff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                </div>
              ) : allAccesses.filter(a => !a.isExpired).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine aktiven Zugriffe</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allAccesses
                    .filter(a => !a.isExpired)
                    .map((access) => {
                      const tier = tierConfig[access.tier];
                      const TierIcon = tier.icon;
                      const daysRemaining = getDaysRemaining(access.expiresAt);

                      return (
                        <div
                          key={access.id}
                          className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                              <TierIcon className={`h-5 w-5 ${tier.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-white">
                                  {access.modelName}
                                </h3>
                                <Badge variant="outline" className={tier.color}>
                                  {tier.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400">
                                {access.user.name} ({access.user.email})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                daysRemaining <= 1 ? 'text-red-400' :
                                daysRemaining <= 3 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>
                                {daysRemaining} Tage verbleibend
                              </p>
                              <p className="text-xs text-slate-500">
                                Endet: {formatDate(access.expiresAt)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevokeAccess(access.id)}
                              disabled={processingId === access.id}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired Accesses */}
        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Abgelaufene Zugriffe</CardTitle>
              <CardDescription>
                Zugriffe, die abgelaufen sind
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                </div>
              ) : allAccesses.filter(a => a.isExpired).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <X className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine abgelaufenen Zugriffe</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allAccesses
                    .filter(a => a.isExpired)
                    .map((access) => {
                      const tier = tierConfig[access.tier];
                      const TierIcon = tier.icon;

                      return (
                        <div
                          key={access.id}
                          className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 flex items-center justify-between opacity-60"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${tier.bgColor} opacity-50`}>
                              <TierIcon className={`h-5 w-5 ${tier.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-white">
                                  {access.modelName}
                                </h3>
                                <Badge variant="outline" className="opacity-50">
                                  {tier.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-400">
                                {access.user.name} ({access.user.email})
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-red-400">Abgelaufen</p>
                            <p className="text-xs text-slate-500">
                              {formatDate(access.expiresAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
