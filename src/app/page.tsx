'use client';

import { useEffect, useRef, useState } from 'react';
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
  Trash2,
  Check,
  Mail,
  Share2,
  Target,
  Calendar,
  FolderOpen,
  CreditCard,
  BarChart3,
  Bot,
  Image,
  Globe,
  FileText,
  Brain,
  AlertTriangle,
  Mic,
  Cloud,
  RefreshCw,
  ListTodo,
  Newspaper,
  Home as HomeIcon,
  Code,
  ChevronDown,
  Star,
  Quote,
  Users,
  Clock,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Crown,
  Play,
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
import { JarvisFinance } from '@/components/jarvis/jarvis-finance';
import { JarvisWeather } from '@/components/jarvis/jarvis-weather';
import { JarvisAutomation } from '@/components/jarvis/jarvis-automation';
import { JarvisTasks } from '@/components/jarvis/jarvis-tasks';
import { JarvisNews } from '@/components/jarvis/jarvis-news';
import { useJarvisStore, type Notification } from '@/lib/jarvis-store';
import { useWakeWord } from '@/hooks/use-wake-word';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';
import { useProactive } from '@/hooks/use-proactive';
import { useSystemMonitor } from '@/hooks/use-system-monitor';
import { useSoundEffects } from '@/hooks/use-sound-effects';

// ─── Landing Page Data ───────────────────────────────────────────────────

const features = [
  { icon: Bot, title: 'Chat Inteligente', desc: 'Conversação natural com memória de longo prazo' },
  { icon: Eye, title: 'Visão Computacional', desc: 'Análise e compreensão de imagens' },
  { icon: Search, title: 'Busca na Web', desc: 'Pesquisa em tempo real na internet' },
  { icon: Globe, title: 'Leitura de Páginas', desc: 'Extração de conteúdo de URLs' },
  { icon: Image, title: 'Geração de Imagens', desc: 'Criação de imagens com IA' },
  { icon: BarChart3, title: 'Mercado Financeiro', desc: 'Panorama diário, cotações, alertas, watchlist' },
  { icon: Mail, title: 'Gerenciamento de E-mail', desc: 'Leitura e envio de e-mails' },
  { icon: Share2, title: 'Redes Sociais', desc: 'Monitoramento e postagem automática' },
  { icon: Target, title: 'Campanhas de Marketing', desc: 'Criação e análise de campanhas' },
  { icon: Calendar, title: 'Calendário', desc: 'Agenda e eventos com lembretes' },
  { icon: FolderOpen, title: 'Gerenciamento de Arquivos', desc: 'Organização e busca de arquivos' },
  { icon: Brain, title: 'Memória de Longo Prazo', desc: 'Lembra de tudo sobre você' },
  { icon: AlertTriangle, title: 'Alertas Proativos', desc: 'Notificações inteligentes' },
  { icon: Mic, title: 'Comando de Voz', desc: 'Controle por voz com "Hey Jarvis"' },
  { icon: CreditCard, title: 'Pagamentos Stripe', desc: 'Cobranças e assinaturas' },
  { icon: Cloud, title: 'Previsão do Tempo', desc: 'Clima e forecast em tempo real' },
  { icon: RefreshCw, title: 'Automações', desc: 'Rotinas e workflows automatizados' },
  { icon: ListTodo, title: 'Gestão de Tarefas', desc: 'Projetos e listas de tarefas' },
  { icon: Newspaper, title: 'Notícias', desc: 'Agregador de notícias personalizado' },
  { icon: HomeIcon, title: 'Casa Inteligente', desc: 'Controle de dispositivos IoT' },
  { icon: Code, title: 'Assistente de Código', desc: 'Escrita, revisão e debug' },
  { icon: FileText, title: 'Geração de Documentos', desc: 'Contratos, relatórios, propostas' },
];

const testimonials = [
  {
    name: 'Ricardo Santos',
    role: 'CEO, TechStart',
    quote: 'O JARVIS transformou completamente minha produtividade. É como ter um assistente executivo que nunca dorme e sempre entrega resultados.',
    avatar: 'RS',
  },
  {
    name: 'Ana Oliveira',
    role: 'Diretora de Marketing, AgênciaX',
    quote: 'Gerenciar campanhas e redes sociais nunca foi tão fácil. O JARVIS automatiza tudo e ainda me dá insights valiosos sobre performance.',
    avatar: 'AO',
  },
  {
    name: 'Carlos Mendes',
    role: 'Investidor Independente',
    quote: 'Os alertas de mercado e o panorama financeiro diário me salvaram várias vezes. O JARVIS é indispensável para quem investe.',
    avatar: 'CM',
  },
];

const stats = [
  { label: 'Usuários', value: '10,000+', icon: Users },
  { label: 'Uptime', value: '99.9%', icon: Clock },
  { label: 'Mensagens', value: '50M+', icon: MessageCircle },
  { label: 'Avaliação', value: '4.9/5', icon: Star },
];

const pricingFeatures = [
  'Chat Inteligente com Memória',
  'Visão Computacional',
  'Busca na Web em Tempo Real',
  'Geração de Imagens com IA',
  'Mercado Financeiro Completo',
  'Gerenciamento de E-mail',
  'Redes Sociais & Marketing',
  'Calendário & Lembretes',
  'Comando de Voz',
  'Automações & Workflows',
  'Assistente de Código',
  'Geração de Documentos',
  'Alertas Proativos',
  'Casa Inteligente (IoT)',
  'Suporte Prioritário 24/7',
];

// ─── Arc Reactor Component ───────────────────────────────────────────────

function ArcReactor({ size = 200 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-jarvis-cyan/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)',
        }}
      >
        {/* Outer segments */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0"
            style={{
              width: 2,
              height: 12,
              background: 'rgba(0,212,255,0.5)',
              transform: `rotate(${i * 45}deg)`,
              transformOrigin: `50% ${size / 2}px`,
            }}
          />
        ))}
      </motion.div>

      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full border border-jarvis-cyan/30"
        style={{ inset: size * 0.15 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: 3,
              height: 8,
              background: 'rgba(0,212,255,0.6)',
              borderRadius: 2,
              transform: `rotate(${i * 30}deg)`,
              transformOrigin: `50% ${(size * 0.7) / 2}px`,
            }}
          />
        ))}
      </motion.div>

      {/* Inner ring */}
      <motion.div
        className="absolute rounded-full border-2 border-jarvis-cyan/40"
        style={{ inset: size * 0.3 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: 4,
              height: 10,
              background: 'rgba(0,212,255,0.7)',
              borderRadius: 2,
              transform: `rotate(${i * 60}deg)`,
              transformOrigin: `50% ${(size * 0.4) / 2}px`,
            }}
          />
        ))}
      </motion.div>

      {/* Core */}
      <div
        className="absolute rounded-full"
        style={{
          inset: size * 0.38,
          background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0.1) 50%, transparent 70%)',
          boxShadow: '0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)',
        }}
      >
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.6) 0%, rgba(0,212,255,0.2) 60%, transparent 80%)',
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

// ─── Floating Particles ──────────────────────────────────────────────────

function FloatingParticles() {
  return (
    <div className="jarvis-particles">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="jarvis-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: 0.2 + Math.random() * 0.4,
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// ─── Landing Page Sections ───────────────────────────────────────────────

function LandingPage({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="jarvis-grid-bg jarvis-hex-grid min-h-screen flex flex-col bg-jarvis-dark text-foreground">
      <FloatingParticles />

      {/* ─── Navigation ────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 border-b border-jarvis-border/50 bg-jarvis-dark/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="jarvis-mini-reactor absolute inset-0 rounded-full border border-jarvis-cyan/50" />
              <div className="h-2 w-2 rounded-full bg-jarvis-cyan jarvis-pulse" />
            </div>
            <span className="text-lg font-bold tracking-wider text-jarvis-cyan jarvis-glow-text">
              J.A.R.V.I.S.
            </span>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <button onClick={scrollToFeatures} className="text-sm text-jarvis-cyan/60 transition-colors hover:text-jarvis-cyan">
              Funcionalidades
            </button>
            <a href="#pricing" className="text-sm text-jarvis-cyan/60 transition-colors hover:text-jarvis-cyan">
              Preços
            </a>
            <a href="#testimonials" className="text-sm text-jarvis-cyan/60 transition-colors hover:text-jarvis-cyan">
              Depoimentos
            </a>
          </div>

          <Button
            onClick={onEnterDashboard}
            className="bg-jarvis-cyan/10 text-jarvis-cyan border border-jarvis-cyan/30 hover:bg-jarvis-cyan/20 hover:border-jarvis-cyan/50 transition-all"
          >
            <Zap className="mr-2 h-4 w-4" />
            Acessar JARVIS
          </Button>
        </div>
      </motion.nav>

      {/* ─── Hero Section ──────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        {/* Background image overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url(/jarvis-hero.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-jarvis-dark/50 via-transparent to-jarvis-dark" />

        {/* Arc Reactor */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="relative z-10 mb-8 sm:mb-12"
        >
          <ArcReactor size={160} />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-center"
        >
          <h1 className="jarvis-glow-text text-5xl font-black tracking-[0.15em] text-jarvis-cyan sm:text-6xl md:text-7xl lg:text-8xl">
            J.A.R.V.I.S.
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-4 text-lg font-medium text-jarvis-cyan/70 sm:text-xl md:text-2xl"
          >
            Seu Assistente de Inteligência Artificial Autônomo
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mx-auto mt-3 max-w-xl text-sm text-jarvis-cyan/40 sm:text-base"
          >
            Inspirado no JARVIS de Tony Stark. Um assistente que conversa, enxerga, busca,
            cria e automatiza — tudo em um só lugar.
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="relative z-10 mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Button
            onClick={onEnterDashboard}
            size="lg"
            className="bg-jarvis-cyan text-jarvis-dark hover:bg-jarvis-cyan/90 font-bold text-base px-8 py-6 jarvis-glow-strong transition-all"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Começar Agora
          </Button>
          <Button
            onClick={scrollToFeatures}
            size="lg"
            variant="outline"
            className="border-jarvis-cyan/30 bg-jarvis-cyan/5 text-jarvis-cyan hover:bg-jarvis-cyan/10 hover:border-jarvis-cyan/50 px-8 py-6 text-base transition-all"
          >
            Ver Funcionalidades
            <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
          </Button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.2em] text-jarvis-cyan/30">SCROLL</span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-jarvis-cyan/40 to-transparent" />
        </motion.div>
      </section>

      {/* ─── Features Section ──────────────────────────────────────── */}
      <section ref={featuresRef} className="relative z-10 border-t border-jarvis-border/30 bg-jarvis-dark/80 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-4 border-jarvis-cyan/30 bg-jarvis-cyan/10 text-jarvis-cyan">
              <Cpu className="mr-1 h-3 w-3" />
              22 MÓDULOS INTEGRADOS
            </Badge>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              Tudo que você precisa,{' '}
              <span className="jarvis-glow-text text-jarvis-cyan">em um só lugar</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-jarvis-cyan/50">
              Do chat inteligente ao controle da sua casa. O JARVIS é o assistente mais completo do mercado.
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="jarvis-panel group relative overflow-hidden p-5 transition-all hover:border-jarvis-cyan/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.1)]"
              >
                {/* Shimmer effect */}
                <div className="jarvis-holo-shimmer-rainbow absolute inset-0 pointer-events-none" />
                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-jarvis-cyan/10 text-jarvis-cyan transition-colors group-hover:bg-jarvis-cyan/20">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-xs text-jarvis-cyan/40 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ───────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 border-t border-jarvis-border/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Crown className="mr-1 h-3 w-3" />
              MELHOR CUSTO-BENEFÍCIO
            </Badge>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              Um plano.{' '}
              <span className="jarvis-glow-text text-jarvis-cyan">Tudo incluído.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-jarvis-cyan/50">
              Sem surpresas, sem limites artificiais. Um preço justo por um assistente completo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-16 max-w-lg"
          >
            <div className="jarvis-panel jarvis-ambient-glow jarvis-hud-brackets relative overflow-hidden p-8 sm:p-10">
              <div className="jarvis-holo-shimmer-rainbow absolute inset-0 pointer-events-none" />

              <div className="relative z-10">
                {/* Plan header */}
                <div className="text-center">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-jarvis-cyan/10 px-3 py-1 text-xs font-medium text-jarvis-cyan">
                    <Play className="h-3 w-3" />
                    7 dias grátis
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-foreground">JARVIS Pro</h3>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-jarvis-cyan jarvis-glow-text">R$ 97</span>
                    <span className="text-jarvis-cyan/50">/mês</span>
                  </div>
                  <p className="mt-2 text-sm text-jarvis-cyan/40">Tudo incluído. Sem limites.</p>
                </div>

                <Separator className="my-6 bg-jarvis-border" />

                {/* Feature list */}
                <div className="grid grid-cols-1 gap-2.5">
                  {pricingFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-jarvis-cyan/60">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      {f}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={onEnterDashboard}
                  className="mt-8 w-full bg-jarvis-cyan text-jarvis-dark hover:bg-jarvis-cyan/90 font-bold py-6 text-base jarvis-glow-strong transition-all"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Assinar Agora
                </Button>

                <p className="mt-3 text-center text-xs text-jarvis-cyan/30">
                  Cancele quando quiser. Sem fidelidade.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials Section ───────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 border-t border-jarvis-border/30 bg-jarvis-dark/80 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              Quem usa,{' '}
              <span className="jarvis-glow-text text-jarvis-cyan">recomenda</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-jarvis-cyan/50">
              Milhares de profissionais já confiam no JARVIS para ser mais produtivos.
            </p>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="jarvis-panel flex flex-col items-center p-5 text-center">
                <stat.icon className="mb-2 h-5 w-5 text-jarvis-cyan/60" />
                <span className="text-2xl font-bold text-jarvis-cyan jarvis-glow-text sm:text-3xl">{stat.value}</span>
                <span className="mt-1 text-xs text-jarvis-cyan/40">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Testimonial Cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="jarvis-panel p-6"
              >
                <Quote className="mb-4 h-8 w-8 text-jarvis-cyan/20" />
                <p className="text-sm leading-relaxed text-jarvis-cyan/60">&ldquo;{t.quote}&rdquo;</p>
                <Separator className="my-4 bg-jarvis-border" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-jarvis-cyan/10 text-xs font-bold text-jarvis-cyan">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-jarvis-cyan/40">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA Section ─────────────────────────────────────── */}
      <section className="relative z-10 border-t border-jarvis-border/30 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-8 flex justify-center">
              <ArcReactor size={100} />
            </div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              Pronto para ter seu próprio{' '}
              <span className="jarvis-glow-text text-jarvis-cyan">JARVIS</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-jarvis-cyan/50">
              Comece agora mesmo com 7 dias grátis. Sem compromisso. Cancele quando quiser.
            </p>
            <Button
              onClick={onEnterDashboard}
              size="lg"
              className="mt-8 bg-jarvis-cyan text-jarvis-dark hover:bg-jarvis-cyan/90 font-bold px-10 py-6 text-lg jarvis-glow-strong transition-all"
            >
              <Zap className="mr-2 h-5 w-5" />
              Ativar JARVIS Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto border-t border-jarvis-border/30 bg-jarvis-dark/90 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-6 w-6 items-center justify-center">
                <div className="jarvis-mini-reactor absolute inset-0 rounded-full border border-jarvis-cyan/50" />
                <div className="h-1.5 w-1.5 rounded-full bg-jarvis-cyan jarvis-pulse" />
              </div>
              <span className="text-sm font-semibold tracking-wider text-jarvis-cyan/60">J.A.R.V.I.S.</span>
            </div>
            <p className="text-xs text-jarvis-cyan/30">
              &copy; {new Date().getFullYear()} JARVIS. Todos os direitos reservados.
            </p>
            <p className="text-xs text-jarvis-cyan/30">
              Powered by <span className="text-jarvis-cyan/50 font-semibold">Z.AI</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

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

// ─── Dashboard Component ─────────────────────────────────────────────────

function JarvisDashboardView({ onBackToLanding }: { onBackToLanding: () => void }) {
  const { activePanel, loadConversations, loadNotifications, wakeWordActive, wakeWordState, setWakeWordActive, setWakeWordState, setActivePanel, ambientMode, loadEmails, loadSocialData, loadCampaigns, loadCalendarEvents, loadFiles, loadStripeConfig, loadFinanceQuotes, loadFinanceNews, loadFinanceWatchlist, loadFinanceAlerts } = useJarvisStore();

  // Sound effects hook
  const { playActivation, playDeactivation, playNotification, playSuccess, playWakeWord, playMessageSent } = useSoundEffects();

  // Voice hook for greeting and auto-speak
  const { speak: speakVoice } = useJarvisVoice();

  // ─── Voice Command Router ──────────────────────────────────────────────
  const routeVoiceCommand = (cmd: string): boolean => {
    const store = useJarvisStore.getState();
    const c = cmd.toLowerCase().trim();

    // Navigation commands — instantly switch panels
    const navMap: Record<string, string> = {
      'chat': 'chat', 'conversa': 'chat', 'conversar': 'chat', 'mensagem': 'chat', 'mensagens': 'chat',
      'visão': 'vision', 'visao': 'vision', 'imagem': 'vision', 'ver imagem': 'vision', 'analisar imagem': 'vision',
      'busca': 'search', 'buscar': 'search', 'pesquisa': 'search', 'pesquisar': 'search', 'procurar': 'search',
      'painel': 'dashboard', 'dashboard': 'dashboard', 'sistema': 'dashboard', 'status': 'dashboard', 'monitor': 'dashboard',
      'email': 'email', 'e-mail': 'email', 'correio': 'email', 'caixa de entrada': 'email', 'ler email': 'email', 'ler e-mail': 'email', 'ver email': 'email', 'emails': 'email',
      'social': 'social', 'redes sociais': 'social', 'rede social': 'social', 'instagram': 'social', 'twitter': 'social', 'postar': 'social',
      'campanha': 'campaigns', 'campanhas': 'campaigns', 'marketing': 'campaigns', 'anúncio': 'campaigns', 'anuncios': 'campaigns',
      'calendário': 'calendar', 'calendario': 'calendar', 'agenda': 'calendar', 'evento': 'calendar', 'eventos': 'calendar', 'reunião': 'calendar', 'reuniao': 'calendar',
      'arquivo': 'files', 'arquivos': 'files', 'documento': 'files', 'documentos': 'files', 'pasta': 'files',
      'pagamento': 'stripe', 'pagamentos': 'stripe', 'stripe': 'stripe', 'cobrança': 'stripe', 'cobranca': 'stripe', 'assinatura': 'stripe', 'faturamento': 'stripe',
      'finança': 'finance', 'financas': 'finance', 'financeiro': 'finance', 'mercado': 'finance', 'bolsa': 'finance', 'ação': 'finance', 'acoes': 'finance', 'cotacao': 'finance', 'cotação': 'finance', 'ibovespa': 'finance', 'dólar': 'finance', 'dolar': 'finance', 'bitcoin': 'finance', 'cripto': 'finance',
      'clima': 'weather', 'tempo': 'weather', 'previsão': 'weather', 'previsao': 'weather', 'temperatura': 'weather', 'chuva': 'weather',
      'automação': 'automation', 'automacao': 'automation', 'automatizar': 'automation', 'rotina': 'automation', 'rotinas': 'automation', 'workflow': 'automation',
      'tarefa': 'tasks', 'tarefas': 'tasks', 'todo': 'tasks', 'to-do': 'tasks', 'projeto': 'tasks', 'projetos': 'tasks',
      'notícia': 'news', 'noticias': 'news', 'notícia': 'news', 'jornal': 'news', 'informação': 'news', 'informacoes': 'news',
    };

    // Check navigation first
    for (const [keyword, panel] of Object.entries(navMap)) {
      if (c.includes(keyword)) {
        setActivePanel(panel as any);
        playSuccess();
        // Trigger data loading for the panel
        switch (panel) {
          case 'email': store.loadEmails(); break;
          case 'social': store.loadSocialData(); break;
          case 'campaigns': store.loadCampaigns(); break;
          case 'calendar': store.loadCalendarEvents(); break;
          case 'files': store.loadFiles(); break;
          case 'stripe': store.loadStripeConfig(); break;
          case 'finance': store.loadFinanceQuotes(); store.loadFinanceNews(); store.loadFinanceWatchlist(); store.loadFinanceAlerts(); break;
          case 'weather': store.loadWeather('São Paulo'); break;
          case 'automation': store.loadAutomations(); break;
          case 'tasks': store.loadTasks(); store.loadProjects(); break;
          case 'news': store.loadNews(); break;
          case 'dashboard': break;
          case 'vision': break;
          case 'search': break;
          case 'chat': break;
        }
        // Speak a confirmation
        const panelNames: Record<string, string> = {
          chat: 'Conversa', vision: 'Visão Computacional', search: 'Busca na Web',
          dashboard: 'Painel do Sistema', email: 'E-mail', social: 'Redes Sociais',
          campaigns: 'Campanhas de Marketing', calendar: 'Calendário', files: 'Arquivos',
          stripe: 'Pagamentos', finance: 'Mercado Financeiro', weather: 'Previsão do Tempo',
          automation: 'Automações', tasks: 'Tarefas', news: 'Notícias',
        };
        speakVoice(`Abrindo ${panelNames[panel] || panel}.`);
        return true;
      }
    }

    // Direct action commands — trigger store functions + navigate
    // Finance-specific commands
    if (c.includes('panorama') || c.includes('resumo financeiro') || c.includes('briefing')) {
      setActivePanel('finance');
      store.loadFinanceBriefing();
      speakVoice('Gerando panorama financeiro do dia.');
      return true;
    }

    // Memory commands
    if (c.includes('lembre') || c.includes('lembrar') || c.includes('memória') || c.includes('memoria')) {
      if (c.includes('lembre') || c.includes('lembrar')) {
        // Save a memory
        const memoryContent = c.replace(/.*(?:lembre|lembrar)(?:-se)?\s*(?:de|que)?\s*/i, '').trim();
        if (memoryContent) {
          store.addMemory({ category: 'personal', key: 'reminder', value: memoryContent });
          speakVoice(`Lembrarei disso: ${memoryContent}`);
          return true;
        }
      }
      setActivePanel('chat');
      return false; // fall through to LLM for memory recall
    }

    // Image generation command
    if (c.includes('gere') || c.includes('gerar imagem') || c.includes('criar imagem') || c.includes('gera uma imagem') || c.includes('cria uma imagem')) {
      setActivePanel('chat');
      return false; // let LLM handle image generation via tool
    }

    // Web search command — instant search
    if (c.includes('busque') || c.includes('pesquise') || c.includes('procure por') || c.includes('o que é') || c.includes('o que e')) {
      setActivePanel('search');
      const query = c.replace(/.*(?:busque|pesquise|procure por)\s*/i, '').trim() || c;
      if (query) {
        store.searchWeb(query);
        speakVoice(`Buscando: ${query}`);
        return true;
      }
    }

    // Send email command
    if (c.includes('enviar email') || c.includes('enviar e-mail') || c.includes('mande email') || c.includes('mandar email')) {
      setActivePanel('email');
      store.loadEmails();
      return false; // let LLM handle the composition
    }

    // Not a direct command — fall through to LLM
    return false;
  };

  // Wake word hook
  const { state: wakeWordHookState, startListening: startWakeListening, stopListening: stopWakeListening, resetWake, isSupported: wakeWordSupported, commandText } = useWakeWord({
    autoStart: false,
    onWake: () => {
      playWakeWord();
      setActivePanel('chat');
    },
    onCommand: (cmd) => {
      const store = useJarvisStore.getState();
      if (cmd.trim()) {
        playMessageSent();
        // Try routing as a direct voice command first
        const handled = routeVoiceCommand(cmd.trim());
        if (!handled) {
          // Fall through to LLM chat
          store.setVoiceInitiated(true);
          store.sendMessage(cmd.trim());
        }
      }
    },
  });

  // Proactive hook
  useProactive({ autoStart: true, interval: 30000 });

  // System monitor hook
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

  const wakeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (wakeWordState === 'awake') {
      setActivePanel('chat');
      if (wakeResetTimerRef.current) {
        clearTimeout(wakeResetTimerRef.current);
      }
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

  const prevNotifCountRef = useRef(0);

  // Initial data loading and greeting
  useEffect(() => {
    loadConversations();
    loadNotifications();

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

    const activated = sessionStorage.getItem('jarvis-activated');
    if (!activated) {
      sessionStorage.setItem('jarvis-activated', 'true');
      setTimeout(() => {
        playActivation();
      }, 500);
    }
  }, [loadConversations, loadNotifications, speakVoice, playActivation, playSuccess]);

  // Play notification sound
  const notifications = useJarvisStore((s) => s.notifications);
  useEffect(() => {
    if (notifications.length > prevNotifCountRef.current && prevNotifCountRef.current > 0) {
      playNotification();
    }
    prevNotifCountRef.current = notifications.length;
  }, [notifications.length, playNotification]);

  // Play sound on messages
  const messages = useJarvisStore((s) => s.messages);
  const voiceInitiated = useJarvisStore((s) => s.voiceInitiated);
  const prevMsgCountRef = useRef(0);
  const lastSpokenMsgRef = useRef<string>('');
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        playSuccess();

        // Auto-speak when voice-initiated (speakVoice already preprocesses text)
        if (voiceInitiated && lastMsg.id !== lastSpokenMsgRef.current) {
          lastSpokenMsgRef.current = lastMsg.id;
          if (lastMsg.content) {
            speakVoice(lastMsg.content);
          }
          useJarvisStore.getState().setVoiceInitiated(false);
        }
      } else if (lastMsg?.role === 'user') {
        playMessageSent();
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, playSuccess, playMessageSent, voiceInitiated, speakVoice]);

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

  // Auto-load data when switching panels
  useEffect(() => {
    const loadedPanels = useJarvisStore.getState().loadedPanels;
    if (!loadedPanels.has(activePanel)) {
      switch (activePanel) {
        case 'email': loadEmails(); break;
        case 'social': loadSocialData(); break;
        case 'campaigns': loadCampaigns(); break;
        case 'calendar': loadCalendarEvents(); break;
        case 'files': loadFiles(); break;
        case 'stripe':
          loadStripeConfig(); break;
        case 'finance':
          loadFinanceQuotes(); loadFinanceNews(); loadFinanceWatchlist(); loadFinanceAlerts(); break;
        case 'weather':
          useJarvisStore.getState().loadWeather('São Paulo'); break;
        case 'automation':
          useJarvisStore.getState().loadAutomations(); break;
        case 'tasks':
          useJarvisStore.getState().loadTasks(); useJarvisStore.getState().loadProjects(); break;
        case 'news':
          useJarvisStore.getState().loadNews(); break;
      }
    }
  }, [activePanel, loadEmails, loadSocialData, loadCampaigns, loadCalendarEvents, loadFiles, loadStripeConfig, loadFinanceQuotes, loadFinanceNews, loadFinanceWatchlist, loadFinanceAlerts]);

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
      case 'finance':
        return <JarvisFinance />;
      case 'weather':
        return <JarvisWeather />;
      case 'automation':
        return <JarvisAutomation />;
      case 'tasks':
        return <JarvisTasks />;
      case 'news':
        return <JarvisNews />;
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLanding}
            className="h-8 px-2 text-[10px] text-jarvis-cyan/40 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <ArrowRight className="mr-1 h-3 w-3 rotate-180" />
            Voltar
          </Button>
          <div className="flex-1">
            <JarvisHeader />
          </div>
        </div>
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
            {activePanel === 'finance' && <BarChart3 className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'weather' && <Cloud className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'automation' && <RefreshCw className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'tasks' && <ListTodo className="h-4 w-4 text-jarvis-cyan/60" />}
            {activePanel === 'news' && <Newspaper className="h-4 w-4 text-jarvis-cyan/60" />}
            <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/50">
              {activePanel === 'chat' ? 'CONVERSA' : activePanel === 'vision' ? 'VISÃO' : activePanel === 'search' ? 'BUSCA' : activePanel === 'dashboard' ? 'PAINEL' : activePanel === 'email' ? 'EMAIL' : activePanel === 'social' ? 'SOCIAL' : activePanel === 'campaigns' ? 'CAMPANHAS' : activePanel === 'calendar' ? 'CALENDÁRIO' : activePanel === 'files' ? 'ARQUIVOS' : activePanel === 'finance' ? 'FINANÇAS' : activePanel === 'weather' ? 'TEMPO' : activePanel === 'automation' ? 'AUTOMAÇÃO' : activePanel === 'tasks' ? 'TAREFAS' : activePanel === 'news' ? 'NOTÍCIAS' : 'PAGAMENTOS'}
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

// ─── Main Page ───────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<'landing' | 'dashboard'>('landing');

  return (
    <AnimatePresence mode="wait">
      {mode === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LandingPage onEnterDashboard={() => setMode('dashboard')} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="h-screen"
        >
          <JarvisDashboardView onBackToLanding={() => setMode('landing')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
