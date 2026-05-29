'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, Plus, Loader2, Trash2, ChevronDown, ChevronUp, DollarSign, Eye, MousePointer, TrendingUp, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useJarvisStore, type Campaign } from '@/lib/jarvis-store';

type StatusFilter = 'all' | 'draft' | 'active' | 'paused' | 'completed';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-400/10 text-gray-400 border-gray-400/20' },
  active: { label: 'Ativo', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  paused: { label: 'Pausado', color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  completed: { label: 'Concluído', color: 'bg-sky-400/10 text-sky-400 border-sky-400/20' },
};

const TYPE_BADGES: Record<string, string> = {
  email: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  social: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  ads: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  content: 'bg-teal-400/10 text-teal-400 border-teal-400/20',
};

function parseMetrics(metrics: Record<string, number> | string): Record<string, number> {
  if (typeof metrics === 'object') return metrics;
  try { return JSON.parse(metrics); } catch { return {}; }
}

export function JarvisCampaigns() {
  const { campaigns, isLoadingCampaigns, loadCampaigns, createCampaign, updateCampaign, deleteCampaign, sendMessage } = useJarvisStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'social', budget: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleCreate = useCallback(async () => {
    if (!newCampaign.name.trim()) return;
    setCreating(true);
    await createCampaign(newCampaign.name.trim(), newCampaign.type, newCampaign.budget ? parseFloat(newCampaign.budget) : undefined);
    setNewCampaign({ name: '', type: 'social', budget: '' });
    setShowCreate(false);
    setCreating(false);
  }, [newCampaign, createCampaign]);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    await updateCampaign(id, { status } as Partial<Campaign>);
  }, [updateCampaign]);

  const handleAnalyze = useCallback(() => {
    const activeCampaigns = campaigns.filter((c) => c.status === 'active');
    if (activeCampaigns.length === 0) {
      sendMessage('Analise minhas campanhas de marketing. Não há campanhas ativas no momento.');
    } else {
      const summary = activeCampaigns.map((c) => `${c.name} (${c.type}): Orçamento R$${c.budget}, Gasto R$${c.spent}`).join('\n');
      sendMessage(`Analise minhas campanhas de marketing ativas:\n${summary}\n\nSugira melhorias de ROI e otimização.`);
    }
  }, [campaigns, sendMessage]);

  const filteredCampaigns = campaigns.filter((c) => statusFilter === 'all' || c.status === statusFilter);

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'draft', label: 'Rascunho' },
    { key: 'active', label: 'Ativo' },
    { key: 'paused', label: 'Pausado' },
    { key: 'completed', label: 'Concluído' },
  ];

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Target className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">Campanhas</h2>
          <p className="text-xs text-muted-foreground">Marketing e métricas</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAnalyze}
          className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px] hidden sm:inline">Analisar com IA</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5"
        >
          {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span className="text-[10px] hidden sm:inline">{showCreate ? 'Fechar' : 'Criar'}</span>
        </Button>
      </div>

      {/* Create Campaign Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="jarvis-panel p-3 space-y-2">
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nome da campanha"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
              />
              <div className="flex gap-2">
                <select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign((p) => ({ ...p, type: e.target.value }))}
                  className="bg-jarvis-dark border border-jarvis-border/30 rounded-md px-2 py-1.5 text-xs text-foreground/80 focus:outline-none focus:border-jarvis-cyan/40"
                >
                  <option value="social">Social</option>
                  <option value="email">Email</option>
                  <option value="ads">Anúncios</option>
                  <option value="content">Conteúdo</option>
                </select>
                <Input
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign((p) => ({ ...p, budget: e.target.value }))}
                  placeholder="Orçamento (R$)"
                  type="number"
                  className="flex-1 bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !newCampaign.name.trim()}
                className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 gap-2"
                size="sm"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Criar Campanha
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Filter */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {statusFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] transition-colors ${
              statusFilter === key
                ? 'bg-jarvis-cyan/15 text-jarvis-cyan border border-jarvis-cyan/20'
                : 'text-muted-foreground/50 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <ScrollArea className="jarvis-scrollbar flex-1">
        {isLoadingCampaigns ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-jarvis-cyan animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-8 w-8 text-jarvis-cyan/15 mb-2" />
            <p className="text-xs text-muted-foreground/40">Nenhuma campanha encontrada</p>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {filteredCampaigns.map((campaign, i) => {
              const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
              const typeBadge = TYPE_BADGES[campaign.type] || 'bg-jarvis-cyan/10 text-jarvis-cyan border-jarvis-cyan/20';
              const metrics = parseMetrics(campaign.metrics);
              const budgetPercent = campaign.budget > 0 ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0;
              const isExpanded = expandedId === campaign.id;

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="jarvis-panel p-3"
                >
                  {/* Campaign header */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-foreground/80">{campaign.name}</p>
                        <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${typeBadge}`}>
                          {campaign.type}
                        </Badge>
                        <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Budget bar */}
                      {campaign.budget > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground/50 mb-0.5">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-2.5 w-2.5" />
                              R${campaign.spent.toFixed(0)} / R${campaign.budget.toFixed(0)}
                            </span>
                            <span>{budgetPercent.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-jarvis-dark/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${budgetPercent}%`,
                                background: budgetPercent > 90
                                  ? 'linear-gradient(90deg, rgba(255,107,53,0.7), rgba(255,107,53,0.9))'
                                  : budgetPercent > 70
                                    ? 'linear-gradient(90deg, rgba(255,200,53,0.7), rgba(255,200,53,0.9))'
                                    : 'linear-gradient(90deg, rgba(0,212,255,0.5), rgba(0,212,255,0.8))',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
                        className="p-1 text-muted-foreground/40 hover:text-jarvis-cyan transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="p-1 text-muted-foreground/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-2 border-t border-jarvis-border/20">
                          {/* Metrics dashboard */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            <div className="bg-jarvis-dark/50 rounded-md p-2 text-center">
                              <Eye className="h-3 w-3 text-jarvis-cyan/50 mx-auto mb-0.5" />
                              <p className="text-xs font-medium text-jarvis-cyan/80">{formatNum(metrics.impressions || 0)}</p>
                              <p className="text-[8px] text-muted-foreground/40">Impressões</p>
                            </div>
                            <div className="bg-jarvis-dark/50 rounded-md p-2 text-center">
                              <MousePointer className="h-3 w-3 text-jarvis-cyan/50 mx-auto mb-0.5" />
                              <p className="text-xs font-medium text-jarvis-cyan/80">{formatNum(metrics.clicks || 0)}</p>
                              <p className="text-[8px] text-muted-foreground/40">Cliques</p>
                            </div>
                            <div className="bg-jarvis-dark/50 rounded-md p-2 text-center">
                              <TrendingUp className="h-3 w-3 text-jarvis-cyan/50 mx-auto mb-0.5" />
                              <p className="text-xs font-medium text-jarvis-cyan/80">{formatNum(metrics.conversions || 0)}</p>
                              <p className="text-[8px] text-muted-foreground/40">Conversões</p>
                            </div>
                            <div className="bg-jarvis-dark/50 rounded-md p-2 text-center">
                              <BarChart3 className="h-3 w-3 text-jarvis-cyan/50 mx-auto mb-0.5" />
                              <p className="text-xs font-medium text-jarvis-cyan/80">{metrics.ctr ? `${metrics.ctr.toFixed(1)}%` : '0%'}</p>
                              <p className="text-[8px] text-muted-foreground/40">CTR</p>
                            </div>
                          </div>

                          {/* Status actions */}
                          <div className="flex gap-1 flex-wrap">
                            {campaign.status !== 'active' && (
                              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(campaign.id, 'active')} className="text-emerald-400/60 hover:bg-emerald-400/10 h-6 text-[9px] gap-1">
                                ▶ Ativar
                              </Button>
                            )}
                            {campaign.status === 'active' && (
                              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(campaign.id, 'paused')} className="text-yellow-400/60 hover:bg-yellow-400/10 h-6 text-[9px] gap-1">
                                ⏸ Pausar
                              </Button>
                            )}
                            {campaign.status !== 'completed' && (
                              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(campaign.id, 'completed')} className="text-sky-400/60 hover:bg-sky-400/10 h-6 text-[9px] gap-1">
                                ✓ Concluir
                              </Button>
                            )}
                          </div>

                          {/* Dates */}
                          {(campaign.startDate || campaign.endDate) && (
                            <div className="mt-2 text-[9px] text-muted-foreground/30">
                              {campaign.startDate && `Início: ${new Date(campaign.startDate).toLocaleDateString('pt-BR')}`}
                              {campaign.startDate && campaign.endDate && ' • '}
                              {campaign.endDate && `Fim: ${new Date(campaign.endDate).toLocaleDateString('pt-BR')}`}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function formatNum(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}
