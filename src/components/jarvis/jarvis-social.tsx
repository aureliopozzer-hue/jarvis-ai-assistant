'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Instagram, Twitter, Linkedin, Facebook, Heart, MessageCircle, Repeat2, Sparkles, Plus, Loader2, Clock, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useJarvisStore, type SocialAccount, type SocialPost } from '@/lib/jarvis-store';

type PlatformFilter = 'all' | 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok';

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  tiktok: Share2,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  twitter: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
  linkedin: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  facebook: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  tiktok: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
};

function formatPostTime(dateStr: string): string {
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

function formatEngagement(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function parseMediaUrls(mediaUrls: string[] | string): string[] {
  if (Array.isArray(mediaUrls)) return mediaUrls;
  try { return JSON.parse(mediaUrls); } catch { return []; }
}

export function JarvisSocial() {
  const { socialAccounts, socialPosts, isLoadingSocial, loadSocialData, createSocialPost, sendMessage } = useJarvisStore();

  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  // Set default account when accounts load
  useEffect(() => {
    if (socialAccounts.length > 0 && !selectedAccountId) {
      const raf = requestAnimationFrame(() => {
        setSelectedAccountId(socialAccounts[0].id);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [socialAccounts, selectedAccountId]);

  const handlePost = useCallback(async () => {
    if (!newPostContent.trim() || !selectedAccountId) return;
    setPosting(true);
    await createSocialPost(selectedAccountId, newPostContent.trim());
    setNewPostContent('');
    setShowNewPost(false);
    setPosting(false);
  }, [newPostContent, selectedAccountId, createSocialPost]);

  const handleAnalyzeEngagement = useCallback(() => {
    const totalLikes = socialPosts.reduce((s, p) => s + p.likes, 0);
    const totalComments = socialPosts.reduce((s, p) => s + p.comments, 0);
    const totalShares = socialPosts.reduce((s, p) => s + p.shares, 0);
    sendMessage(`Analise o engajamento das minhas redes sociais: ${socialPosts.length} posts, ${totalLikes} curtidas, ${totalComments} comentários, ${totalShares} compartilhamentos. Qual é a tendência e sugestões de melhoria?`);
  }, [socialPosts, sendMessage]);

  const filteredPosts = socialPosts.filter((p) => {
    if (platformFilter === 'all') return true;
    const account = socialAccounts.find((a) => a.id === p.accountId);
    return account?.platform === platformFilter;
  });

  const platformFilters: { key: PlatformFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'twitter', label: 'Twitter' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'tiktok', label: 'TikTok' },
  ];

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Share2 className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">Redes Sociais</h2>
          <p className="text-xs text-muted-foreground">Monitoramento e postagem</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAnalyzeEngagement}
          className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px] hidden sm:inline">Analisar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNewPost(!showNewPost)}
          className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5"
        >
          {showNewPost ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span className="text-[10px] hidden sm:inline">{showNewPost ? 'Fechar' : 'Postar'}</span>
        </Button>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {socialAccounts.map((account, i) => {
          const PlatformIcon = PLATFORM_ICONS[account.platform] || Share2;
          const platformColor = PLATFORM_COLORS[account.platform] || 'bg-jarvis-cyan/10 text-jarvis-cyan border-jarvis-cyan/20';
          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="jarvis-panel p-2.5 flex items-center gap-2"
            >
              <div className={`p-1.5 rounded-md ${platformColor.split(' ').slice(0, 1).join(' ')}`}>
                <PlatformIcon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-foreground/80 truncate">@{account.username}</p>
                <div className="flex items-center gap-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${account.isActive ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                  <span className="text-[9px] text-muted-foreground/50">{account.isActive ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* New Post Form */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="jarvis-panel p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.15em] text-muted-foreground/60 uppercase">Conta</span>
                <div className="flex gap-1 flex-wrap">
                  {socialAccounts.map((a) => {
                    const Icon = PLATFORM_ICONS[a.platform] || Share2;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAccountId(a.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] border transition-colors ${
                          selectedAccountId === a.id
                            ? `${PLATFORM_COLORS[a.platform] || 'bg-jarvis-cyan/10 text-jarvis-cyan border-jarvis-cyan/20'}`
                            : 'border-jarvis-border/20 text-muted-foreground/50 hover:border-jarvis-cyan/20'
                        }`}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        @{a.username}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="O que você quer compartilhar?"
                rows={3}
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 resize-none"
              />
              <Button
                onClick={handlePost}
                disabled={posting || !newPostContent.trim() || !selectedAccountId}
                className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 gap-2"
                size="sm"
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                Publicar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Filter */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {platformFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPlatformFilter(key)}
            className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] transition-colors ${
              platformFilter === key
                ? 'bg-jarvis-cyan/15 text-jarvis-cyan border border-jarvis-cyan/20'
                : 'text-muted-foreground/50 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <ScrollArea className="jarvis-scrollbar flex-1">
        {isLoadingSocial ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-jarvis-cyan animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Share2 className="h-8 w-8 text-jarvis-cyan/15 mb-2" />
            <p className="text-xs text-muted-foreground/40">Nenhuma postagem encontrada</p>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {filteredPosts.map((post, i) => {
              const account = socialAccounts.find((a) => a.id === post.accountId);
              const PlatformIcon = PLATFORM_ICONS[account?.platform || ''] || Share2;
              const platformColor = PLATFORM_COLORS[account?.platform || ''] || '';
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="jarvis-panel p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1 rounded ${platformColor ? platformColor.split(' ')[0] : 'bg-jarvis-cyan/10'}`}>
                      <PlatformIcon className="h-3 w-3" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground/70">
                      @{account?.username || 'desconhecido'}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5 ml-auto">
                      <Clock className="h-2.5 w-2.5" />
                      {formatPostTime(post.postedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground/50">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatEngagement(post.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatEngagement(post.comments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="h-3 w-3" />
                      {formatEngagement(post.shares)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
