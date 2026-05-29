'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Eye,
  Image,
  BookOpen,
  Settings,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bell,
  Activity,
  Clock,
  Zap,
  Cpu,
  HardDrive,
  Network,
  Brain,
  Timer,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJarvisStore, type JarvisPanel, type Notification, type Memory } from '@/lib/jarvis-store';
import { useSystemMonitor } from '@/hooks/use-system-monitor';
import { useProactive } from '@/hooks/use-proactive';

/* ─── Arc Reactor Animation (CPU-responsive) ─────────────────────────── */

function ArcReactor({ cpuUsage }: { cpuUsage: number }) {
  // Speed varies based on CPU usage: faster when busier
  const baseDuration = Math.max(1, 8 - (cpuUsage / 100) * 6);

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-4">
      {/* Outermost ring */}
      <div className="absolute inset-0 rounded-full border border-jarvis-cyan/10" />

      {/* Rotating outer arcs */}
      <div
        className="absolute inset-2 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration}s` }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(0, 212, 255, 0.3)"
            strokeWidth="2"
            strokeDasharray="40 20 60 30 40 20 60 30"
          />
        </svg>
      </div>

      {/* Counter-rotating middle arcs */}
      <div
        className="absolute inset-5 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 0.75}s`, animationDirection: 'reverse' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="rgba(0, 212, 255, 0.5)"
            strokeWidth="2.5"
            strokeDasharray="25 15 50 20 25 15 50 20"
          />
        </svg>
      </div>

      {/* Inner rotating ring */}
      <div
        className="absolute inset-10 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 0.5}s` }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="none"
            stroke="rgba(0, 212, 255, 0.6)"
            strokeWidth="2"
            strokeDasharray="30 10 20 10 30 10"
          />
        </svg>
      </div>

      {/* Inner counter-rotating ring */}
      <div
        className="absolute inset-14 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 0.375}s`, animationDirection: 'reverse' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="40"
            fill="none"
            stroke="rgba(0, 212, 255, 0.8)"
            strokeWidth="3"
            strokeDasharray="15 8 25 8 15 8"
          />
        </svg>
      </div>

      {/* Glowing center — CPU percentage */}
      <div className="absolute inset-[4.5rem] rounded-full bg-jarvis-cyan/10 jarvis-pulse">
        <div className="absolute inset-1 rounded-full bg-jarvis-cyan/20 jarvis-glow-strong" />
        <div className="absolute inset-2 rounded-full bg-jarvis-cyan/30" />
        <div className="absolute inset-3 rounded-full bg-jarvis-dark flex items-center justify-center">
          <span className="text-xs font-bold text-jarvis-cyan jarvis-glow-text">
            {cpuUsage}%
          </span>
        </div>
      </div>

      {/* Radial glow overlay */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 212, 255, 0.05) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

/* ─── Circular Progress Indicator ───────────────────────────────────── */

function CircularProgress({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="rgba(0, 212, 255, 0.1)"
            strokeWidth="4"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="rgba(0, 212, 255, 0.7)"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-jarvis-cyan/60 mb-0.5" />
          <span className="text-sm font-bold text-jarvis-cyan jarvis-glow-text">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

/* ─── Notification Item ───────────────────────────────────────────────── */

function NotificationItem({ notification }: { notification: Notification }) {
  const typeColors: Record<string, string> = {
    alert: 'text-red-400 bg-red-400/10',
    info: 'text-jarvis-cyan bg-jarvis-cyan/10',
    warning: 'text-yellow-400 bg-yellow-400/10',
    success: 'text-green-400 bg-green-400/10',
  };

  const typeColor = typeColors[notification.type] || typeColors.info;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${typeColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground/90 truncate">
          {notification.title}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {notification.message}
        </p>
      </div>
      <span className="text-[9px] text-muted-foreground/60 shrink-0">
        {new Date(notification.createdAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}

/* ─── Memory Item ────────────────────────────────────────────────────── */

function MemoryItem({ memory }: { memory: Memory }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Brain className="h-3 w-3 text-jarvis-cyan/50 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-foreground/80 truncate">
          {memory.key}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {memory.value}
        </p>
      </div>
      <Badge variant="outline" className="text-[8px] h-4 px-1 border-jarvis-cyan/20 text-jarvis-cyan/50">
        {memory.category}
      </Badge>
    </div>
  );
}

/* ─── Quick Action Button ────────────────────────────────────────────── */

interface QuickAction {
  icon: React.ElementType;
  label: string;
  panel: JarvisPanel;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: MessageSquare, label: 'Novo Chat', panel: 'chat' },
  { icon: Search, label: 'Buscar', panel: 'search' },
  { icon: Eye, label: 'Visao', panel: 'vision' },
  { icon: Image, label: 'Gerar Imagem', panel: 'chat' },
  { icon: BookOpen, label: 'Ler Pagina', panel: 'search' },
  { icon: Settings, label: 'Configuracoes', panel: 'dashboard' },
];

function QuickActionButton({
  action,
  onClick,
}: {
  action: QuickAction;
  onClick: () => void;
}) {
  const Icon = action.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="jarvis-panel p-3 flex flex-col items-center gap-2 hover:jarvis-glow transition-all duration-300 group cursor-pointer"
    >
      <div className="p-2 rounded-lg bg-jarvis-cyan/10 group-hover:bg-jarvis-cyan/20 transition-colors">
        <Icon className="h-5 w-5 text-jarvis-cyan" />
      </div>
      <span className="text-[10px] text-muted-foreground group-hover:text-jarvis-cyan transition-colors">
        {action.label}
      </span>
    </motion.button>
  );
}

/* ─── Format Uptime ─────────────────────────────────────────────────── */

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/* ─── Main Dashboard Component ──────────────────────────────────────── */

export function JarvisDashboard() {
  const {
    isOnline,
    isListening,
    isSpeaking,
    notifications,
    conversations,
    searchResults,
    messages,
    loadNotifications,
    setActivePanel,
    memories,
    loadMemories,
  } = useJarvisStore();

  const { data: systemData, isLoading: systemLoading, refresh: refreshSystem } = useSystemMonitor();
  const { isPolling, lastChecked } = useProactive();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load notifications and memories on mount
  useEffect(() => {
    loadNotifications();
    loadMemories();
  }, [loadNotifications, loadMemories]);

  // Sync system stats to store
  useEffect(() => {
    if (systemData) {
      useJarvisStore.getState().setSystemStats(systemData);
    }
  }, [systemData]);

  // Stats (derived from store)
  const totalConversations = conversations.length;
  const messagesToday = messages.filter((m) => {
    const msgDate = new Date(m.createdAt);
    const today = new Date();
    return (
      msgDate.getDate() === today.getDate() &&
      msgDate.getMonth() === today.getMonth() &&
      msgDate.getFullYear() === today.getFullYear()
    );
  }).length;
  const searchesPerformed = searchResults.length;

  const recentNotifications = notifications.slice(0, 5);
  const recentMemories = memories.slice(0, 5);

  const cpuUsage = systemData?.cpu?.usage ?? 0;
  const memPercentage = systemData?.memory?.percentage ?? 0;
  const memUsed = systemData?.memory?.used ?? 0;
  const memTotal = systemData?.memory?.total ?? 0;
  const uptime = systemData?.uptime ?? 0;
  const cpuCores = systemData?.cpu?.cores ?? 0;
  const cpuModel = systemData?.cpu?.model ?? 'Unknown';
  const loadAvg = systemData?.loadAvg ?? [];
  const platform = systemData?.platform ?? '';
  const hostname = systemData?.hostname ?? '';
  const network = systemData?.network ?? [];

  const handleQuickAction = useCallback(
    (panel: JarvisPanel) => {
      setActivePanel(panel);
    },
    [setActivePanel]
  );

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Activity className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Painel
          </h2>
          <p className="text-xs text-muted-foreground">
            Status e controle do sistema
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={refreshSystem}
          className="h-8 w-8 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          <RefreshCw className={`h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 jarvis-scrollbar">
        <div className="space-y-4 pr-2">
          {/* Current Date/Time Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-2"
          >
            <p className="text-3xl font-bold text-jarvis-cyan jarvis-glow-text tabular-nums tracking-wider">
              {currentTime.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {currentTime.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </motion.div>

          {/* Arc Reactor Animation — CPU responsive */}
          <ArcReactor cpuUsage={cpuUsage} />

          {/* Real System Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="jarvis-panel p-4"
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Recursos do Sistema
            </h3>

            {/* CPU and RAM circular indicators */}
            <div className="flex items-center justify-around mb-4">
              <CircularProgress value={cpuUsage} label="CPU" icon={Cpu} />
              <CircularProgress value={memPercentage} label="RAM" icon={HardDrive} />
            </div>

            {/* CPU details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-jarvis-cyan/60" />
                  <span className="text-xs text-foreground/70">CPU</span>
                </div>
                <span className="text-xs text-jarvis-cyan/80">{cpuCores} cores</span>
              </div>
              <div className="jarvis-stat-bar">
                <div
                  className="jarvis-stat-bar-fill"
                  style={{
                    width: `${cpuUsage}%`,
                    background: cpuUsage > 80
                      ? 'linear-gradient(90deg, rgba(255, 107, 53, 0.6), rgba(255, 107, 53, 0.9))'
                      : 'linear-gradient(90deg, rgba(0, 212, 255, 0.6), rgba(0, 212, 255, 0.9))',
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 truncate">{cpuModel}</p>
            </div>

            {/* RAM details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-jarvis-cyan/60" />
                  <span className="text-xs text-foreground/70">RAM</span>
                </div>
                <span className="text-xs text-jarvis-cyan/80">
                  {(memUsed / 1024 / 1024 / 1024).toFixed(1)} / {(memTotal / 1024 / 1024 / 1024).toFixed(1)} GB
                </span>
              </div>
              <div className="jarvis-stat-bar">
                <div
                  className="jarvis-stat-bar-fill"
                  style={{
                    width: `${memPercentage}%`,
                    background: memPercentage > 85
                      ? 'linear-gradient(90deg, rgba(255, 107, 53, 0.6), rgba(255, 107, 53, 0.9))'
                      : 'linear-gradient(90deg, rgba(0, 212, 255, 0.6), rgba(0, 212, 255, 0.9))',
                  }}
                />
              </div>
            </div>

            {/* Uptime & Load */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-jarvis-dark/50 p-2 text-center">
                <Timer className="h-3.5 w-3.5 text-jarvis-cyan/50 mx-auto mb-1" />
                <p className="text-xs font-medium text-jarvis-cyan/80">{formatUptime(uptime)}</p>
                <p className="text-[9px] text-muted-foreground/50">Uptime</p>
              </div>
              <div className="rounded-lg bg-jarvis-dark/50 p-2 text-center">
                <Activity className="h-3.5 w-3.5 text-jarvis-cyan/50 mx-auto mb-1" />
                <p className="text-xs font-medium text-jarvis-cyan/80">
                  {loadAvg.length > 0 ? loadAvg.map((l) => l.toFixed(2)).join(' / ') : 'N/A'}
                </p>
                <p className="text-[9px] text-muted-foreground/50">Load Avg</p>
              </div>
            </div>
          </motion.div>

          {/* System Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="jarvis-panel p-4"
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Status dos Módulos
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-jarvis-cyan" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm text-foreground/80">IA</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    isOnline
                      ? 'border-jarvis-cyan/30 text-jarvis-cyan bg-jarvis-cyan/5'
                      : 'border-red-400/30 text-red-400 bg-red-400/5'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isListening ? (
                    <Mic className="h-4 w-4 text-jarvis-cyan jarvis-pulse" />
                  ) : (
                    <MicOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground/80">Microfone</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    isListening
                      ? 'border-jarvis-cyan/30 text-jarvis-cyan bg-jarvis-cyan/5'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {isListening ? 'Ouvindo' : 'Inativo'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSpeaking ? (
                    <Volume2 className="h-4 w-4 text-jarvis-cyan jarvis-pulse" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground/80">Voz</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    isSpeaking
                      ? 'border-jarvis-cyan/30 text-jarvis-cyan bg-jarvis-cyan/5'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {isSpeaking ? 'Falando' : 'Silencioso'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-jarvis-cyan/60" />
                  <span className="text-sm text-foreground/80">Proativo</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    isPolling
                      ? 'border-jarvis-cyan/30 text-jarvis-cyan bg-jarvis-cyan/5'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {isPolling ? 'Ativo' : 'Pausado'}
                </Badge>
              </div>
            </div>

            {/* Platform info */}
            {platform && (
              <div className="mt-3 pt-2 border-t border-jarvis-border/30">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                  <span>{platform} • {hostname}</span>
                </div>
                {network.length > 0 && (
                  <div className="mt-1 text-[9px] text-muted-foreground/30">
                    {network.slice(0, 2).map((iface) => (
                      <span key={iface.name} className="mr-2">
                        {iface.name}: {iface.addresses.map((a) => a.address).join(', ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-2"
          >
            <div className="jarvis-panel p-3 text-center">
              <p className="text-xl font-bold text-jarvis-cyan jarvis-glow-text">
                {totalConversations}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Conversas
              </p>
            </div>
            <div className="jarvis-panel p-3 text-center">
              <p className="text-xl font-bold text-jarvis-cyan jarvis-glow-text">
                {messagesToday}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Msgs Hoje
              </p>
            </div>
            <div className="jarvis-panel p-3 text-center">
              <p className="text-xl font-bold text-jarvis-cyan jarvis-glow-text">
                {searchesPerformed}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Buscas
              </p>
            </div>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Acoes Rapidas
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionButton
                  key={action.label}
                  action={action}
                  onClick={() => handleQuickAction(action.panel)}
                />
              ))}
            </div>
          </motion.div>

          {/* Proactive Events Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="jarvis-panel p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Monitoramento Proativo
              </h3>
              {isPolling && (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-jarvis-cyan jarvis-pulse" />
                  <span className="text-[9px] text-jarvis-cyan/50">Ativo</span>
                </div>
              )}
            </div>
            <div className="text-center py-3">
              {lastChecked ? (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground/60">
                    Última verificação
                  </p>
                  <p className="text-xs text-jarvis-cyan/70">
                    {lastChecked.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground/40">
                  Aguardando primeira verificação...
                </p>
              )}
            </div>
          </motion.div>

          {/* Memory Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="jarvis-panel p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="h-3 w-3" />
                Memórias
              </h3>
              {memories.length > 5 && (
                <span className="text-[10px] text-jarvis-cyan/60">
                  +{memories.length - 5} mais
                </span>
              )}
            </div>
            {recentMemories.length > 0 ? (
              <div className="divide-y divide-jarvis-border/30">
                {recentMemories.map((memory) => (
                  <MemoryItem key={memory.id} memory={memory} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground/50">
                <Brain className="h-4 w-4" />
                <p className="text-xs">Nenhuma memória armazenada</p>
              </div>
            )}
          </motion.div>

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="jarvis-panel p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="h-3 w-3" />
                Notificacoes
              </h3>
              {notifications.length > 5 && (
                <span className="text-[10px] text-jarvis-cyan/60">
                  +{notifications.length - 5} mais
                </span>
              )}
            </div>
            {recentNotifications.length > 0 ? (
              <div className="divide-y divide-jarvis-border/30">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground/50">
                <Bell className="h-4 w-4" />
                <p className="text-xs">Nenhuma notificacao</p>
              </div>
            )}
          </motion.div>

          {/* Footer info */}
          <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-muted-foreground/40">
            <Clock className="h-3 w-3" />
            <span>JARVIS AI Assistant v2.0</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
