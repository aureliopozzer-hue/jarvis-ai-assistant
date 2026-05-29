'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  Globe,
  Loader2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useJarvisStore, type NewsItem } from '@/lib/jarvis-store';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';

// ─── Helpers ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'technology', label: 'Tech' },
  { value: 'business', label: 'Negócios' },
  { value: 'science', label: 'Ciência' },
  { value: 'sports', label: 'Esportes' },
];

const CATEGORY_COLORS: Record<string, string> = {
  technology: 'border-jarvis-cyan/20 text-jarvis-cyan/70',
  business: 'border-emerald-400/20 text-emerald-400/70',
  science: 'border-purple-400/20 text-purple-400/70',
  sports: 'border-orange-400/20 text-orange-400/70',
  general: 'border-jarvis-border/20 text-muted-foreground/50',
  health: 'border-pink-400/20 text-pink-400/70',
  entertainment: 'border-yellow-400/20 text-yellow-400/70',
  politics: 'border-red-400/20 text-red-400/70',
};

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

// ─── News Card ────────────────────────────────────────────────────────

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const categoryColor = CATEGORY_COLORS[item.category] || 'border-jarvis-border/20 text-muted-foreground/50';

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="block rounded-lg p-3 hover:bg-jarvis-cyan/5 transition-colors group border border-transparent hover:border-jarvis-border/10"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant="outline"
              className={`text-[8px] h-4 px-1.5 ${categoryColor}`}
            >
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {item.category}
            </Badge>
            <span className="text-[9px] text-muted-foreground/30 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatNewsTime(item.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-xs font-medium text-foreground/70 line-clamp-2 group-hover:text-foreground/90 transition-colors mb-1">
            {item.title}
          </h4>

          {/* Snippet */}
          {item.snippet && (
            <p className="text-[10px] text-muted-foreground/30 line-clamp-2 mb-1.5">
              {item.snippet}
            </p>
          )}

          {/* Source */}
          <div className="flex items-center gap-1.5">
            <Globe className="h-2.5 w-2.5 text-muted-foreground/25" />
            <span className="text-[9px] text-muted-foreground/40">{item.source}</span>
          </div>
        </div>

        {/* External link icon */}
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/15 shrink-0 mt-1 group-hover:text-jarvis-cyan/50 transition-colors" />
      </div>
    </motion.a>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────

function NewsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg p-3 space-y-2">
          <Skeleton className="h-3 w-16 bg-jarvis-cyan/10" />
          <Skeleton className="h-4 w-full bg-jarvis-cyan/10" />
          <Skeleton className="h-3 w-3/4 bg-jarvis-cyan/10" />
          <Skeleton className="h-2.5 w-24 bg-jarvis-cyan/10" />
        </div>
      ))}
    </div>
  );
}

// ─── Main News Panel Component ────────────────────────────────────────

export function JarvisNews() {
  const {
    newsItems,
    isLoadingNews,
    loadNews,
    searchNews,
  } = useJarvisStore();

  const { speak, isSpeaking } = useJarvisVoice();
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleCategoryChange = useCallback((value: string) => {
    setActiveCategory(value);
    setSearchQuery('');
    loadNews(value || undefined);
  }, [loadNews]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchNews(searchQuery.trim());
    } else {
      loadNews(activeCategory || undefined);
    }
  }, [searchQuery, activeCategory, searchNews, loadNews]);

  const handleRefresh = useCallback(() => {
    if (searchQuery.trim()) {
      searchNews(searchQuery.trim());
    } else {
      loadNews(activeCategory || undefined);
    }
  }, [searchQuery, activeCategory, searchNews, loadNews]);

  const handleVoiceBriefing = useCallback(() => {
    if (newsItems.length === 0) {
      speak('Nenhuma notícia disponível no momento.');
      return;
    }
    const top3 = newsItems.slice(0, 3);
    const titles = top3.map((n, i) => `${i + 1}. ${n.title}`).join('. ');
    speak(`Principais notícias: ${titles}`);
  }, [newsItems, speak]);

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Newspaper className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Notícias
          </h2>
          <p className="text-xs text-muted-foreground">
            Agregador de notícias em tempo real
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceBriefing}
            disabled={isSpeaking}
            className="h-7 w-7 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <Newspaper className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-7 w-7 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingNews ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={handleCategoryChange}
        className="mb-3"
      >
        <TabsList className="bg-jarvis-dark/50 h-7 p-0.5 gap-0.5">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.value}
              value={cat.value}
              className="text-[10px] h-6 px-2 data-[state=active]:bg-jarvis-cyan/20 data-[state=active]:text-jarvis-cyan"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar notícias..."
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          disabled={isLoadingNews}
          size="sm"
          className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 px-3"
        >
          {isLoadingNews ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Search className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* News Feed */}
      <ScrollArea className="flex-1 jarvis-scrollbar">
        {isLoadingNews && newsItems.length === 0 ? (
          <NewsSkeleton />
        ) : newsItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Newspaper className="h-12 w-12 text-jarvis-cyan/10 mb-3" />
            <p className="text-sm text-muted-foreground/30 mb-1">
              Nenhuma notícia disponível
            </p>
            <p className="text-[10px] text-muted-foreground/20">
              Tente outra categoria ou termo de busca
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 pr-1">
            {newsItems.map((item, i) => (
              <NewsCard key={item.id || i} item={item} index={i} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer count */}
      {newsItems.length > 0 && (
        <div className="mt-2 pt-2 border-t border-jarvis-border/10 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/30">
            {newsItems.length} notícias
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingNews}
            className="text-[9px] text-jarvis-cyan/40 hover:text-jarvis-cyan h-5"
          >
            <RefreshCw className={`h-2.5 w-2.5 mr-1 ${isLoadingNews ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      )}
    </div>
  );
}
