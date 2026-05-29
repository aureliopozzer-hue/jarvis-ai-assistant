'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '@/lib/jarvis-store';

// ─── JARVIS Quotes for ambient text ──────────────────────────────────

const JARVIS_QUOTES = [
  'Sistemas operacionais, senhor.',
  'Todos os módulos estão funcionando dentro dos parâmetros.',
  'A casa está segura. Nenhuma anomalia detectada.',
  'Processamento de linguagem natural ativo.',
  'Monitoramento proativo em andamento.',
  'Rede neural operando com eficiência máxima.',
  'Senhor, os sensores indicam condições normais.',
  'Análise preditiva disponível quando necessário.',
  'Diagnóstico do sistema: todos os serviços verdes.',
  'Memória de longo prazo sincronizada.',
  'Protocolo de segurança ativo.',
  'Interface de voz pronta para comandos.',
  'Visão computacional calibrada.',
  'Motor de busca indexado e atualizado.',
  'Sistema de notificações funcional.',
];

// ─── Floating HUD Card ────────────────────────────────────────────────

function FloatingHudCard({
  label,
  value,
  x,
  y,
  delay,
  duration,
}: {
  label: string;
  value: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 1 }}
      className="jarvis-ambient-float absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <div className="bg-jarvis-dark/60 border border-jarvis-cyan/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
        <p className="text-[8px] tracking-widest text-jarvis-cyan/30 uppercase">{label}</p>
        <p className="text-[10px] text-jarvis-cyan/50 font-mono">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Particle Field ───────────────────────────────────────────────────

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2,
        duration: 15 + Math.random() * 25,
        delay: Math.random() * 15,
        opacity: 0.15 + Math.random() * 0.3,
      })),
    []
  );

  return (
    <div className="jarvis-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="jarvis-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// ─── Ambient Text Scroller ────────────────────────────────────────────

function AmbientTextScroller() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [time, setTime] = useState('');
  const systemStats = useJarvisStore((s) => s.systemStats);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % JARVIS_QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const uptime = systemStats?.uptime ?? 0;
  const cpuUsage = systemStats?.cpu?.usage ?? 0;
  const memPct = systemStats?.memory?.percentage ?? 0;

  const uptimeStr =
    uptime > 3600
      ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
      : `${Math.floor(uptime / 60)}m`;

  const statusLine = `${time} | CPU ${cpuUsage}% | RAM ${memPct}% | UP ${uptimeStr}`;

  return (
    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
      <div className="flex items-center gap-3 opacity-30">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-jarvis-cyan/20 to-transparent" />
        <div className="text-center">
          <p className="text-[9px] font-mono text-jarvis-cyan/50 tracking-wider">
            {statusLine}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 1 }}
              className="text-[9px] italic text-jarvis-cyan/30 mt-1"
            >
              &quot;{JARVIS_QUOTES[quoteIndex]}&quot;
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-jarvis-cyan/20 to-transparent" />
      </div>
    </div>
  );
}

// ─── Main Ambient Component ──────────────────────────────────────────

export function JarvisAmbient() {
  const systemStats = useJarvisStore((s) => s.systemStats);
  const isOnline = useJarvisStore((s) => s.isOnline);

  const cpuUsage = systemStats?.cpu?.usage ?? 0;
  const memPct = systemStats?.memory?.percentage ?? 0;
  const uptime = systemStats?.uptime ?? 0;
  const cores = systemStats?.cpu?.cores ?? 0;
  const hostname = systemStats?.hostname ?? 'jarvis-server';
  const platform = systemStats?.platform ?? 'linux';

  const uptimeStr =
    uptime > 3600
      ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
      : `${Math.floor(uptime / 60)}m`;

  // Floating HUD cards configuration
  const hudCards = useMemo(
    () => [
      { label: 'CPU', value: `${cpuUsage}%`, x: 5, y: 15, delay: 0, duration: 22 },
      { label: 'RAM', value: `${memPct}%`, x: 85, y: 20, delay: 2, duration: 26 },
      { label: 'UPTIME', value: uptimeStr, x: 8, y: 70, delay: 4, duration: 24 },
      { label: 'CORES', value: `${cores}`, x: 88, y: 65, delay: 3, duration: 20 },
      { label: 'HOST', value: hostname, x: 45, y: 8, delay: 5, duration: 28 },
      { label: 'OS', value: platform, x: 50, y: 85, delay: 6, duration: 22 },
      { label: 'STATUS', value: isOnline ? 'ONLINE' : 'OFFLINE', x: 15, y: 42, delay: 1, duration: 25 },
      { label: 'NET', value: 'ACTIVE', x: 78, y: 42, delay: 7, duration: 23 },
    ],
    [cpuUsage, memPct, uptimeStr, cores, hostname, platform, isOnline]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Particle field — drifting dots */}
      <ParticleField />

      {/* Floating HUD cards */}
      {hudCards.map((card, i) => (
        <FloatingHudCard
          key={`${card.label}-${i}`}
          label={card.label}
          value={card.value}
          x={card.x}
          y={card.y}
          delay={card.delay}
          duration={card.duration}
        />
      ))}

      {/* Hex grid background */}
      <div className="absolute inset-0 jarvis-hex-grid opacity-40" />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(10, 14, 23, 0.6) 100%)',
        }}
      />

      {/* Ambient text scroller at bottom */}
      <AmbientTextScroller />
    </div>
  );
}
