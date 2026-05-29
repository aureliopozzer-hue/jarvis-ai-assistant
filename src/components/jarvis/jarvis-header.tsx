'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Settings,
  Wifi,
  WifiOff,
  Mic,
  Volume2,
  VolumeX,
  Radio,
  SignalZero,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useJarvisStore } from '@/lib/jarvis-store';

// ─── Mini Arc Reactor for Header ──────────────────────────────────────

function MiniArcReactor() {
  return (
    <div className="relative w-7 h-7 flex items-center justify-center">
      {/* Outer spinning ring */}
      <svg viewBox="0 0 28 28" className="absolute inset-0 w-full h-full jarvis-mini-reactor">
        <circle
          cx="14"
          cy="14"
          r="12"
          fill="none"
          stroke="rgba(0, 212, 255, 0.3)"
          strokeWidth="0.8"
          strokeDasharray="6 3 10 4"
        />
      </svg>
      {/* Inner counter-spinning ring */}
      <svg viewBox="0 0 28 28" className="absolute inset-0 w-full h-full jarvis-mini-reactor-reverse">
        <circle
          cx="14"
          cy="14"
          r="9"
          fill="none"
          stroke="rgba(0, 212, 255, 0.4)"
          strokeWidth="0.6"
          strokeDasharray="4 2 8 3"
        />
      </svg>
      {/* Center glow dot */}
      <div className="absolute w-2 h-2 rounded-full bg-jarvis-cyan/40 jarvis-pulse" />
    </div>
  );
}

// ─── HUD Data Readout Scrolling Text ──────────────────────────────────

function HudDataReadout() {
  const systemStats = useJarvisStore((s) => s.systemStats);
  const isOnline = useJarvisStore((s) => s.isOnline);

  const cpuUsage = systemStats?.cpu?.usage ?? 0;
  const memPct = systemStats?.memory?.percentage ?? 0;
  const uptime = systemStats?.uptime ?? 0;
  const cores = systemStats?.cpu?.cores ?? 0;
  const hostname = systemStats?.hostname ?? '';
  const platform = systemStats?.platform ?? '';

  const uptimeStr =
    uptime > 3600
      ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
      : `${Math.floor(uptime / 60)}m`;

  const readoutText = useMemo(
    () =>
      `◆ CPU: ${cpuUsage}% ◆ RAM: ${memPct}% ◆ CORES: ${cores} ◆ UPTIME: ${uptimeStr} ◆ HOST: ${hostname} ◆ OS: ${platform} ◆ STATUS: ${isOnline ? 'ONLINE' : 'OFFLINE'} ◆`,
    [cpuUsage, memPct, cores, uptimeStr, hostname, platform, isOnline]
  );

  return (
    <div className="jarvis-data-readout hidden xl:block max-w-[300px]">
      <span className="text-[8px] font-mono text-jarvis-cyan/25 tracking-wider">
        {readoutText}
      </span>
    </div>
  );
}

// ─── Main Header Component ────────────────────────────────────────────

export function JarvisHeader() {
  const {
    isOnline,
    isListening,
    isSpeaking,
    voiceEnabled,
    unreadCount,
    sidebarOpen,
    toggleSidebar,
    wakeWordActive,
    wakeWordState,
    setWakeWordActive,
    ambientMode,
    toggleAmbientMode,
  } = useJarvisStore();

  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <header className="jarvis-panel jarvis-hud-brackets jarvis-ambient-glow flex items-center justify-between px-4 py-2 md:px-6 md:py-3">
        {/* Left section - Logo & Menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-jarvis-cyan hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan h-8 w-8 md:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="stroke-current"
            >
              <path d="M2 4h14M2 9h14M2 14h14" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mini Arc Reactor */}
            <MiniArcReactor />
            <div className="flex flex-col">
              <h1 className="jarvis-glow-text text-base font-bold tracking-widest text-jarvis-cyan md:text-lg">
                J.A.R.V.I.S.
              </h1>
              <span className="text-[10px] tracking-wider text-jarvis-cyan/50">
                JUST A RATHER VERY INTELLIGENT SYSTEM
              </span>
            </div>
          </motion.div>
        </div>

        {/* Center section - Date/Time + HUD Readout */}
        <div className="hidden flex-col items-center md:flex">
          <motion.div
            className="font-mono text-lg font-medium tracking-wider text-jarvis-cyan/90 jarvis-glow-text"
            key={time}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {time}
          </motion.div>
          <div className="font-mono text-[10px] tracking-wider text-jarvis-cyan/40">
            {date}
          </div>
          {/* HUD Data Readout — scrolling stats text */}
          <HudDataReadout />
        </div>

        {/* Right section - Status & Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Wake Word Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setWakeWordActive(!wakeWordActive)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-jarvis-cyan/10 cursor-pointer"
              >
                {wakeWordActive && wakeWordState === 'listening' ? (
                  <>
                    <Radio className="h-3.5 w-3.5 text-jarvis-cyan jarvis-wake-breathing" />
                    <span className="hidden text-[10px] font-medium text-jarvis-cyan md:inline">LISTENING</span>
                  </>
                ) : wakeWordState === 'awake' ? (
                  <>
                    <Radio className="h-3.5 w-3.5 text-jarvis-cyan jarvis-pulse" />
                    <span className="hidden text-[10px] font-bold text-jarvis-cyan md:inline">AWAKE</span>
                  </>
                ) : wakeWordState === 'processing' ? (
                  <>
                    <Radio className="h-3.5 w-3.5 text-jarvis-cyan jarvis-pulse" />
                    <span className="hidden text-[10px] font-medium text-jarvis-cyan/70 md:inline">PROCESSING</span>
                  </>
                ) : (
                  <>
                    <SignalZero className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="hidden text-[10px] font-medium text-muted-foreground md:inline">SLEEP</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{wakeWordActive ? 'Wake word ativo — clique para desativar' : 'Wake word inativo — clique para ativar'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Connection Status — Dramatic pulsing ring */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                <div className={`relative flex items-center justify-center ${isOnline ? 'jarvis-status-ring' : ''}`}>
                  {isOnline ? (
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
                <span
                  className={`hidden text-[10px] font-medium md:inline ${
                    isOnline ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isOnline ? 'System Online' : 'System Offline'}</p>
            </TooltipContent>
          </Tooltip>

          {/* AI Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                <motion.div
                  className="h-2 w-2 rounded-full bg-jarvis-cyan jarvis-status-ring"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="hidden text-[10px] font-medium text-jarvis-cyan/70 md:inline">
                  AI ACTIVE
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI System Active</p>
            </TooltipContent>
          </Tooltip>

          {/* Voice Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                {isListening ? (
                  <Mic className="h-3.5 w-3.5 text-jarvis-cyan jarvis-pulse" />
                ) : voiceEnabled ? (
                  <Volume2 className="h-3.5 w-3.5 text-jarvis-cyan/50" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="h-3 w-0.5 rounded-full bg-jarvis-cyan"
                        animate={{ scaleY: [0.5, 1.5, 0.5] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isListening
                  ? 'Listening...'
                  : isSpeaking
                    ? 'Speaking...'
                    : voiceEnabled
                      ? 'Voice Enabled'
                      : 'Voice Disabled'}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="mx-1 hidden h-6 w-px bg-jarvis-border md:block" />

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 text-jarvis-cyan/70 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[9px]"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'No new notifications'}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-jarvis-cyan/70 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* Ambient Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAmbientMode}
                className={`h-8 w-8 transition-colors ${
                  ambientMode
                    ? 'text-jarvis-cyan bg-jarvis-cyan/10'
                    : 'text-jarvis-cyan/40 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan'
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Ambient HUD</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
