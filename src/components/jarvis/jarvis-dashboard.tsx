'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus,
  X,
  Filter,
  Star,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJarvisStore, type JarvisPanel, type Notification, type Memory } from '@/lib/jarvis-store';
import { useSystemMonitor } from '@/hooks/use-system-monitor';
import { useProactive } from '@/hooks/use-proactive';

/* ─── Enhanced Arc Reactor Animation (CPU-responsive, Movie-style) ──── */

function ArcReactor({ cpuUsage }: { cpuUsage: number }) {
  // Speed varies based on CPU usage: faster when busier
  const baseDuration = Math.max(1, 8 - (cpuUsage / 100) * 6);
  // Glow intensity scales with CPU usage
  const glowIntensity = 0.3 + (cpuUsage / 100) * 0.7;
  // Waveform data for the center sparkline (simulated ECG-style)
  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaveOffset((prev) => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // Generate sparkline path
  const sparklinePath = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i < 30; i++) {
      const x = 10 + (i * 40) / 30;
      const noise = Math.sin((i + waveOffset) * 0.5) * 4 + Math.sin((i + waveOffset) * 1.3) * 2;
      const y = 50 + noise;
      points.push(i === 0 ? `M${x} ${y}` : `L${x} ${y}`);
    }
    return points.join(' ');
  }, [waveOffset]);

  return (
    <div className="relative flex items-center justify-center w-56 h-56 mx-auto my-4">
      {/* Outermost decorative ring — static frame */}
      <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full">
        <circle cx="120" cy="120" r="115" fill="none" stroke="rgba(0, 212, 255, 0.08)" strokeWidth="1" />
        {/* Tick marks around the outer edge */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180;
          const r1 = 110;
          const r2 = i % 3 === 0 ? 105 : 107;
          return (
            <line
              key={i}
              x1={120 + r1 * Math.cos(angle)}
              y1={120 + r1 * Math.sin(angle)}
              x2={120 + r2 * Math.cos(angle)}
              y2={120 + r2 * Math.sin(angle)}
              stroke={`rgba(0, 212, 255, ${i % 3 === 0 ? 0.3 : 0.1})`}
              strokeWidth={i % 3 === 0 ? 1.5 : 0.5}
            />
          );
        })}
      </svg>

      {/* Ring 1: Outermost rotating arc segments */}
      <div
        className="absolute inset-2 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 1.2}s` }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="1.5" strokeDasharray="35 15 55 25 35 15 55 25" />
        </svg>
      </div>

      {/* Ring 2: Counter-rotating segmented arc */}
      <div
        className="absolute inset-4 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 0.85}s`, animationDirection: 'reverse' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="85" fill="none" stroke={`rgba(0, 212, 255, ${0.2 * glowIntensity})`} strokeWidth="2" strokeDasharray="20 12 45 18 20 12 45 18" />
        </svg>
      </div>

      {/* Ring 3: Mid rotating ring with thicker segments */}
      <div
        className="absolute inset-7 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 0.6}s` }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="75" fill="none" stroke={`rgba(0, 212, 255, ${0.35 * glowIntensity})`} strokeWidth="2.5" strokeDasharray="30 8 50 15 30 8 50 15" />
        </svg>
      </div>

      {/* Ring 4: Counter-rotating inner ring */}
      <div
        className="absolute inset-11 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 0.45}s`, animationDirection: 'reverse' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="62" fill="none" stroke={`rgba(0, 212, 255, ${0.5 * glowIntensity})`} strokeWidth="2" strokeDasharray="18 10 35 12 18 10 35 12" />
        </svg>
      </div>

      {/* Ring 5: Fastest inner ring */}
      <div
        className="absolute inset-14 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: `${baseDuration * 0.3}s` }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="48" fill="none" stroke={`rgba(0, 212, 255, ${0.65 * glowIntensity})`} strokeWidth="2.5" strokeDasharray="12 6 22 8 12 6 22 8" />
        </svg>
      </div>

      {/* Orbiting data points — small dots orbiting the reactor */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const orbitRadius = 60 + (i % 3) * 14;
        const speed = baseDuration * (0.5 + i * 0.15);
        const direction = i % 2 === 0 ? '' : 'reverse';
        const delay = i * 0.8;
        return (
          <div
            key={i}
            className="absolute inset-0 jarvis-arc-spinner"
            style={{ animationDuration: `${speed}s`, animationDirection: direction, animationDelay: `${delay}s` }}
          >
            <svg viewBox="0 0 240 240" className="w-full h-full">
              <circle
                cx={120 + orbitRadius}
                cy="120"
                r={i % 3 === 0 ? 2 : 1.5}
                fill={`rgba(0, 212, 255, ${0.4 + (i % 3) * 0.2})`}
              />
            </svg>
          </div>
        );
      })}

      {/* Triangular HUD overlay (Iron Man targeting reticle) */}
      <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full jarvis-energy-field" style={{ opacity: glowIntensity * 0.5 }}>
        {/* Outer triangle */}
        <polygon
          points="120,45 185,155 55,155"
          fill="none"
          stroke="rgba(0, 212, 255, 0.15)"
          strokeWidth="1"
        />
        {/* Inner triangle (inverted) */}
        <polygon
          points="120,155 85,85 155,85"
          fill="none"
          stroke="rgba(0, 212, 255, 0.12)"
          strokeWidth="0.8"
        />
        {/* Crosshair lines */}
        <line x1="120" y1="30" x2="120" y2="55" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="0.5" />
        <line x1="120" y1="185" x2="120" y2="210" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="0.5" />
        <line x1="30" y1="120" x2="55" y2="120" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="0.5" />
        <line x1="185" y1="120" x2="210" y2="120" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="0.5" />
        {/* Corner brackets */}
        <path d="M50 65 L40 65 L40 75" fill="none" stroke="rgba(0, 212, 255, 0.25)" strokeWidth="1" />
        <path d="M190 65 L200 65 L200 75" fill="none" stroke="rgba(0, 212, 255, 0.25)" strokeWidth="1" />
        <path d="M50 175 L40 175 L40 165" fill="none" stroke="rgba(0, 212, 255, 0.25)" strokeWidth="1" />
        <path d="M190 175 L200 175 L200 165" fill="none" stroke="rgba(0, 212, 255, 0.25)" strokeWidth="1" />
      </svg>

      {/* Glowing center — CPU percentage + sparkline waveform */}
      <div
        className="absolute inset-[3.5rem] rounded-full jarvis-pulse"
        style={{
          background: `radial-gradient(circle, rgba(0, 212, 255, ${0.15 * glowIntensity}) 0%, rgba(0, 212, 255, ${0.05 * glowIntensity}) 60%, transparent 100%)`,
        }}
      >
        <div
          className="absolute inset-1 rounded-full jarvis-glow-strong"
          style={{ background: `rgba(0, 212, 255, ${0.15 * glowIntensity})` }}
        />
        <div className="absolute inset-2 rounded-full" style={{ background: `rgba(0, 212, 255, ${0.2 * glowIntensity})` }} />
        <div className="absolute inset-3 rounded-full bg-jarvis-dark/95 flex flex-col items-center justify-center gap-0.5">
          <span className="text-sm font-bold text-jarvis-cyan jarvis-glow-text leading-none">
            {cpuUsage}%
          </span>
          {/* Mini sparkline waveform */}
          <svg viewBox="0 0 60 100" className="w-10 h-4 mt-0.5" preserveAspectRatio="none">
            <path
              d={sparklinePath}
              fill="none"
              stroke={`rgba(0, 212, 255, ${0.5 * glowIntensity})`}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      {/* Pulsating glow overlay that responds to CPU */}
      <div
        className="absolute inset-0 rounded-full jarvis-pulse"
        style={{
          background: `radial-gradient(circle, rgba(0, 212, 255, ${0.08 * glowIntensity}) 0%, transparent 60%)`,
        }}
      />

      {/* Energy field noise/interference overlay */}
      <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full jarvis-energy-field pointer-events-none">
        <circle cx="120" cy="120" r="70" fill="none" stroke="rgba(0, 212, 255, 0.06)" strokeWidth="20" strokeDasharray="2 4" />
        <circle cx="120" cy="120" r="90" fill="none" stroke="rgba(0, 212, 255, 0.04)" strokeWidth="10" strokeDasharray="3 6" />
      </svg>
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

/* ─── Relative Time Helper ──────────────────────────────────────────── */

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/* ─── Memory Item (Enhanced with relative time + delete) ──────────── */

function MemoryItem({ memory, onDelete }: { memory: Memory; onDelete?: (id: string) => void }) {
  return (
    <div className="flex items-start gap-2 py-1.5 group">
      <Brain className="h-3 w-3 text-jarvis-cyan/50 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium text-foreground/80 truncate">
            {memory.key}
          </p>
          {memory.important && (
            <Star className="h-2.5 w-2.5 text-yellow-400 shrink-0" />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {memory.value}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Badge variant="outline" className="text-[8px] h-4 px-1 border-jarvis-cyan/20 text-jarvis-cyan/50">
          {memory.category}
        </Badge>
        <span className="text-[8px] text-muted-foreground/40">
          {formatRelativeTime(memory.createdAt)}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(memory.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-400 text-muted-foreground/40"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
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

/* ─── Category Color Mapping ──────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  preference: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  fact: 'bg-jarvis-cyan/10 text-jarvis-cyan border-jarvis-cyan/20',
  routine: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  context: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  note: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
};

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
    addMemory,
    removeMemory,
  } = useJarvisStore();

  const { data: systemData, isLoading: systemLoading, refresh: refreshSystem } = useSystemMonitor();
  const { isPolling, lastChecked, insights, refreshInsights } = useProactive();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [memoryFilter, setMemoryFilter] = useState<string>('all');
  const [memorySearch, setMemorySearch] = useState('');
  const [newMemory, setNewMemory] = useState({
    category: 'fact',
    key: '',
    value: '',
  });

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

  // ── Memory category counts ──
  const categoryCounts = memories.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  // ── Filtered memories ──
  const filteredMemories = memories.filter((m) => {
    const matchesCategory = memoryFilter === 'all' || m.category === memoryFilter;
    const matchesSearch =
      memorySearch === '' ||
      m.key.toLowerCase().includes(memorySearch.toLowerCase()) ||
      m.value.toLowerCase().includes(memorySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayedMemories = filteredMemories.slice(0, 10);

  const handleQuickAction = useCallback(
    (panel: JarvisPanel) => {
      setActivePanel(panel);
    },
    [setActivePanel]
  );

  const handleAddMemory = useCallback(async () => {
    if (!newMemory.key.trim() || !newMemory.value.trim()) return;
    await addMemory({
      category: newMemory.category,
      key: newMemory.key.trim(),
      value: newMemory.value.trim(),
      source: 'user',
    });
    setNewMemory({ category: 'fact', key: '', value: '' });
    setShowAddMemory(false);
    // Also refresh insights
    refreshInsights();
  }, [newMemory, addMemory, refreshInsights]);

  const handleDeleteMemory = useCallback(
    async (id: string) => {
      await removeMemory(id);
      refreshInsights();
    },
    [removeMemory, refreshInsights]
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

          {/* ─── Enhanced Memory Section ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="jarvis-panel p-4"
          >
            {/* Header with Add button */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="h-3 w-3" />
                Memórias
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-jarvis-cyan/60">
                  {memories.length} total
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddMemory(!showAddMemory)}
                  className="h-5 w-5 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
                >
                  {showAddMemory ? (
                    <X className="h-3 w-3" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Category counts */}
            {Object.keys(categoryCounts).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['preference', 'fact', 'routine', 'context', 'note'].map(
                  (cat) => {
                    const count = categoryCounts[cat] || 0;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          setMemoryFilter(memoryFilter === cat ? 'all' : cat)
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] transition-colors cursor-pointer ${
                          memoryFilter === cat
                            ? CATEGORY_COLORS[cat] || 'bg-jarvis-cyan/10 text-jarvis-cyan border-jarvis-cyan/20'
                            : 'border-jarvis-border/20 text-muted-foreground/50 hover:border-jarvis-cyan/30'
                        }`}
                      >
                        <Filter className="h-2 w-2" />
                        {cat} ({count})
                      </button>
                    );
                  }
                )}
                {memoryFilter !== 'all' && (
                  <button
                    onClick={() => setMemoryFilter('all')}
                    className="inline-flex items-center gap-1 rounded-full border border-jarvis-border/20 px-2 py-0.5 text-[9px] text-muted-foreground/50 hover:text-jarvis-cyan transition-colors cursor-pointer"
                  >
                    <X className="h-2 w-2" />
                    Limpar
                  </button>
                )}
              </div>
            )}

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Buscar memórias..."
                value={memorySearch}
                onChange={(e) => setMemorySearch(e.target.value)}
                className="w-full bg-jarvis-dark/50 border border-jarvis-border/20 rounded-md pl-7 pr-3 py-1.5 text-[11px] text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-jarvis-cyan/30 transition-colors"
              />
            </div>

            {/* Add Memory Form */}
            <AnimatePresence>
              {showAddMemory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="bg-jarvis-dark/50 border border-jarvis-cyan/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={newMemory.category}
                        onChange={(e) =>
                          setNewMemory((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="bg-jarvis-dark border border-jarvis-border/20 rounded px-2 py-1 text-[10px] text-foreground/80 focus:outline-none focus:border-jarvis-cyan/30"
                      >
                        <option value="fact">Fato</option>
                        <option value="preference">Preferência</option>
                        <option value="routine">Rotina</option>
                        <option value="context">Contexto</option>
                        <option value="note">Nota</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Chave (ex: nome, comida_fav)"
                        value={newMemory.key}
                        onChange={(e) =>
                          setNewMemory((prev) => ({
                            ...prev,
                            key: e.target.value,
                          }))
                        }
                        className="flex-1 bg-jarvis-dark border border-jarvis-border/20 rounded px-2 py-1 text-[10px] text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-jarvis-cyan/30"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Valor (ex: João, pizza)"
                        value={newMemory.value}
                        onChange={(e) =>
                          setNewMemory((prev) => ({
                            ...prev,
                            value: e.target.value,
                          }))
                        }
                        className="flex-1 bg-jarvis-dark border border-jarvis-border/20 rounded px-2 py-1 text-[10px] text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-jarvis-cyan/30"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddMemory();
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddMemory}
                        disabled={
                          !newMemory.key.trim() || !newMemory.value.trim()
                        }
                        className="h-6 text-[10px] bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border-jarvis-cyan/20"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Memory list */}
            {displayedMemories.length > 0 ? (
              <div className="divide-y divide-jarvis-border/30 max-h-64 overflow-y-auto jarvis-scrollbar">
                {displayedMemories.map((memory) => (
                  <MemoryItem
                    key={memory.id}
                    memory={memory}
                    onDelete={handleDeleteMemory}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground/50">
                <Brain className="h-4 w-4" />
                <p className="text-xs">
                  {memoryFilter !== 'all' || memorySearch
                    ? 'Nenhuma memória encontrada'
                    : 'Nenhuma memória armazenada'}
                </p>
              </div>
            )}

            {/* Insights summary */}
            {insights && insights.totalMemories > 0 && (
              <div className="mt-3 pt-2 border-t border-jarvis-border/20">
                <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
                  {insights.summary.substring(0, 150)}
                  {insights.summary.length > 150 ? '...' : ''}
                </p>
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
            <span>JARVIS AI Assistant v3.0</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
