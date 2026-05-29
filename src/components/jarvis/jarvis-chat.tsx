'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User,
  Volume2,
  VolumeX,
  Search,
  Image,
  Newspaper,
  Sparkles,
  FileText,
  Code,
  Cpu,
  Database,
  Bell,
  BookOpen,
  Wrench,
  Loader2,
} from 'lucide-react';
import { useJarvisStore, type Message } from '@/lib/jarvis-store';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ─── Tool Icon & Label Map ──────────────────────────────────────────

const toolMeta: Record<string, { icon: typeof Search; label: string; emoji: string }> = {
  search: { icon: Search, label: 'Pesquisando', emoji: '🔍' },
  vision: { icon: Image, label: 'Analisando imagem', emoji: '👁️' },
  generate_image: { icon: Sparkles, label: 'Gerando imagem', emoji: '🎨' },
  read_page: { icon: BookOpen, label: 'Lendo página', emoji: '📖' },
  system: { icon: Cpu, label: 'Verificando sistema', emoji: '💻' },
  memory_save: { icon: Database, label: 'Salvando memória', emoji: '💾' },
  memory_recall: { icon: Database, label: 'Recuperando memória', emoji: '🧠' },
  notify: { icon: Bell, label: 'Criando notificação', emoji: '🔔' },
};

// ─── Quick Actions ───────────────────────────────────────────────────

const quickActions = [
  {
    label: 'Pesquisar na web',
    icon: Search,
    prompt: 'Pesquisar na web: ',
  },
  {
    label: 'Analisar imagem',
    icon: Image,
    prompt: 'Analisar imagem: ',
  },
  {
    label: 'Notícias do dia',
    icon: Newspaper,
    prompt: 'Quais são as notícias do dia?',
  },
  {
    label: 'Gerar imagem',
    icon: Sparkles,
    prompt: 'Gerar imagem: ',
  },
  {
    label: 'Resumir texto',
    icon: FileText,
    prompt: 'Resumir o seguinte texto: ',
  },
  {
    label: 'Ajuda com código',
    icon: Code,
    prompt: 'Preciso de ajuda com código: ',
  },
];

// ─── Format Time ─────────────────────────────────────────────────────

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Markdown Components ─────────────────────────────────────────────

function MarkdownCodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  if (match) {
    return (
      <div className="relative my-3 rounded-lg overflow-hidden jarvis-holo-terminal">
        <div className="relative z-[3] flex items-center justify-between bg-[#0a0e1a] px-4 py-2 text-xs text-jarvis-cyan/70 border-b border-jarvis-cyan/10">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-jarvis-cyan/40 jarvis-pulse" />
            {match[1]}
          </span>
          <span className="text-[9px] text-jarvis-cyan/30">JARVIS TERMINAL</span>
        </div>
        <div className="relative z-[3]">
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: '0',
              fontSize: '13px',
              background: 'rgba(0, 5, 15, 0.95)',
              color: '#00d4ff',
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <code
      className="bg-jarvis-dark/80 text-jarvis-cyan px-1.5 py-0.5 rounded text-sm font-mono border border-jarvis-cyan/10"
      {...props}
    >
      {children}
    </code>
  );
}

// ─── Agent Thinking Indicator ────────────────────────────────────────

function AgentThinkingIndicator({ activeTools }: { activeTools: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 px-4 py-3"
    >
      <Avatar className="h-8 w-8 shrink-0 jarvis-glow">
        <AvatarFallback className="bg-jarvis-dark border border-jarvis-cyan/30 text-jarvis-cyan">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 bg-card/80 rounded-2xl rounded-tl-sm px-4 py-3 jarvis-glow">
        {/* Main indicator */}
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 text-jarvis-cyan animate-spin" />
          <span className="text-xs text-jarvis-cyan font-medium">
            JARVIS está usando ferramentas...
          </span>
        </div>
        {/* Active tool indicators */}
        {activeTools.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {activeTools.map((toolName) => {
              const meta = toolMeta[toolName];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={toolName}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 bg-jarvis-cyan/10 border border-jarvis-cyan/20 rounded-full px-2.5 py-1"
                >
                  <Icon className="h-3 w-3 text-jarvis-cyan animate-pulse" />
                  <span className="text-[10px] text-jarvis-cyan/80 font-medium">
                    {meta.emoji} {meta.label}...
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-1">
            <span className="jarvis-typing-dot h-2 w-2 rounded-full bg-jarvis-cyan" />
            <span className="jarvis-typing-dot h-2 w-2 rounded-full bg-jarvis-cyan" />
            <span className="jarvis-typing-dot h-2 w-2 rounded-full bg-jarvis-cyan" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator — Holographic Processing ────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 px-4 py-3"
    >
      <Avatar className="h-8 w-8 shrink-0 jarvis-glow">
        <AvatarFallback className="bg-jarvis-dark border border-jarvis-cyan/30 text-jarvis-cyan">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="jarvis-processing bg-card/80 rounded-2xl rounded-tl-sm px-4 py-3 jarvis-glow">
        <span className="text-xs text-jarvis-cyan/60 mr-2">JARVIS</span>
        <span className="text-xs text-jarvis-cyan/40 jarvis-cursor-blink">Processando</span>
        {/* Holographic processing visualization */}
        <div className="flex items-center gap-1 mt-2">
          <svg viewBox="0 0 60 12" className="w-16 h-3">
            {[0, 6, 12, 18, 24, 30, 36, 42, 48, 54].map((x, i) => (
              <motion.rect
                key={i}
                x={x}
                y={0}
                width={4}
                height={12}
                rx={1}
                fill="rgba(0, 212, 255, 0.4)"
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  height: [4, 12, 4],
                  y: [4, 0, 4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.08,
                }}
              />
            ))}
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tools Used Badge ────────────────────────────────────────────────

function ToolsUsedBadge({ toolsUsed }: { toolsUsed: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-jarvis-cyan/10">
      <Wrench className="h-3 w-3 text-jarvis-cyan/40" />
      <span className="text-[10px] text-jarvis-cyan/40 mr-1">Ferramentas:</span>
      {toolsUsed.map((toolName) => {
        const meta = toolMeta[toolName];
        return (
          <span
            key={toolName}
            className="inline-flex items-center gap-0.5 bg-jarvis-cyan/5 border border-jarvis-cyan/10 rounded-full px-1.5 py-0.5 text-[9px] text-jarvis-cyan/50"
          >
            {meta?.emoji || '🔧'} {meta?.label || toolName}
          </span>
        );
      })}
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────

function MessageBubble({
  message,
  onSpeak,
  isCurrentlySpeaking,
  autoSpeak,
}: {
  message: Message;
  onSpeak: (text: string) => void;
  isCurrentlySpeaking: boolean;
  autoSpeak: boolean;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center px-4 py-2"
      >
        <div className="rounded-full bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground border border-border/50">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 jarvis-message-holo-enter',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="h-8 w-8 shrink-0 jarvis-glow">
          <AvatarFallback className="bg-jarvis-dark border border-jarvis-cyan/30 text-jarvis-cyan">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'group relative max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-secondary border-l-2 border-jarvis-cyan rounded-tr-sm'
            : 'bg-card jarvis-glow rounded-tl-sm'
        )}
      >
        {/* Content */}
        <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-1 [&_a]:text-jarvis-cyan [&_a]:underline [&_strong]:text-foreground [&_em]:text-jarvis-cyan/80">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                code: MarkdownCodeBlock,
                p: ({ children }) => <p>{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 space-y-1">{children}</ol>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-jarvis-cyan hover:text-jarvis-cyan/80 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Tools used badge */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <ToolsUsedBadge toolsUsed={message.toolsUsed} />
        )}

        {/* Voice wave animation when speaking this message */}
        {isCurrentlySpeaking && !isUser && (
          <div className="jarvis-voice-waveform mt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="jarvis-waveform-bar"
                style={{
                  height: `${6 + Math.sin(i * 0.8) * 8 + Math.random() * 6}px`,
                  animationDelay: `${i * 0.06}s`,
                  animationDuration: `${0.4 + Math.random() * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Footer: timestamp + speak button */}
        <div
          className={cn(
            'flex items-center gap-2 mt-2',
            isUser ? 'justify-end' : 'justify-between'
          )}
        >
          {!isUser && (
            <button
              onClick={() => onSpeak(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-jarvis-cyan/10"
              title={isCurrentlySpeaking ? 'Falando...' : 'Ouvir mensagem'}
            >
              {isCurrentlySpeaking ? (
                <VolumeX className="h-3.5 w-3.5 text-jarvis-cyan animate-pulse" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground hover:text-jarvis-cyan" />
              )}
            </button>
          )}
          <span className="text-[10px] text-muted-foreground/60">
            {formatTimestamp(message.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Welcome / Empty State ───────────────────────────────────────────

function WelcomeScreen({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full px-6 py-12"
    >
      {/* JARVIS Logo Animation */}
      <div className="relative mb-8">
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(0, 212, 255, 0.1)',
              '0 0 40px rgba(0, 212, 255, 0.3)',
              '0 0 20px rgba(0, 212, 255, 0.1)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full border-2 border-jarvis-cyan/40 flex items-center justify-center bg-jarvis-dark/80 overflow-hidden"
        >
          <img src="/jarvis-icon.png" alt="JARVIS" className="w-full h-full object-cover opacity-80" />
        </motion.div>
        {/* Orbiting ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-12px] rounded-full border border-jarvis-cyan/20 border-dashed"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-24px] rounded-full border border-jarvis-cyan/10"
        />
      </div>

      {/* Greeting */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl md:text-3xl font-light jarvis-glow-text text-jarvis-cyan mb-2"
      >
        JARVIS
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-sm md:text-base mb-10 text-center"
      >
        Bom dia, senhor. Como posso ajudar?
      </motion.p>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-lg"
      >
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.08 }}
            onClick={() => onQuickAction(action.prompt)}
            className="group jarvis-panel p-4 flex flex-col items-center gap-2 hover:jarvis-glow-border transition-all duration-300 cursor-pointer hover:border-jarvis-cyan/40"
          >
            <div className="w-10 h-10 rounded-lg bg-jarvis-cyan/10 flex items-center justify-center group-hover:bg-jarvis-cyan/20 transition-colors">
              <action.icon className="h-5 w-5 text-jarvis-cyan" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Chat Component ─────────────────────────────────────────────

export function JarvisChat() {
  const messages = useJarvisStore((s) => s.messages);
  const isLoading = useJarvisStore((s) => s.isLoading);
  const autoSpeak = useJarvisStore((s) => s.autoSpeak);
  const sendMessage = useJarvisStore((s) => s.sendMessage);
  const agentThinking = useJarvisStore((s) => s.agentThinking);
  const activeTools = useJarvisStore((s) => s.activeTools);

  const { speak: speakVoice, stop: stopVoice, isSpeaking: voiceSpeaking, state: voiceState, queueLength } = useJarvisVoice();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, agentThinking]);

  // Auto-speak new assistant messages using enhanced voice pipeline
  const lastMessageRef = useRef<Message | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === 'assistant' &&
      lastMessage !== lastMessageRef.current &&
      autoSpeak
    ) {
      lastMessageRef.current = lastMessage;
      requestAnimationFrame(() => {
        setSpeakingMessageId(lastMessage.id);
      });
      // Use the enhanced speak with interruption support
      // If already speaking, queue the new message
      speakVoice(lastMessage.content, { queue: voiceSpeaking });
    } else {
      lastMessageRef.current = lastMessage;
    }
  }, [messages, autoSpeak, speakVoice, voiceSpeaking]);

  // Track when speaking stops to clear the speaking message
  useEffect(() => {
    if (!voiceSpeaking) {
      requestAnimationFrame(() => {
        setSpeakingMessageId(null);
      });
    }
  }, [voiceSpeaking]);

  // Sync speaking state with store
  useEffect(() => {
    const store = useJarvisStore.getState();
    if (voiceSpeaking && !store.isSpeaking) {
      store.startSpeaking();
    } else if (!voiceSpeaking && store.isSpeaking) {
      store.stopSpeaking();
    }
  }, [voiceSpeaking]);

  // Handle speak button for a specific message
  const handleSpeak = useCallback(
    (text: string) => {
      // Interrupt any current speech and play this message immediately
      speakVoice(text, { queue: false });
    },
    [speakVoice]
  );

  // Handle quick action
  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-full jarvis-grid-bg">
      {/* Voice speaking indicator bar */}
      <AnimatePresence>
        {voiceSpeaking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 py-1.5 bg-jarvis-cyan/5 border-b border-jarvis-cyan/10"
          >
            <div className="jarvis-voice-waveform text-jarvis-cyan">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="jarvis-waveform-bar"
                  style={{
                    height: `${4 + Math.sin(i * 0.6) * 8}px`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.3 + (i % 3) * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-medium text-jarvis-cyan/60 ml-2">
              {voiceState === 'loading' ? 'Carregando voz...' : 'Falando...'}
            </span>
            {queueLength > 0 && (
              <span className="text-[10px] text-jarvis-cyan/30 ml-1">
                (+{queueLength} na fila)
              </span>
            )}
            <button
              onClick={stopVoice}
              className="ml-2 text-[10px] text-jarvis-cyan/40 hover:text-jarvis-cyan transition-colors"
            >
              Parar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 && !isLoading ? (
        <WelcomeScreen onQuickAction={handleQuickAction} />
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto jarvis-scrollbar py-4 space-y-1"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSpeak={handleSpeak}
                isCurrentlySpeaking={voiceSpeaking && speakingMessageId === message.id}
                autoSpeak={autoSpeak}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {isLoading && agentThinking && (
              <AgentThinkingIndicator activeTools={activeTools} />
            )}
            {isLoading && !agentThinking && <TypingIndicator />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
