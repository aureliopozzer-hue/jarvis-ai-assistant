'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Settings,
  Wifi,
  WifiOff,
  Brain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  SignalZero,
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
      <header className="jarvis-panel jarvis-hud-corner flex items-center justify-between px-4 py-2 md:px-6 md:py-3">
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
            <div className="relative flex items-center justify-center">
              <div className="absolute h-7 w-7 rounded-full bg-jarvis-cyan/20 jarvis-pulse" />
              <Brain className="relative z-10 h-5 w-5 text-jarvis-cyan" />
            </div>
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

        {/* Center section - Date/Time */}
        <div className="hidden flex-col items-center md:flex">
          <motion.div
            className="font-mono text-lg font-medium tracking-wider text-jarvis-cyan/90"
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

          {/* Connection Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-red-400" />
                )}
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
                  className="h-2 w-2 rounded-full bg-jarvis-cyan"
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
        </div>
      </header>
    </TooltipProvider>
  );
}
