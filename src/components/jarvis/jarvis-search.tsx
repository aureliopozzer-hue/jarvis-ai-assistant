'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, ExternalLink, Clock, BookOpen, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJarvisStore } from '@/lib/jarvis-store';
import type { SearchResult } from '@/lib/jarvis-store';

function truncateUrl(url: string, maxLength: number = 50): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname;
    return display.length > maxLength
      ? display.substring(0, maxLength) + '...'
      : display;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function SearchResultCard({
  result,
  onReadPage,
}: {
  result: SearchResult;
  onReadPage: (url: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="jarvis-panel p-4 jarvis-hud-corner group hover:jarvis-glow-border transition-all duration-300"
    >
      <div className="space-y-2">
        {/* Title & Domain */}
        <div className="flex items-start justify-between gap-2">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-jarvis-cyan hover:text-jarvis-cyan/80 hover:underline line-clamp-2 transition-colors"
          >
            {result.name}
          </a>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* URL */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">{truncateUrl(result.url)}</span>
        </div>

        {/* Snippet */}
        {result.snippet && (
          <p className="text-xs text-foreground/70 line-clamp-3 leading-relaxed">
            {result.snippet}
          </p>
        )}

        {/* Footer: Domain badge, Date, Read button */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {result.host_name && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-jarvis-cyan/30 text-jarvis-cyan/80 bg-jarvis-cyan/5 jarvis-glow-border"
              >
                {result.host_name}
              </Badge>
            )}
            {result.date && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                <span>{formatDate(result.date)}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] gap-1 text-jarvis-cyan/70 hover:text-jarvis-cyan hover:bg-jarvis-cyan/10"
            onClick={() => onReadPage(result.url)}
          >
            <BookOpen className="h-3 w-3" />
            Ler pagina
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function JarvisSearch() {
  const { searchResults, searchQuery, isSearching, searchWeb, clearSearch } =
    useJarvisStore();

  const [inputValue, setInputValue] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSearch = useCallback(() => {
    const query = inputValue.trim();
    if (!query) return;
    searchWeb(query);
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      return [query, ...filtered].slice(0, 10);
    });
  }, [inputValue, searchWeb]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleRecentClick = useCallback(
    (query: string) => {
      setInputValue(query);
      searchWeb(query);
    },
    [searchWeb]
  );

  const handleReadPage = useCallback((url: string) => {
    // For now, open the URL in a new tab
    // This could be extended to use the read API
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleClearRecent = useCallback(
    (index: number) => {
      setRecentSearches((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Search className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Busca
          </h2>
          <p className="text-xs text-muted-foreground">
            Pesquise na web com JARVIS
          </p>
        </div>
        {searchResults.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar na web..."
            className="pl-9 bg-jarvis-dark/50 border-jarvis-border focus:border-jarvis-cyan focus:ring-jarvis-cyan/20 text-foreground placeholder:text-muted-foreground"
            disabled={isSearching}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !inputValue.trim()}
          className="bg-jarvis-cyan/20 hover:bg-jarvis-cyan/30 text-jarvis-cyan border border-jarvis-cyan/30 disabled:opacity-50"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 jarvis-scrollbar">
        <div className="space-y-4 pr-2">
          {/* Loading State */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-jarvis-cyan/20 jarvis-arc-spinner" />
                  <div
                    className="absolute inset-1.5 rounded-full border-2 border-t-jarvis-cyan border-r-transparent border-b-jarvis-cyan/50 border-l-transparent jarvis-arc-spinner"
                    style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                  />
                  <Search className="absolute inset-0 m-auto h-4 w-4 text-jarvis-cyan" />
                </div>
                <p className="text-sm text-jarvis-cyan jarvis-glow-text">
                  Buscando...
                </p>
                <p className="text-xs text-muted-foreground">
                  &ldquo;{searchQuery}&rdquo;
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Searches */}
          {!isSearching && searchResults.length === 0 && recentSearches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Buscas recentes
              </h3>
              <div className="space-y-1">
                {recentSearches.map((query, index) => (
                  <motion.div
                    key={`${query}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() => handleRecentClick(query)}
                      className="flex-1 text-left text-sm text-foreground/70 hover:text-jarvis-cyan py-1.5 px-3 rounded-lg hover:bg-jarvis-cyan/5 transition-colors truncate"
                    >
                      {query}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleClearRecent(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Resultados para &ldquo;{searchQuery}&rdquo;
              </h3>
              <AnimatePresence>
                {searchResults.map((result, index) => (
                  <SearchResultCard
                    key={`${result.url}-${index}`}
                    result={result}
                    onReadPage={handleReadPage}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!isSearching && searchResults.length === 0 && recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-jarvis-cyan/5 mb-4">
                <Globe className="h-8 w-8 text-jarvis-cyan/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                Digite sua busca para encontrar informacoes na web
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Resultados inteligentes com JARVIS
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
