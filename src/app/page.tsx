'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Eye,
  Search,
  LayoutDashboard,
  Bell,
  Zap,
  Cpu,
  Shield,
  X,
  Trash2,
  Check,
  Mail,
  Share2,
  Target,
  Calendar,
  FolderOpen,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { JarvisHeader } from '@/components/jarvis/jarvis-header';
import { JarvisSidebar } from '@/components/jarvis/jarvis-sidebar';
import { JarvisInput } from '@/components/jarvis/jarvis-input';
import { JarvisChat } from '@/components/jarvis/jarvis-chat';
import { JarvisVision } from '@/components/jarvis/jarvis-vision';
import { JarvisSearch } from '@/components/jarvis/jarvis-search';
import { JarvisDashboard } from '@/components/jarvis/jarvis-dashboard';
import { JarvisAmbient } from '@/components/jarvis/jarvis-ambient';
import { JarvisEmail } from '@/components/jarvis/jarvis-email';
import { JarvisSocial } from '@/components/jarvis/jarvis-social';
import { JarvisCampaigns } from '@/components/jarvis/jarvis-campaigns';
import { JarvisCalendar } from '@/components/jarvis/jarvis-calendar';
import { JarvisFiles } from '@/components/jarvis/jarvis-files';
import { JarvisStripe } from '@/components/jarvis/jarvis-stripe';
import { useJarvisStore, type Notification } from '@/lib/jarvis-store';
import { useWakeWord } from '@/hooks/use-wake-word';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';
import { useProactive } from '@/hooks/use-proactive';
import { useSystemMonitor } from '@/hooks/use-system-monitor';
import { useSoundEffects } from '@/hooks/use-sound-effects';

// ─── Right Sidebar - Notifications ───────────────────────────────────

function RightSidebar() {
  const { notifications, unreadCount, markAsRead, clearNotifications } = useJarvisStore();

  const getNotifIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
        return <Zap className="h-3.5 w-3.5 text-red-400" />;
      case 'info':
        return <Cpu className="h-3.5 w-3.5 text-jarvis-cyan" />;
      case 'warning':
        return <Shield className="h-3.5 w-3.5 text-yellow-400" />;
      case 'success':
        return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="jarvis-panel jarvis-hud-corner flex w-64 flex-col overflow-hidden md:w-72">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-jarvis-cyan/60" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60">
            ALERTAS
          </span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-4 px-1 text-[9px]">
              {unreadCount}
            </Badge>
          )}
        </div>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearNotifications}
            className="h-6 w-6 text-jarvis-cyan/30 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Separator className="bg-jarvis-border" />
      <ScrollArea className="jarvis-scrollbar flex-1 p-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <Bell className="mb-2 h-6 w-6 text-jarvis-cyan/15" />
            <p className="text-[10px] text-jarvis-cyan/25">Sem notificações</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group flex items-start gap-2 rounded-lg p-2.5 transition-colors ${
                  notif.read
                    ? 'bg-transparent'
                    : 'bg-jarvis-cyan/5 border border-jarvis-cyan/10'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-jarvis-cyan/70 line-clamp-1">
                    {notif.title}
                  </p>
                  <p className="text-[10px] text-jarvis-cyan/35 line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markAsRead(notif.id)}
                    className="h-5 w-5 shrink-0 text-jarvis-cyan/30 hover:text-jarvis-cyan"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Quick Actions */}
      <Separator className="bg-jarvis-border" />
      <div className="p-2">
        <span className="px-2 text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/40">
          AÇÕES RÁPIDAS
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          {[
            { label: 'Novo Chat', icon: MessageSquare, action: () => useJarvisStore.getState().createConversation() },
            { label: 'Buscar', icon: Search, action: () => useJarvisStore.getState().setActivePanel('search') },
            { label: 'Visão', icon: Eye, action: () => useJarvisStore.getState().setActivePanel('vision') },
            { label: 'Painel', icon: LayoutDashboard, action: () => useJarvisStore.getState().setActivePanel('dashboard') },
          ].map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              onClick={action.action}
              className="flex h-8 items-center gap-1.5 text-[10px] text-jarvis-cyan/40 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan"
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 17) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function Home() {
  const { activePanel, loadConversations, loadNotifications, wakeWordActive, wakeWordState, setWakeWordActive, setWakeWordState, setActivePanel, ambientMode, loadEmails, loadSocialData, loadCampaigns, loadCalendarEvents, loadFiles, loadStripeConfig } = useJarvisStore();

  // Sound effects hook
  const { playActivation, playDeactivation, playNotification, playSuccess, playWakeWord, playMessageSent } = useSoundEffects();

  // Wake word hook
  const { state: wakeWordHookState, startListening: startWakeListening, stopListening: stopWakeListening, resetWake, isSupported: wakeWordSupported, commandText } = useWakeWord({
    autoStart: false,
    onWake: () => {
      // When wake word is detected, play the wake sound and switch to chat panel
      playWakeWord();
      setActivePanel('chat');
    },
    onCommand: (cmd) => {
      // When a command is captured after the wake word, send it to chat
      const store = useJarvisStore.getState();
      if (cmd.trim()) {
        playMessageSent();
        store.sendMessage(cmd.trim());
      }
    },
  });

  // Voice hook for greeting
  const { speak: speakVoice } = useJarvisVoice();

  // Proactive hook — auto-starts polling
  useProactive({ autoStart: true, interval: 30000 });

  // System monitor hook — auto-starts polling
  const { data: systemData } = useSystemMonitor({ autoStart: true });

  // Sync system data to store
  useEffect(() => {
    if (systemData) {
      useJarvisStore.getState().setSystemStats(systemData);
    }
  }, [systemData]);

  // Sync wake word state from hook to store
  useEffect(() => {
    setWakeWordState(wakeWordHookState);
  }, [wakeWordHookState, setWakeWordState]);

  // Start/stop wake word based on store flag
  useEffect(() => {
    if (wakeWordActive && wakeWordSupported) {
      startWakeListening();
    } else if (!wakeWordActive) {
      stopWakeListening();
      setWakeWordState('idle');
    }
  }, [wakeWordActive, wakeWordSupported, startWakeListening, stopWakeListening, setWakeWordState]);

  // When wake word detects "jarvis", auto-switch to chat
  // Command timeout is handled inside the hook now (5 seconds)
  const wakeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (wakeWordState === 'awake') {
      setActivePanel('chat');

      // Clear any existing timer
      if (wakeResetTimerRef.current) {
        clearTimeout(wakeResetTimerRef.current);
      }

      // Reset after 6 seconds (slightly longer than hook's 5s timeout)
      wakeResetTimerRef.current = setTimeout(() => {
        resetWake();
      }, 6000);
    }

    return () => {
      if (wakeResetTimerRef.current) {
        clearTimeout(wakeResetTimerRef.current);
      }
    };
  }, [wakeWordState, setActivePanel, resetWake]);

  // Track previous notification count to play sound on new notifications
  const prevNotifCountRef = useRef(0);

  // Initial data loading and greeting
  useEffect(() => {
    // Initial data loading
    loadConversations();
    loadNotifications();

    // Add welcome notification only once per session
    const welcomed = sessionStorage.getItem('jarvis-welcomed');
    if (!welcomed) {
      sessionStorage.setItem('jarvis-welcomed', 'true');
      setTimeout(() => {
        const store = useJarvisStore.getState();
        store.addNotification({
          type: 'info',
          title: 'Sistema JARVIS Online',
          message: 'Todos os módulos operacionais. Como posso ajudar, senhor?',
          read: false,
        });
        store.addNotification({
          type: 'success',
          title: 'Motor de IA Ativo',
          message: 'Processamento de linguagem natural e visão computacional prontos.',
          read: false,
        });
      }, 1000);

      // Initial greeting voice — only once per session
      const greeted = sessionStorage.getItem('jarvis-greeted');
      if (!greeted) {
        sessionStorage.setItem('jarvis-greeted', 'true');
        setTimeout(() => {
          const greeting = getGreeting();
          speakVoice(`Sistema JARVIS online. ${greeting}, senhor. Como posso ajudar?`);
          playSuccess();
        }, 2000);
      }
    }

    // Play activation sound on initial load
    const activated = sessionStorage.getItem('jarvis-activated');
    if (!activated) {
      sessionStorage.setItem('jarvis-activated', 'true');
      setTimeout(() => {
        playActivation();
      }, 500);
    }
  }, [loadConversations, loadNotifications, speakVoice, playActivation, playSuccess]);

  // Play notification sound when new notifications are added
  const notifications = useJarvisStore((s) => s.notifications);
  useEffect(() => {
    if (notifications.length > prevNotifCountRef.current && prevNotifCountRef.current > 0) {
      playNotification();
    }
    prevNotifCountRef.current = notifications.length;
  }, [notifications.length, playNotification]);

  // Play success sound when JARVIS responds (new assistant message)
  const messages = useJarvisStore((s) => s.messages);
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        playSuccess();
      } else if (lastMsg?.role === 'user') {
        playMessageSent();
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, playSuccess, playMessageSent]);

  // Play deactivation sound on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      playDeactivation();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [playDeactivation]);

  // Handle online/offline events
  useEffect(() => {
    // Set initial online status after hydration to avoid mismatch
    useJarvisStore.getState().setOnlineStatus(navigator.onLine);

    const handleOnline = () => useJarvisStore.getState().setOnlineStatus(true);
    const handleOffline = () => useJarvisStore.getState().setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-load data when switching to panels for the first time
  useEffect(() => {
    const loadedPanels = useJarvisStore.getState().loadedPanels;
    if (!loadedPanels.has(activePanel)) {
      switch (activePanel) {
        case 'email': loadEmails(); break;
        case 'social': loadSocialData(); break;
        case 'campaigns': loadCampaigns(); break;
        case 'calendar': loadCalendarEvents(); break;
        case 'files': loadFiles(); break;
        case 'stripe': loadStripeConfig(); break;
      }
    }
  }, [activePanel, loadEmails, loadSocialData, loadCampaigns, loadCalendarEvents, loadFiles, loadStripeConfig]);

  const renderPanel = () => {
    switch (activePanel) {
      case 'chat':
        return <JarvisChat />;
      case 'vision':
        return <JarvisVision />;
      case 'search':
        return <JarvisSearch />;
      case 'dashboard':
        return <JarvisDashboard />;
      case 'email':
        return <JarvisEmail />;
      case 'social':
        return <JarvisSocial />;
      case 'campaigns':
        return <JarvisCampaigns />;
      case 'calendar':
        return <JarvisCalendar />;
      case 'files':
        return <JarvisFiles />;
      case 'stripe':
        return <JarvisStripe />;
    }
  };

  return (
    <div className="jarvis-grid-bg jarvis-hex-grid flex h-screen flex-col overflow-hidden bg-jarvis-dark">
      {/* Ambient Mode Background Layer */}
      <AnimatePresence>
        {ambientMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-0"
          >
            <JarvisAmbient />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wake word visual flash overlay */}
      <AnimatePresence>
        {wakeWordState === 'awake' && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{
              background: 'radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="shrink-0 px-2 pt-2 md:px-3 md:pt-3">
        <JarvisHeader />
      </div>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 gap-2 p-2 md:gap-3 md:p-3">
        {/* Left Sidebar */}
        <JarvisSidebar />

        {/* Center Panel */}
        <div className="jarvis-panel jarvis-hud-corner jarvis-scanline flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center gap-2 border-b border-jarvis-border px-4 py-2.5">
            {activePanel === 'chat' && <MessageSquare className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'vision' && <Eye className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'search' && <Search className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'dashboard' && <LayoutDashboard className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'email' && <Mail className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'social' && <Share2 className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'campaigns' && <Target className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'calendar' && <Calendar className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'files' && <FolderOpen className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'stripe' && <CreditCard className="h-4 w-4 text-jarvis-cyan/60" />}
            <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/50">
              {activePanel === 'chat' ? 'CONVERSA' : activePanel === 'vision' ? 'VISÃO' : activePanel === 'search' ? 'BUSCA' : activePanel === 'dashboard' ? 'PAINEL' : activePanel === 'email' ? 'EMAIL' : activePanel === 'social' ? 'SOCIAL' : activePanel === 'campaigns' ? 'CAMPANHAS' : activePanel === 'calendar' ? 'CALENDÁRIO' : activePanel === 'files' ? 'ARQUIVOS' : 'PAGAMENTOS'}
            </span>
            {wakeWordState === 'awake' && commandText && (
              <span className="ml-2 text-[10px] text-jarvis-cyan animate-pulse">
                &quot;{commandText}&quot;
              </span>
            )}
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 jarvis-pulse" />
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderPanel()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-jarvis-border p-2 md:p-3">
            <JarvisInput />
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
