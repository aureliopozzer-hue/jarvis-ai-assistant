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
} from 'lucide-react';
import { useJarvisStore, type Message } from '@/lib/jarvis-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ─── TTS Helper ──────────────────────────────────────────────────────

const speak = (text: string, voiceRate: number, voicePitch: number) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = voiceRate;
  utterance.pitch = voicePitch;
  // Try to find a Portuguese voice
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find((v) => v.lang.startsWith('pt'));
  if (ptVoice) utterance.voice = ptVoice;

  const store = useJarvisStore.getState();
  store.startSpeaking();
  utterance.onend = () => store.stopSpeaking();
  utterance.onerror = () => store.stopSpeaking();
  window.speechSynthesis.speak(utterance);
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
      <div className="relative my-3 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between bg-[#1a1a2e] px-4 py-2 text-xs text-jarvis-cyan/70">
          <span>{match[1]}</span>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0 0 8px 8px',
            fontSize: '13px',
            background: '#0d1117',
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code
      className="bg-secondary/80 text-jarvis-cyan px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────

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
      <div className="flex items-center gap-2 bg-card/80 rounded-2xl rounded-tl-sm px-4 py-3 jarvis-glow">
        <span className="text-xs text-jarvis-cyan/60 mr-1">JARVIS</span>
        <div className="flex gap-1">
          <span className="jarvis-typing-dot h-2 w-2 rounded-full bg-jarvis-cyan" />
          <span className="jarvis-typing-dot h-2 w-2 rounded-full bg-jarvis-cyan" />
          <span className="jarvis-typing-dot h-2 w-2 rounded-full bg-jarvis-cyan" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────

function MessageBubble({
  message,
  onSpeak,
  isSpeaking,
  autoSpeak,
}: {
  message: Message;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 jarvis-message-enter',
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
              title={isSpeaking ? 'Falando...' : 'Ouvir mensagem'}
            >
              {isSpeaking ? (
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
  const isSpeaking = useJarvisStore((s) => s.isSpeaking);
  const autoSpeak = useJarvisStore((s) => s.autoSpeak);
  const voiceRate = useJarvisStore((s) => s.voiceRate);
  const voicePitch = useJarvisStore((s) => s.voicePitch);
  const sendMessage = useJarvisStore((s) => s.sendMessage);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Load voices for TTS
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      setVoicesLoaded(true);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-speak new assistant messages
  const lastMessageRef = useRef<Message | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === 'assistant' &&
      lastMessage !== lastMessageRef.current &&
      autoSpeak &&
      voicesLoaded
    ) {
      lastMessageRef.current = lastMessage;
      speak(lastMessage.content, voiceRate, voicePitch);
    } else {
      lastMessageRef.current = lastMessage;
    }
  }, [messages, autoSpeak, voiceRate, voicePitch, voicesLoaded]);

  // Handle speak button
  const handleSpeak = useCallback(
    (text: string) => {
      speak(text, voiceRate, voicePitch);
    },
    [voiceRate, voicePitch]
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
                isSpeaking={isSpeaking}
                autoSpeak={autoSpeak}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
