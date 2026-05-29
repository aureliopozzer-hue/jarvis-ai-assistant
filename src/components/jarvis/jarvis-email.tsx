'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Star, StarOff, Inbox, PenSquare, Sparkles, ChevronRight, Clock, User, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useJarvisStore } from '@/lib/jarvis-store';

type EmailTab = 'inbox' | 'sent' | 'compose';

function formatEmailTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function JarvisEmail() {
  const { emails, isLoadingEmails, loadEmails, sendEmail, markEmailRead, starEmail, sendMessage } = useJarvisStore();

  const [activeTab, setActiveTab] = useState<EmailTab>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);

  // Load emails on mount
  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const unreadCount = emails.filter((e) => !e.isRead).length;

  // Parse labels from JSON string
  const parseLabels = (labels: string[] | string): string[] => {
    if (Array.isArray(labels)) return labels;
    try { return JSON.parse(labels as string); } catch { return []; }
  };

  const isInbox = (email: typeof emails[0]) => {
    const labels = parseLabels(email.labels);
    return !labels.includes('sent');
  };

  const isSent = (email: typeof emails[0]) => {
    const labels = parseLabels(email.labels);
    return labels.includes('sent');
  };

  const filteredEmails = activeTab === 'inbox'
    ? emails.filter(isInbox)
    : activeTab === 'sent'
      ? emails.filter(isSent)
      : [];

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  const handleSelectEmail = useCallback(async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (email && !email.isRead) {
      markEmailRead(id, true);
    }
    setSelectedEmailId(id);
  }, [emails, markEmailRead]);

  const handleStar = useCallback(async (id: string, starred: boolean) => {
    await starEmail(id, starred);
  }, [starEmail]);

  const handleSend = useCallback(async () => {
    if (!composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()) return;
    setSending(true);
    await sendEmail(composeData.to, composeData.subject, composeData.body);
    setComposeData({ to: '', subject: '', body: '' });
    setActiveTab('sent');
    setSending(false);
  }, [composeData, sendEmail]);

  const handleSummarize = useCallback(() => {
    const unreadEmails = emails.filter((e) => !e.isRead);
    if (unreadEmails.length === 0) {
      sendMessage('Resuma meus emails. Não há emails não lidos no momento.');
    } else {
      const emailList = unreadEmails.slice(0, 5).map((e) => `De: ${e.from}, Assunto: ${e.subject}`).join('\n');
      sendMessage(`Resuma os seguintes emails não lidos:\n${emailList}`);
    }
  }, [emails, sendMessage]);

  const tabs: { key: EmailTab; label: string; icon: React.ElementType }[] = [
    { key: 'inbox', label: 'Caixa de Entrada', icon: Inbox },
    { key: 'sent', label: 'Enviados', icon: Send },
    { key: 'compose', label: 'Compor', icon: PenSquare },
  ];

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Mail className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">Email</h2>
          <p className="text-xs text-muted-foreground">Gerenciamento de correio eletrônico</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-[9px] h-5 px-1.5">
            {unreadCount} não lido{unreadCount > 1 ? 's' : ''}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSummarize}
          className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px]">Resumir</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedEmailId(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === key
                ? 'bg-jarvis-cyan/15 text-jarvis-cyan border border-jarvis-cyan/20'
                : 'text-muted-foreground/60 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan/80'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isLoadingEmails ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 text-jarvis-cyan animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando emails...</span>
          </div>
        ) : activeTab === 'compose' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div>
              <label className="text-[10px] tracking-[0.15em] text-muted-foreground/60 uppercase mb-1 block">Para</label>
              <Input
                value={composeData.to}
                onChange={(e) => setComposeData((p) => ({ ...p, to: e.target.value }))}
                placeholder="email@exemplo.com"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] text-muted-foreground/60 uppercase mb-1 block">Assunto</label>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Assunto do email"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] text-muted-foreground/60 uppercase mb-1 block">Mensagem</label>
              <Textarea
                value={composeData.body}
                onChange={(e) => setComposeData((p) => ({ ...p, body: e.target.value }))}
                placeholder="Escreva sua mensagem..."
                rows={6}
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 resize-none"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()}
              className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 gap-2"
              size="sm"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Enviar
            </Button>
          </motion.div>
        ) : (
          <div className="flex h-full gap-0">
            {/* Email list */}
            <div className={`${selectedEmailId ? 'hidden md:flex md:w-2/5' : 'w-full'} flex-col border-r border-jarvis-border/30`}>
              <ScrollArea className="jarvis-scrollbar flex-1">
                {filteredEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Mail className="h-8 w-8 text-jarvis-cyan/15 mb-2" />
                    <p className="text-xs text-muted-foreground/40">
                      {activeTab === 'inbox' ? 'Nenhum email na caixa de entrada' : 'Nenhum email enviado'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5 p-1">
                    {filteredEmails.map((email, i) => (
                      <motion.button
                        key={email.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSelectEmail(email.id)}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors group ${
                          selectedEmailId === email.id
                            ? 'bg-jarvis-cyan/10 border border-jarvis-cyan/20'
                            : email.isRead
                              ? 'hover:bg-jarvis-dark/50'
                              : 'bg-jarvis-cyan/5 hover:bg-jarvis-cyan/10 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {!email.isRead && (
                                <div className="h-1.5 w-1.5 rounded-full bg-jarvis-cyan shrink-0" />
                              )}
                              <p className={`text-xs truncate ${!email.isRead ? 'font-semibold text-foreground/90' : 'text-foreground/60'}`}>
                                {email.from}
                              </p>
                            </div>
                            <p className={`text-[11px] truncate ${!email.isRead ? 'text-foreground/80' : 'text-foreground/50'}`}>
                              {email.subject}
                            </p>
                            <p className="text-[10px] text-muted-foreground/40 truncate">
                              {email.snippet}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {formatEmailTime(email.receivedAt)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStar(email.id, !email.isStarred); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {email.isStarred ? (
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              ) : (
                                <StarOff className="h-3 w-3 text-muted-foreground/30" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Email detail */}
            <div className={`${selectedEmailId ? 'flex-1' : 'hidden md:flex md:flex-1'} flex-col`}>
              {selectedEmail ? (
                <motion.div
                  key={selectedEmail.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 h-full flex flex-col"
                >
                  {/* Back button (mobile) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmailId(null)}
                    className="md:hidden mb-2 text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 w-fit"
                  >
                    <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                    <span className="text-[10px]">Voltar</span>
                  </Button>

                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-foreground/90 mb-1">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        De: {selectedEmail.from}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(selectedEmail.receivedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/40 mt-0.5">
                      Para: {selectedEmail.to}
                    </div>
                  </div>

                  <ScrollArea className="jarvis-scrollbar flex-1">
                    <div className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                      {selectedEmail.body}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2 mt-3 pt-2 border-t border-jarvis-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStar(selectedEmail.id, !selectedEmail.isStarred)}
                      className="text-yellow-400/60 hover:bg-yellow-400/10 hover:text-yellow-400 gap-1"
                    >
                      {selectedEmail.isStarred ? <Star className="h-3.5 w-3.5 fill-yellow-400" /> : <StarOff className="h-3.5 w-3.5" />}
                      <span className="text-[10px]">{selectedEmail.isStarred ? 'Desfavoritar' : 'Favoritar'}</span>
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Mail className="h-8 w-8 text-jarvis-cyan/10 mb-2" />
                  <p className="text-[10px] text-muted-foreground/30">Selecione um email para ler</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
