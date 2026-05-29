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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJarvisStore } from '@/lib/jarvis-store';
import type { JarvisPanel, Notification } from '@/lib/jarvis-store';

/* ─── Arc Reactor Animation ──────────────────────────────────────────── */

function ArcReactor() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-4">
      {/* Outermost ring */}
      <div className="absolute inset-0 rounded-full border border-jarvis-cyan/10" />

      {/* Rotating outer arcs */}
      <div
        className="absolute inset-2 rounded-full jarvis-arc-spinner"
        style={{ animationDuration: '8s' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Arc segments */}
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
        style={{ animationDuration: '6s', animationDirection: 'reverse' }}
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
        style={{ animationDuration: '4s' }}
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
        style={{ animationDuration: '3s', animationDirection: 'reverse' }}
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

      {/* Glowing center */}
      <div className="absolute inset-[4.5rem] rounded-full bg-jarvis-cyan/10 jarvis-pulse">
        <div className="absolute inset-1 rounded-full bg-jarvis-cyan/20 jarvis-glow-strong" />
        <div className="absolute inset-2 rounded-full bg-jarvis-cyan/30" />
        <div className="absolute inset-3 rounded-full bg-jarvis-dark flex items-center justify-center">
          <Zap className="h-5 w-5 text-jarvis-cyan jarvis-glow-text" />
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
  } = useJarvisStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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

          {/* Arc Reactor Animation */}
          <ArcReactor />

          {/* System Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="jarvis-panel p-4"
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Status do Sistema
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
            </div>
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

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
            <span>JARVIS AI Assistant v1.0</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
