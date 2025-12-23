import { useState, useEffect } from 'react';
import {
  Brain, CheckCircle, XCircle, Clock, AlertTriangle, Sparkles,
  TrendingUp, Shield, Eye, ThumbsUp, ThumbsDown, ChevronDown,
  ChevronUp, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/contexts/ToastContext';
import api from '@/utils/api';

interface ProposedRule {
  id: string;
  title: string;
  description: string;
  ruleType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scope: string;
  targetModels: string[];
  condition?: string;
  action: string;
  examples: Array<{ bad: string; good: string }>;
  confidence: number;
  occurrences: number;
  status: string;
  proposedAt: string;
}

interface ActiveRule {
  id: string;
  ruleId: string;
  rule: ProposedRule;
  activatedAt: string;
  version: number;
  isActive: boolean;
}

interface Statistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByModel: Record<string, number>;
  topErrorCategories: Array<{ category: string; count: number }>;
  proposedRules: number;
  activeRules: number;
  rejectedRules: number;
}

const priorityConfig = {
  critical: { color: 'destructive', icon: AlertTriangle, label: 'Kritisch' },
  high: { color: 'warning', icon: TrendingUp, label: 'Hoch' },
  medium: { color: 'primary', icon: Clock, label: 'Mittel' },
  low: { color: 'default', icon: Clock, label: 'Niedrig' },
};

const ruleTypeLabels: Record<string, string> = {
  instruction: 'Anweisung', constraint: 'Einschränkung',
  preference: 'Präferenz', format: 'Format', behavior: 'Verhalten',
};

export function LearningRulesPage() {
  const [proposedRules, setProposedRules] = useState<ProposedRule[]>([]);
  const [activeRules, setActiveRules] = useState<ActiveRule[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<ProposedRule | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const toast = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [proposedRes, activeRes, statsRes] = await Promise.all([
        api.get('/learning/rules/proposed'),
        api.get('/learning/rules/active'),
        api.get('/learning/statistics'),
      ]);
      setProposedRules(proposedRes.data.rules || []);
      setActiveRules(activeRes.data.rules || []);
      setStatistics(statsRes.data);
    } catch { toast.error('Fehler', 'Daten konnten nicht geladen werden.'); }
    finally { setIsLoading(false); }
  };

  const handleApprove = async (ruleId: string) => {
    try {
      await api.post(`/learning/rules/${ruleId}/approve`);
      toast.success('Regel genehmigt', 'Die Regel ist jetzt aktiv.');
      fetchData();
    } catch { toast.error('Fehler', 'Regel konnte nicht genehmigt werden.'); }
  };

  const handleReject = async () => {
    if (!selectedRule) return;
    try {
      await api.post(`/learning/rules/${selectedRule.id}/reject`, { reason: rejectReason });
      toast.success('Regel abgelehnt');
      setIsRejectDialogOpen(false);
      setRejectReason('');
      setSelectedRule(null);
      fetchData();
    } catch { toast.error('Fehler', 'Regel konnte nicht abgelehnt werden.'); }
  };

  const handleDeactivate = async (activeRuleId: string) => {
    try {
      await api.delete(`/learning/rules/${activeRuleId}`);
      toast.success('Regel deaktiviert');
      fetchData();
    } catch { toast.error('Fehler', 'Regel konnte nicht deaktiviert werden.'); }
  };

  const toggleExpanded = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      next.has(ruleId) ? next.delete(ruleId) : next.add(ruleId);
      return next;
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-cyan-400" />
            Lern-System
          </h1>
          <p className="mt-1 text-slate-400">Automatisch vorgeschlagene Regeln basierend auf Fehlern</p>
        </div>
        <Button variant="outline" onClick={fetchData} leftIcon={<RefreshCw className="h-4 w-4" />}>Aktualisieren</Button>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ausstehend', value: statistics.proposedRules, icon: Clock, color: 'amber' },
            { label: 'Aktiv', value: statistics.activeRules, icon: CheckCircle, color: 'green' },
            { label: 'Abgelehnt', value: statistics.rejectedRules, icon: XCircle, color: 'red' },
            { label: 'Lern-Events', value: statistics.totalEvents, icon: Sparkles, color: 'cyan' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                    <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="proposed">
        <TabsList className="mb-6">
          <TabsTrigger value="proposed"><Clock className="mr-2 h-4 w-4" />Vorgeschlagen ({proposedRules.length})</TabsTrigger>
          <TabsTrigger value="active"><CheckCircle className="mr-2 h-4 w-4" />Aktiv ({activeRules.length})</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="mr-2 h-4 w-4" />Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="proposed">
          {proposedRules.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">Keine neuen Vorschläge</h3>
              <p className="mt-2 text-slate-400">Das System lernt aus Fehlern und schlägt automatisch Regeln vor.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {proposedRules.map((rule) => {
                const cfg = priorityConfig[rule.priority];
                const PriorityIcon = cfg.icon;
                const isExpanded = expandedRules.has(rule.id);
                return (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={cfg.color as any}><PriorityIcon className="mr-1 h-3 w-3" />{cfg.label}</Badge>
                            <Badge variant="outline">{ruleTypeLabels[rule.ruleType] || rule.ruleType}</Badge>
                            <Badge variant="secondary">{rule.occurrences}x erkannt</Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
                          <p className="text-sm text-slate-400 mt-1">{rule.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Konfidenz</p>
                          <p className="text-lg font-bold text-cyan-400">{Math.round(rule.confidence * 100)}%</p>
                        </div>
                      </div>
                      <button onClick={() => toggleExpanded(rule.id)} className="flex items-center gap-1 mt-3 text-sm text-slate-400 hover:text-white">
                        {isExpanded ? <><ChevronUp className="h-4 w-4" />Details verbergen</> : <><ChevronDown className="h-4 w-4" />Details anzeigen</>}
                      </button>
                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <Separator />
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Regel-Anweisung</p>
                            <div className="p-3 rounded-lg bg-slate-800 text-sm text-white font-mono">{rule.action}</div>
                          </div>
                          {rule.condition && (<div><p className="text-xs font-medium text-slate-500 uppercase mb-1">Bedingung</p><p className="text-sm text-slate-300">{rule.condition}</p></div>)}
                          {rule.examples.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Beispiele</p>
                              {rule.examples.map((ex, i) => (
                                <div key={i} className="grid grid-cols-2 gap-3 mb-2">
                                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-xs text-red-400 mb-1">❌ Falsch</p><p className="text-sm text-slate-300">{ex.bad}</p></div>
                                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"><p className="text-xs text-green-400 mb-1">✅ Richtig</p><p className="text-sm text-slate-300">{ex.good}</p></div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div><p className="text-xs font-medium text-slate-500 uppercase mb-1">Betroffene Modelle</p><div className="flex flex-wrap gap-2">{rule.targetModels.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}</div></div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                        <Button onClick={() => handleApprove(rule.id)} leftIcon={<ThumbsUp className="h-4 w-4" />} className="flex-1">Genehmigen</Button>
                        <Button variant="destructive" onClick={() => { setSelectedRule(rule); setIsRejectDialogOpen(true); }} leftIcon={<ThumbsDown className="h-4 w-4" />} className="flex-1">Ablehnen</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeRules.length === 0 ? (
            <Card><CardContent className="p-12 text-center"><Shield className="mx-auto h-12 w-12 text-slate-600" /><h3 className="mt-4 text-lg font-semibold text-white">Keine aktiven Regeln</h3></CardContent></Card>
          ) : (
            <div className="space-y-4">
              {activeRules.map((ar) => (
                <Card key={ar.id}><CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2"><Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Aktiv</Badge><Badge variant="outline">v{ar.version}</Badge></div>
                      <h3 className="text-lg font-semibold text-white">{ar.rule.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{ar.rule.description}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDeactivate(ar.id)}>Deaktivieren</Button>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-slate-800"><p className="text-sm text-cyan-400 font-mono">{ar.rule.action}</p></div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          {statistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle>Events nach Typ</CardTitle></CardHeader><CardContent><div className="space-y-3">
                {Object.entries(statistics.eventsByType).map(([type, count]) => (<div key={type}><div className="flex justify-between text-sm mb-1"><span className="text-slate-400 capitalize">{type.replace('_', ' ')}</span><span className="text-white">{count}</span></div><Progress value={(count / statistics.totalEvents) * 100} /></div>))}
              </div></CardContent></Card>
              <Card><CardHeader><CardTitle>Events nach Modell</CardTitle></CardHeader><CardContent><div className="space-y-3">
                {Object.entries(statistics.eventsByModel).map(([model, count]) => (<div key={model}><div className="flex justify-between text-sm mb-1"><span className="text-slate-400">{model}</span><span className="text-white">{count}</span></div><Progress value={(count / statistics.totalEvents) * 100} /></div>))}
              </div></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>Häufigste Fehler-Kategorien</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {statistics.topErrorCategories.map((c) => (<div key={c.category} className="p-4 rounded-lg bg-slate-800 text-center"><p className="text-2xl font-bold text-cyan-400">{c.count}</p><p className="text-sm text-slate-400 mt-1">{c.category}</p></div>))}
              </div></CardContent></Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Regel ablehnen</DialogTitle><DialogDescription>Bitte gib einen Grund an.</DialogDescription></DialogHeader>
          <div className="py-4"><Label htmlFor="reason">Grund</Label><Input id="reason" placeholder="z.B. Zu spezifisch..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Abbrechen</Button><Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>Ablehnen</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
