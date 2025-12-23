// AI Arena - Model Selector with Tier Support
import { useState, useEffect } from 'react';
import {
  Star,
  Zap,
  Crown,
  Lock,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  tier: 'basic' | 'standard' | 'premium';
  description: string;
  contextWindow: number;
  inputCost: number;
  outputCost: number;
  strengths: string[];
  hasAccess: boolean;
  accessExpiresAt?: string;
  requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

interface ModelSelectorProps {
  selectedModels: string[];
  onSelectionChange: (modelIds: string[]) => void;
  maxSelection?: number;
  mode?: 'single' | 'multi';
}

const tierConfig = {
  basic: {
    icon: Star,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Basic',
    description: 'Kostenlos für alle',
  },
  standard: {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Standard',
    description: 'Schnelle Freigabe',
  },
  premium: {
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Premium',
    description: 'Admin-Freigabe erforderlich',
  },
};

export function ModelSelector({
  selectedModels,
  onSelectionChange,
  maxSelection = 4,
  mode = 'multi',
}: ModelSelectorProps) {
  const toast = useToast();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTiers, setExpandedTiers] = useState<string[]>(['basic', 'standard', 'premium']);
  const [requestingAccess, setRequestingAccess] = useState<string | null>(null);
  const [requestDialog, setRequestDialog] = useState<{ open: boolean; modelId: string | null; tier: string }>({
    open: false,
    modelId: null,
    tier: '',
  });
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 7>(7);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await api.get('/models');
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('Fehler beim Laden der Modelle');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTier = (tier: string) => {
    setExpandedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleModelClick = (model: ModelConfig) => {
    if (!model.hasAccess) {
      // Open request dialog for non-accessible models
      setRequestDialog({ open: true, modelId: model.id, tier: model.tier });
      return;
    }

    if (mode === 'single') {
      onSelectionChange([model.id]);
    } else {
      const isSelected = selectedModels.includes(model.id);
      if (isSelected) {
        onSelectionChange(selectedModels.filter((id) => id !== model.id));
      } else if (selectedModels.length < maxSelection) {
        onSelectionChange([...selectedModels, model.id]);
      } else {
        toast.error(`Maximal ${maxSelection} Modelle auswählbar`);
      }
    }
  };

  const handleRequestAccess = async () => {
    if (!requestDialog.modelId) return;

    setRequestingAccess(requestDialog.modelId);
    try {
      const response = await api.post('/models/access/request', {
        modelId: requestDialog.modelId,
        duration: selectedDuration,
        reason: 'Zugriff angefragt über Model Selector',
      });

      if (response.data.autoApproved) {
        toast.success('Zugriff wurde automatisch gewährt');
        fetchModels(); // Refresh to get updated access status
      } else {
        toast.success('Anfrage wurde eingereicht');
      }
      setRequestDialog({ open: false, modelId: null, tier: '' });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Fehler bei der Anfrage';
      toast.error(message);
    } finally {
      setRequestingAccess(null);
    }
  };

  const groupedModels = {
    basic: models.filter((m) => m.tier === 'basic'),
    standard: models.filter((m) => m.tier === 'standard'),
    premium: models.filter((m) => m.tier === 'premium'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Models Summary */}
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <span className="text-sm text-slate-400 mr-2">Ausgewählt:</span>
          {selectedModels.map((modelId) => {
            const model = models.find((m) => m.id === modelId);
            if (!model) return null;
            const tier = tierConfig[model.tier];
            const TierIcon = tier.icon;

            return (
              <Badge
                key={modelId}
                variant="default"
                className={`${tier.bgColor} ${tier.color} border ${tier.borderColor} cursor-pointer`}
                onClick={() => handleModelClick(model)}
              >
                <TierIcon className="w-3 h-3 mr-1" />
                {model.name}
                <span className="ml-1 opacity-60">×</span>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Tier Sections */}
      {(['basic', 'standard', 'premium'] as const).map((tierKey) => {
        const tier = tierConfig[tierKey];
        const TierIcon = tier.icon;
        const tierModels = groupedModels[tierKey];
        const isExpanded = expandedTiers.includes(tierKey);

        return (
          <Card key={tierKey} className={`border ${tier.borderColor} ${tier.bgColor}`}>
            <CardHeader
              className="py-3 cursor-pointer"
              onClick={() => toggleTier(tierKey)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                    <TierIcon className={`h-5 w-5 ${tier.color}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-lg ${tier.color}`}>
                      {tier.label}
                    </CardTitle>
                    <p className="text-sm text-slate-400">{tier.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-slate-400">
                    {tierModels.length} Modelle
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tierModels.map((model) => {
                    const isSelected = selectedModels.includes(model.id);
                    const hasPendingRequest = model.requestStatus === 'PENDING';

                    return (
                      <TooltipProvider key={model.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleModelClick(model)}
                              className={`w-full p-3 rounded-lg border transition-all text-left ${
                                isSelected
                                  ? `${tier.borderColor} ${tier.bgColor} ring-2 ring-offset-2 ring-offset-slate-950 ring-${tier.color.split('-')[1]}-500`
                                  : model.hasAccess
                                  ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                  : 'border-slate-800 bg-slate-900/50 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">
                                      {model.name}
                                    </span>
                                    {!model.hasAccess && (
                                      <Lock className="h-3 w-3 text-slate-500" />
                                    )}
                                    {hasPendingRequest && (
                                      <Clock className="h-3 w-3 text-yellow-400" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {model.provider}
                                  </p>
                                </div>
                                {isSelected && (
                                  <Check className={`h-5 w-5 ${tier.color}`} />
                                )}
                              </div>

                              {/* Strengths */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {model.strengths.slice(0, 3).map((strength, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 text-xs bg-slate-700/50 text-slate-300 rounded"
                                  >
                                    {strength}
                                  </span>
                                ))}
                              </div>

                              {/* Cost Info */}
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                <span>
                                  ${model.inputCost.toFixed(2)}/M Input
                                </span>
                                <span>
                                  ${model.outputCost.toFixed(2)}/M Output
                                </span>
                              </div>

                              {/* Access Status */}
                              {model.accessExpiresAt && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                                  <Check className="h-3 w-3" />
                                  <span>
                                    Zugriff bis{' '}
                                    {new Date(model.accessExpiresAt).toLocaleDateString('de-DE')}
                                  </span>
                                </div>
                              )}
                              {hasPendingRequest && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                                  <Clock className="h-3 w-3" />
                                  <span>Anfrage ausstehend</span>
                                </div>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="font-medium">{model.name}</p>
                            <p className="text-sm text-slate-400">{model.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Kontext: {(model.contextWindow / 1000).toFixed(0)}K Tokens
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Request Access Dialog */}
      <Dialog
        open={requestDialog.open}
        onOpenChange={(open) =>
          setRequestDialog({ open, modelId: null, tier: '' })
        }
      >
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Zugriff anfragen</DialogTitle>
            <DialogDescription>
              {requestDialog.tier === 'standard'
                ? 'Standard-Zugriff wird automatisch gewährt.'
                : 'Premium-Zugriff erfordert Admin-Genehmigung.'}
            </DialogDescription>
          </DialogHeader>

          {requestDialog.tier === 'premium' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Zugriffsdauer wählen:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([1, 3, 7] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() => setSelectedDuration(days)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedDuration === days
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-slate-700 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <span className="block text-lg font-bold">{days}</span>
                      <span className="text-xs opacity-60">
                        {days === 1 ? 'Tag' : 'Tage'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg">
                <Info className="h-4 w-4 text-slate-400 mt-0.5" />
                <p className="text-sm text-slate-400">
                  Nach Genehmigung hast du für {selectedDuration}{' '}
                  {selectedDuration === 1 ? 'Tag' : 'Tage'} Zugriff auf dieses
                  Modell.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setRequestDialog({ open: false, modelId: null, tier: '' })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleRequestAccess}
              isLoading={requestingAccess !== null}
              className={
                requestDialog.tier === 'premium'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              {requestDialog.tier === 'premium'
                ? 'Anfrage senden'
                : 'Zugriff anfordern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ModelSelector;
