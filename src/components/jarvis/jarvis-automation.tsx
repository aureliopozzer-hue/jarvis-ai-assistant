'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Play,
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  Activity,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useJarvisStore, type Automation } from '@/lib/jarvis-store';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';

// ─── Helpers ───────────────────────────────────────────────────────────

function formatLastRun(lastRun: string | null): string {
  if (!lastRun) return 'Nunca';
  const date = new Date(lastRun);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHr < 24) return `${diffHr}h atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const TRIGGER_TYPES = [
  { value: 'schedule', label: 'Agendamento' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'event', label: 'Evento' },
  { value: 'condition', label: 'Condição' },
];

const ACTION_TYPES = [
  { value: 'notify', label: 'Notificar' },
  { value: 'api_call', label: 'Chamada API' },
  { value: 'send_email', label: 'Enviar Email' },
  { value: 'log', label: 'Registrar Log' },
];

// ─── Skeleton Card ────────────────────────────────────────────────────

function AutomationSkeleton() {
  return (
    <div className="rounded-lg border border-jarvis-border/20 bg-jarvis-dark/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 bg-jarvis-cyan/10" />
        <Skeleton className="h-4 w-12 bg-jarvis-cyan/10 rounded-full" />
      </div>
      <Skeleton className="h-3 w-24 bg-jarvis-cyan/10" />
      <Skeleton className="h-3 w-20 bg-jarvis-cyan/10" />
    </div>
  );
}

// ─── Automation Card ──────────────────────────────────────────────────

function AutomationCard({
  automation,
  onToggle,
  onDelete,
  onExecute,
}: {
  automation: Automation;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
}) {
  const [executing, setExecuting] = useState(false);

  const handleExecute = useCallback(async () => {
    setExecuting(true);
    await onExecute(automation.id);
    setTimeout(() => setExecuting(false), 1000);
  }, [automation.id, onExecute]);

  const triggerLabel = TRIGGER_TYPES.find((t) => t.value === automation.trigger.type)?.label || automation.trigger.type;
  const actionLabels = automation.actions.map(
    (a) => ACTION_TYPES.find((at) => at.value === a.type)?.label || a.type
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-lg border p-3 transition-colors group ${
        automation.isActive
          ? 'border-jarvis-cyan/15 bg-jarvis-dark/40'
          : 'border-jarvis-border/10 bg-jarvis-dark/20 opacity-60'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1 rounded ${automation.isActive ? 'bg-jarvis-cyan/10' : 'bg-muted/10'}`}>
          <Zap className={`h-3.5 w-3.5 ${automation.isActive ? 'text-jarvis-cyan' : 'text-muted-foreground/40'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground/80 truncate">{automation.name}</p>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle(automation.id, !automation.isActive)}
          className="shrink-0"
          aria-label={automation.isActive ? 'Desativar' : 'Ativar'}
        >
          {automation.isActive ? (
            <ToggleRight className="h-5 w-5 text-jarvis-cyan" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-muted-foreground/40" />
          )}
        </button>
      </div>

      {/* Trigger & Actions */}
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-jarvis-cyan/15 text-jarvis-cyan/60">
          <Settings2 className="h-2.5 w-2.5 mr-0.5" />
          {triggerLabel}
        </Badge>
        {actionLabels.map((label, i) => (
          <Badge key={i} variant="outline" className="text-[8px] h-4 px-1.5 border-emerald-400/15 text-emerald-400/60">
            {label}
          </Badge>
        ))}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatLastRun(automation.lastRun)}
          </span>
          <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
            <Activity className="h-2.5 w-2.5" />
            {automation.runCount}x
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExecute}
            disabled={executing || !automation.isActive}
            className="h-6 w-6 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            {executing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <button
            onClick={() => onDelete(automation.id)}
            className="h-6 w-6 flex items-center justify-center text-muted-foreground/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create Automation Form ───────────────────────────────────────────

function CreateAutomationForm({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, trigger: Record<string, unknown>, actions: Array<Record<string, unknown>>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('schedule');
  const [actionType, setActionType] = useState('notify');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onCreate(
      name.trim(),
      { type: triggerType, config: {} },
      [{ type: actionType, config: {} }]
    );
    setName('');
  }, [name, triggerType, actionType, onCreate]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="jarvis-panel p-3 space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da automação..."
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <div className="flex gap-2">
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="bg-jarvis-dark/50 border border-jarvis-border/30 text-xs h-7 px-2 rounded-md text-foreground/80 focus:border-jarvis-cyan/40 focus:outline-none flex-1"
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="bg-jarvis-dark/50 border border-jarvis-border/30 text-xs h-7 px-2 rounded-md text-foreground/80 focus:border-jarvis-cyan/40 focus:outline-none flex-1"
          >
            {ACTION_TYPES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            size="sm"
            className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 flex-1 text-xs"
          >
            <Zap className="h-3 w-3 mr-1.5" />
            Criar
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground/50 hover:text-foreground/70"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Automation Panel Component ──────────────────────────────────

export function JarvisAutomation() {
  const {
    automations,
    isLoadingAutomation,
    loadAutomations,
    createAutomation,
    toggleAutomation,
    deleteAutomation,
    executeAutomation,
  } = useJarvisStore();

  const { speak, isSpeaking } = useJarvisVoice();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadAutomations();
  }, [loadAutomations]);

  const handleVoiceBriefing = useCallback(() => {
    const active = automations.filter((a) => a.isActive).length;
    const total = automations.length;
    speak(`Você tem ${total} automações, ${active} ativas.`);
  }, [automations, speak]);

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Zap className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Automações
          </h2>
          <p className="text-xs text-muted-foreground">
            Gerencie gatilhos e ações automáticas
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceBriefing}
            disabled={isSpeaking}
            className="h-7 w-7 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <Activity className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadAutomations()}
            className="h-7 w-7 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAutomation ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 rounded-lg bg-jarvis-dark/50 border border-jarvis-border/10 p-2 text-center">
          <p className="text-lg font-bold text-foreground/80">{automations.length}</p>
          <p className="text-[9px] text-muted-foreground/40">Total</p>
        </div>
        <div className="flex-1 rounded-lg bg-jarvis-dark/50 border border-jarvis-cyan/10 p-2 text-center">
          <p className="text-lg font-bold text-jarvis-cyan">{automations.filter((a) => a.isActive).length}</p>
          <p className="text-[9px] text-jarvis-cyan/50">Ativas</p>
        </div>
        <div className="flex-1 rounded-lg bg-jarvis-dark/50 border border-jarvis-border/10 p-2 text-center">
          <p className="text-lg font-bold text-foreground/80">
            {automations.reduce((sum, a) => sum + a.runCount, 0)}
          </p>
          <p className="text-[9px] text-muted-foreground/40">Execuções</p>
        </div>
      </div>

      {/* Create button */}
      <div className="mb-3">
        <Button
          onClick={() => setShowCreate(!showCreate)}
          size="sm"
          className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 w-full text-xs gap-1.5"
        >
          {showCreate ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showCreate ? 'Cancelar' : 'Nova Automação'}
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <CreateAutomationForm
            onCreate={async (name, trigger, actions) => {
              await createAutomation(name, trigger, actions);
              setShowCreate(false);
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>

      {/* Automations list */}
      <ScrollArea className="flex-1 jarvis-scrollbar">
        {isLoadingAutomation && automations.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <AutomationSkeleton key={i} />
            ))}
          </div>
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-12 w-12 text-jarvis-cyan/10 mb-3" />
            <p className="text-sm text-muted-foreground/30 mb-1">
              Nenhuma automação configurada
            </p>
            <p className="text-[10px] text-muted-foreground/20">
              Crie automações para automatizar tarefas repetitivas
            </p>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {automations.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onToggle={toggleAutomation}
                onDelete={deleteAutomation}
                onExecute={executeAutomation}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
