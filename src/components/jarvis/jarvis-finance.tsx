'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Bell,
  Search,
  Volume2,
  RefreshCw,
  Plus,
  Trash2,
  Megaphone,
  Loader2,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useJarvisStore, type FinanceQuote, type FinanceNewsItem, type FinanceAlert } from '@/lib/jarvis-store';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';

// ─── Helpers ───────────────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  if (currency === 'BRL' || currency === 'B$') {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatChange(change: number, changePercent: number): { text: string; color: string; isPositive: boolean } {
  const isPositive = change >= 0;
  const sign = isPositive ? '+' : '';
  const text = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';
  return { text, color, isPositive };
}

function formatMarketCap(cap: number | undefined): string {
  if (!cap) return 'N/A';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(vol: number | undefined): string {
  if (!vol) return 'N/A';
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toLocaleString();
}

function formatNewsTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHr < 24) return `${diffHr}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Index flag emojis ────────────────────────────────────────────────

const INDEX_FLAGS: Record<string, string> = {
  '^GSPC': '🇺🇸',
  '^DJI': '🇺🇸',
  '^IXIC': '🇺🇸',
  '^BVSP': '🇧🇷',
  'BTC-USD': '₿',
};

const INDEX_LABELS: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^DJI': 'Dow Jones',
  '^IXIC': 'Nasdaq',
  '^BVSP': 'Bovespa',
  'BTC-USD': 'Bitcoin',
};

// ─── Animated Waveform ────────────────────────────────────────────────

function AnimatedWaveform() {
  return (
    <div className="jarvis-voice-waveform h-6 items-center justify-center">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="jarvis-waveform-bar"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: `${12 + Math.random() * 12}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-jarvis-border/20 bg-jarvis-dark/30 p-3 space-y-2">
      <Skeleton className="h-3 w-16 bg-jarvis-cyan/10" />
      <Skeleton className="h-5 w-24 bg-jarvis-cyan/10" />
      <Skeleton className="h-3 w-20 bg-jarvis-cyan/10" />
    </div>
  );
}

// ─── Daily Briefing Section ───────────────────────────────────────────

function DailyBriefingSection() {
  const { financeBriefing, isLoadingFinance, loadFinanceBriefing } = useJarvisStore();
  const { speak, isSpeaking } = useJarvisVoice();

  const handleGenerate = useCallback(() => {
    loadFinanceBriefing();
  }, [loadFinanceBriefing]);

  const handleListen = useCallback(() => {
    if (financeBriefing?.text) {
      speak(financeBriefing.text);
    }
  }, [financeBriefing, speak]);

  const sentimentColor = financeBriefing?.sentiment === 'positive'
    ? 'text-emerald-400'
    : financeBriefing?.sentiment === 'negative'
      ? 'text-red-400'
      : 'text-jarvis-cyan';

  const sentimentLabel = financeBriefing?.sentiment === 'positive'
    ? 'ALTA'
    : financeBriefing?.sentiment === 'negative'
      ? 'BAIXA'
      : 'NEUTRO';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="jarvis-panel p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-jarvis-cyan" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60">
            PANORAMA DO MERCADO
          </span>
        </div>
        {financeBriefing && (
          <Badge
            variant="outline"
            className={`text-[9px] ${sentimentColor} border-current/20`}
          >
            {sentimentLabel}
          </Badge>
        )}
      </div>

      {/* Briefing Content */}
      {isLoadingFinance && !financeBriefing ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <AnimatedWaveform />
          <p className="text-xs text-jarvis-cyan/60 animate-pulse">
            Analisando mercado...
          </p>
        </div>
      ) : financeBriefing ? (
        <div className="space-y-3">
          <ScrollArea className="jarvis-scrollbar max-h-48 rounded-lg bg-jarvis-dark/50 p-3 border border-jarvis-border/10">
            <div className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
              {financeBriefing.text}
            </div>
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleListen}
              disabled={isSpeaking}
              className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5 h-7"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span className="text-[10px]">{isSpeaking ? 'Falando...' : 'Ouvir Briefing'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={isLoadingFinance}
              className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5 h-7"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFinance ? 'animate-spin' : ''}`} />
              <span className="text-[10px]">Atualizar</span>
            </Button>
            <span className="ml-auto text-[9px] text-muted-foreground/40 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {new Date(financeBriefing.generatedAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4">
          <BarChart3 className="h-8 w-8 text-jarvis-cyan/15" />
          <p className="text-[10px] text-muted-foreground/40 text-center">
            Gere um briefing diário com análise de mercado por IA
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isLoadingFinance}
            className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 gap-2 h-8 text-xs"
          >
            {isLoadingFinance ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Megaphone className="h-3.5 w-3.5" />
            )}
            GERAR BRIEFING
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Market Indices Bar ───────────────────────────────────────────────

function MarketIndicesBar() {
  const { financeQuotes, isLoadingFinance, loadFinanceQuotes } = useJarvisStore();

  useEffect(() => {
    loadFinanceQuotes();
  }, [loadFinanceQuotes]);

  if (isLoadingFinance && financeQuotes.length === 0) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-32 shrink-0 bg-jarvis-cyan/5 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 jarvis-scrollbar">
      {financeQuotes.map((quote, i) => {
        const { text, color, isPositive } = formatChange(quote.change, quote.changePercent);
        const flag = INDEX_FLAGS[quote.ticker] || '📊';
        const label = INDEX_LABELS[quote.ticker] || quote.name || quote.ticker;

        return (
          <motion.div
            key={quote.ticker}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="shrink-0 rounded-lg border border-jarvis-border/15 bg-jarvis-dark/40 px-3 py-2 min-w-[130px]"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">{flag}</span>
              <span className="text-[10px] font-medium text-foreground/60 truncate">
                {label}
              </span>
            </div>
            <p className="text-xs font-bold text-foreground/80 tabular-nums">
              {quote.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <div className={`flex items-center gap-1 text-[10px] ${color} tabular-nums`}>
              {isPositive ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              {text}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Watchlist Card ───────────────────────────────────────────────────

function WatchlistCard({
  item,
  onRemove,
  onClick,
}: {
  item: FinanceQuote & { id?: string; quantity?: number; avgCost?: number };
  onRemove?: (id: string) => void;
  onClick?: () => void;
}) {
  const { text, color, isPositive } = formatChange(item.change, item.changePercent);
  const borderColor = isPositive ? 'border-emerald-400/20' : item.changePercent !== 0 ? 'border-red-400/20' : 'border-jarvis-border/15';

  // Calculate P&L if quantity and avgCost are set
  const hasPnL = item.quantity && item.avgCost && item.avgCost > 0;
  const pnl = hasPnL ? (item.price - item.avgCost!) * item.quantity! : null;
  const pnlPercent = hasPnL && item.avgCost! > 0 ? ((item.price - item.avgCost!) / item.avgCost!) * 100 : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`rounded-lg border ${borderColor} bg-jarvis-dark/40 p-3 cursor-pointer transition-colors hover:bg-jarvis-dark/60 group relative`}
    >
      {/* Delete button */}
      {item.id && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id!); }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-400 text-muted-foreground/30"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs font-bold text-foreground/80">{item.ticker}</span>
        <span className="text-[9px] text-muted-foreground/40 truncate">{item.name}</span>
      </div>

      <p className="text-sm font-bold text-foreground/80 tabular-nums">
        {formatPrice(item.price, item.currency)}
      </p>

      <div className={`flex items-center gap-1 text-[10px] ${color} tabular-nums`}>
        {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
        {text}
      </div>

      {/* P&L row */}
      {hasPnL && pnl !== null && (
        <div className="mt-1.5 pt-1.5 border-t border-jarvis-border/10 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/40">
            {item.quantity} un.
          </span>
          <span className={`text-[10px] font-medium tabular-nums ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}{formatPrice(pnl, item.currency)}
            {pnlPercent !== null && ` (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Watchlist Section ────────────────────────────────────────────────

function WatchlistSection() {
  const {
    financeWatchlist,
    isLoadingFinance,
    loadFinanceWatchlist,
    removeFromWatchlist,
    selectFinanceStock,
  } = useJarvisStore();

  const [showAdd, setShowAdd] = useState(false);
  const [addTicker, setAddTicker] = useState('');
  const [addName, setAddName] = useState('');
  const { addToWatchlist } = useJarvisStore();

  useEffect(() => {
    loadFinanceWatchlist();
  }, [loadFinanceWatchlist]);

  const handleAdd = useCallback(async () => {
    if (!addTicker.trim()) return;
    await addToWatchlist(addTicker.trim().toUpperCase(), addName.trim() || addTicker.trim().toUpperCase());
    setAddTicker('');
    setAddName('');
    setShowAdd(false);
  }, [addTicker, addName, addToWatchlist]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60">
          WATCHLIST
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowAdd(!showAdd)}
          className="h-5 w-5 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          {showAdd ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mb-2">
              <Input
                value={addTicker}
                onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
                placeholder="Ticker (ex: AAPL)"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Nome (opcional)"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 hidden sm:block"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button
                onClick={handleAdd}
                disabled={!addTicker.trim()}
                size="sm"
                className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 px-3"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {isLoadingFinance && financeWatchlist.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : financeWatchlist.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <BarChart3 className="h-8 w-8 text-jarvis-cyan/10 mb-2" />
          <p className="text-[10px] text-muted-foreground/30">
            Adicione ativos à sua watchlist
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {financeWatchlist.map((item) => (
            <WatchlistCard
              key={item.id || item.ticker}
              item={item as FinanceQuote & { id?: string; quantity?: number; avgCost?: number }}
              onRemove={removeFromWatchlist}
              onClick={() => selectFinanceStock(item.ticker)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── News Section ─────────────────────────────────────────────────────

function NewsSection() {
  const { financeNews, isLoadingFinance, loadFinanceNews } = useJarvisStore();
  const [newsSearch, setNewsSearch] = useState('');

  useEffect(() => {
    loadFinanceNews();
  }, [loadFinanceNews]);

  const handleSearchNews = useCallback(() => {
    loadFinanceNews(newsSearch.trim() || undefined);
  }, [newsSearch, loadFinanceNews]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60">
          NOTÍCIAS
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => loadFinanceNews()}
          className="h-5 w-5 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          <RefreshCw className={`h-3 w-3 ${isLoadingFinance ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          value={newsSearch}
          onChange={(e) => setNewsSearch(e.target.value)}
          placeholder="Buscar notícias por ticker..."
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
          onKeyDown={(e) => e.key === 'Enter' && handleSearchNews()}
        />
        <Button
          onClick={handleSearchNews}
          size="sm"
          className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 px-3"
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>

      {/* News list */}
      <ScrollArea className="jarvis-scrollbar max-h-64">
        {isLoadingFinance && financeNews.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-jarvis-dark/30 p-2.5 space-y-1.5">
                <Skeleton className="h-3 w-full bg-jarvis-cyan/10" />
                <Skeleton className="h-3 w-3/4 bg-jarvis-cyan/10" />
              </div>
            ))}
          </div>
        ) : financeNews.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <BarChart3 className="h-6 w-6 text-jarvis-cyan/10 mb-2" />
            <p className="text-[10px] text-muted-foreground/30">Sem notícias disponíveis</p>
          </div>
        ) : (
          <div className="space-y-1">
            {financeNews.map((item: FinanceNewsItem, i: number) => (
              <motion.a
                key={item.id || i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="block rounded-lg p-2.5 hover:bg-jarvis-cyan/5 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground/70 line-clamp-2 group-hover:text-foreground/90 transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground/40">{item.source}</span>
                      <span className="text-[9px] text-muted-foreground/30">
                        {formatNewsTime(item.publishedAt)}
                      </span>
                    </div>
                    {item.snippet && (
                      <p className="text-[9px] text-muted-foreground/30 line-clamp-1 mt-0.5">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/20 shrink-0 mt-0.5 group-hover:text-jarvis-cyan/50 transition-colors" />
                </div>
                {/* Ticker badges */}
                {item.tickers && item.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.tickers.slice(0, 3).map((ticker: string) => (
                      <Badge
                        key={ticker}
                        variant="outline"
                        className="text-[8px] h-4 px-1 border-jarvis-cyan/15 text-jarvis-cyan/50"
                      >
                        {ticker}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.a>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Price Alerts Section ─────────────────────────────────────────────

function PriceAlertsSection() {
  const {
    financeAlerts,
    loadFinanceAlerts,
    createFinanceAlert,
    deleteFinanceAlert,
    toggleFinanceAlert,
  } = useJarvisStore();

  const [showForm, setShowForm] = useState(false);
  const [alertTicker, setAlertTicker] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below' | 'change_percent'>('above');
  const [alertValue, setAlertValue] = useState('');

  useEffect(() => {
    loadFinanceAlerts();
  }, [loadFinanceAlerts]);

  const handleCreate = useCallback(async () => {
    if (!alertTicker.trim() || !alertValue) return;
    await createFinanceAlert(alertTicker.trim().toUpperCase(), alertType, Number(alertValue));
    setAlertTicker('');
    setAlertValue('');
    setShowForm(false);
  }, [alertTicker, alertType, alertValue, createFinanceAlert]);

  const typeLabels: Record<string, string> = {
    above: 'acima de',
    below: 'abaixo de',
    change_percent: 'variação %',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60 flex items-center gap-1.5">
          <Bell className="h-3 w-3" />
          ALERTAS
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowForm(!showForm)}
          className="h-5 w-5 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {/* Create alert form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="jarvis-panel p-3 space-y-2">
              <Input
                value={alertTicker}
                onChange={(e) => setAlertTicker(e.target.value.toUpperCase())}
                placeholder="Ticker (ex: AAPL)"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
              />
              <div className="flex gap-2">
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as 'above' | 'below' | 'change_percent')}
                  className="bg-jarvis-dark/50 border border-jarvis-border/30 text-xs h-7 px-2 rounded-md text-foreground/80 focus:border-jarvis-cyan/40 focus:outline-none"
                >
                  <option value="above">Acima de</option>
                  <option value="below">Abaixo de</option>
                  <option value="change_percent">Variação %</option>
                </select>
                <Input
                  value={alertValue}
                  onChange={(e) => setAlertValue(e.target.value)}
                  placeholder="Valor"
                  type="number"
                  className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 flex-1"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!alertTicker.trim() || !alertValue}
                size="sm"
                className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 w-full text-xs"
              >
                <Bell className="h-3 w-3 mr-1.5" />
                Criar Alerta
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts list */}
      {financeAlerts.length === 0 ? (
        <div className="flex flex-col items-center py-4 text-center">
          <Bell className="h-6 w-6 text-jarvis-cyan/10 mb-2" />
          <p className="text-[10px] text-muted-foreground/30">Nenhum alerta configurado</p>
        </div>
      ) : (
        <div className="space-y-1">
          {financeAlerts.map((alert: FinanceAlert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
                alert.triggered
                  ? 'bg-red-400/5 border border-red-400/20'
                  : alert.active
                    ? 'bg-jarvis-dark/30 border border-jarvis-border/10'
                    : 'bg-jarvis-dark/20 border border-jarvis-border/5 opacity-50'
              }`}
            >
              {alert.triggered ? (
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              ) : (
                <Bell className={`h-3.5 w-3.5 shrink-0 ${alert.active ? 'text-jarvis-cyan/60' : 'text-muted-foreground/30'}`} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-foreground/70">{alert.ticker}</span>
                  <span className="text-[9px] text-muted-foreground/40">{typeLabels[alert.type]}</span>
                  <span className="text-[11px] font-medium text-foreground/60">
                    {alert.type === 'change_percent' ? `${alert.value}%` : formatPrice(alert.value, 'USD')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleFinanceAlert(alert.id, !alert.active)}
                className={`h-4 w-7 rounded-full transition-colors relative shrink-0 ${
                  alert.active ? 'bg-jarvis-cyan/30' : 'bg-muted/30'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
                    alert.active ? 'left-3.5 bg-jarvis-cyan' : 'left-0.5 bg-muted-foreground/50'
                  }`}
                />
              </button>
              <button
                onClick={() => deleteFinanceAlert(alert.id)}
                className="shrink-0 p-0.5 text-muted-foreground/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stock Search & Analysis Section ──────────────────────────────────

function StockSearchSection() {
  const {
    financeSearchResults,
    financeSelectedStock,
    isLoadingFinance,
    searchFinanceStocks,
    selectFinanceStock,
    clearFinanceSearch,
    addToWatchlist,
    createFinanceAlert,
  } = useJarvisStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchFinanceStocks(searchQuery.trim());
    }
  }, [searchQuery, searchFinanceStocks]);

  const handleSelectResult = useCallback((ticker: string) => {
    selectFinanceStock(ticker);
    setExpanded(true);
  }, [selectFinanceStock]);

  const handleAddToWatchlist = useCallback(() => {
    if (financeSelectedStock) {
      addToWatchlist(financeSelectedStock.ticker, financeSelectedStock.name);
    }
  }, [financeSelectedStock, addToWatchlist]);

  const handleCreateAlert = useCallback(() => {
    if (financeSelectedStock) {
      createFinanceAlert(
        financeSelectedStock.ticker,
        financeSelectedStock.changePercent >= 0 ? 'above' : 'below',
        financeSelectedStock.price
      );
    }
  }, [financeSelectedStock, createFinanceAlert]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60 flex items-center gap-1.5">
          <Search className="h-3 w-3" />
          BUSCAR ATIVO
        </span>
        {financeSelectedStock && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { clearFinanceSearch(); setExpanded(false); setSearchQuery(''); }}
            className="h-5 w-5 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar ticker ou empresa..."
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          disabled={isLoadingFinance}
          size="sm"
          className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 px-3"
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {financeSearchResults.length > 0 && !financeSelectedStock && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="rounded-lg border border-jarvis-border/20 bg-jarvis-dark/80 backdrop-blur-sm max-h-48 overflow-y-auto jarvis-scrollbar"
          >
            {financeSearchResults.map((result) => (
              <button
                key={result.ticker}
                onClick={() => handleSelectResult(result.ticker)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-jarvis-cyan/5 transition-colors"
              >
                <span className="text-xs font-bold text-foreground/70">{result.ticker}</span>
                <span className="text-[10px] text-muted-foreground/50 truncate">{result.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected stock detail */}
      <AnimatePresence>
        {financeSelectedStock && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <StockDetailCard
              stock={financeSelectedStock}
              onAddToWatchlist={handleAddToWatchlist}
              onCreateAlert={handleCreateAlert}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stock Detail Card ────────────────────────────────────────────────

function StockDetailCard({
  stock,
  onAddToWatchlist,
  onCreateAlert,
}: {
  stock: FinanceQuote;
  onAddToWatchlist: () => void;
  onCreateAlert: () => void;
}) {
  const { text, color, isPositive } = formatChange(stock.change, stock.changePercent);

  // 52-week range bar
  const week52Range = stock.week52High && stock.week52Low && stock.week52High > stock.week52Low
    ? ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100
    : null;

  return (
    <div className="jarvis-panel p-3 space-y-3">
      {/* Price header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground/80">{stock.ticker}</span>
            <span className="text-[10px] text-muted-foreground/40">{stock.name}</span>
          </div>
          <p className="text-xl font-bold text-foreground/90 tabular-nums">
            {formatPrice(stock.price, stock.currency)}
          </p>
          <div className={`flex items-center gap-1 text-xs ${color} tabular-nums`}>
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {text}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] ${color} border-current/20`}
        >
          {isPositive ? '▲' : '▼'}
        </Badge>
      </div>

      {/* Key statistics */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'P/E', value: stock.pe?.toFixed(2) },
          { label: 'EPS', value: stock.eps?.toFixed(2) },
          { label: 'Mkt Cap', value: formatMarketCap(stock.marketCap) },
          { label: 'Volume', value: formatVolume(stock.volume) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md bg-jarvis-dark/50 px-2 py-1.5">
            <p className="text-[9px] text-muted-foreground/40">{stat.label}</p>
            <p className="text-[11px] font-medium text-foreground/70 tabular-nums">
              {stat.value || 'N/A'}
            </p>
          </div>
        ))}
      </div>

      {/* 52-week range */}
      {week52Range !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/40">
            <span>52w Low: {formatPrice(stock.week52Low!, stock.currency)}</span>
            <span>52w High: {formatPrice(stock.week52High!, stock.currency)}</span>
          </div>
          <div className="jarvis-stat-bar">
            <div
              className="jarvis-stat-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(0, week52Range))}%`,
                background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.6), rgba(0, 212, 255, 0.9))',
              }}
            />
          </div>
          <div className="relative">
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-jarvis-cyan -top-0.5"
              style={{ left: `${Math.min(100, Math.max(0, week52Range))}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={onAddToWatchlist}
          size="sm"
          className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 text-[10px] gap-1 flex-1"
        >
          <Plus className="h-3 w-3" />
          Watchlist
        </Button>
        <Button
          onClick={onCreateAlert}
          size="sm"
          className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 text-[10px] gap-1 flex-1"
        >
          <Bell className="h-3 w-3" />
          Alerta
        </Button>
      </div>
    </div>
  );
}

// ─── Main Finance Panel Component ─────────────────────────────────────

export function JarvisFinance() {
  const {
    financeQuotes,
    financeNews,
    financeWatchlist,
    financeAlerts,
    financeBriefing,
    isLoadingFinance,
    loadFinanceQuotes,
    loadFinanceNews,
    loadFinanceWatchlist,
    loadFinanceAlerts,
    loadFinanceBriefing,
  } = useJarvisStore();

  // Load all data on mount
  useEffect(() => {
    loadFinanceQuotes();
    loadFinanceNews();
    loadFinanceWatchlist();
    loadFinanceAlerts();
  }, [loadFinanceQuotes, loadFinanceNews, loadFinanceWatchlist, loadFinanceAlerts]);

  // Refresh quotes every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadFinanceQuotes();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadFinanceQuotes]);

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <BarChart3 className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Mercado Financeiro
          </h2>
          <p className="text-xs text-muted-foreground">
            Painel de cotações, análises e alertas
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { loadFinanceQuotes(); loadFinanceNews(); }}
          className="h-8 w-8 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingFinance ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 jarvis-scrollbar">
        <div className="space-y-4 pr-2">
          {/* Section 1: Daily Briefing */}
          <DailyBriefingSection />

          {/* Section 2: Market Indices Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-2">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60">
                ÍNDICES
              </span>
            </div>
            <MarketIndicesBar />
          </motion.div>

          {/* Section 3-6: Main grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Watchlist + Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <WatchlistSection />
              <PriceAlertsSection />
            </motion.div>

            {/* Right column: News + Search */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <NewsSection />
              <StockSearchSection />
            </motion.div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
