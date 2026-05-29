'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Eye,
  Search,
  LayoutDashboard,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Mail,
  Share2,
  Target,
  Calendar,
  FolderOpen,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useJarvisStore, type JarvisPanel } from '@/lib/jarvis-store';

const navItems: { panel: JarvisPanel; label: string; icon: React.ElementType }[] = [
  { panel: 'chat', label: 'Chat', icon: MessageSquare },
  { panel: 'vision', label: 'Visão', icon: Eye },
  { panel: 'search', label: 'Busca', icon: Search },
  { panel: 'finance', label: 'Finanças', icon: BarChart3 },
  { panel: 'email', label: 'Email', icon: Mail },
  { panel: 'social', label: 'Social', icon: Share2 },
  { panel: 'campaigns', label: 'Campanhas', icon: Target },
  { panel: 'calendar', label: 'Calendário', icon: Calendar },
  { panel: 'files', label: 'Arquivos', icon: FolderOpen },
  { panel: 'stripe', label: 'Pagamentos', icon: CreditCard },
  { panel: 'dashboard', label: 'Painel', icon: LayoutDashboard },
];

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function JarvisSidebar() {
  const {
    sidebarOpen,
    toggleSidebar,
    activePanel,
    setActivePanel,
    conversations,
    currentConversationId,
    loadConversation,
    loadConversations,
    createConversation,
    deleteConversation,
  } = useJarvisStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={`jarvis-panel jarvis-hud-corner flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 md:w-72' : 'w-0 md:w-14'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-3 pb-2">
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="shrink-0 text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60"
            >
              NAVIGATION
            </motion.span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 shrink-0 text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <ScrollArea className={`${sidebarOpen ? 'px-2' : 'px-1.5'} ${sidebarOpen ? 'max-h-64' : ''}`}>
          <div className="space-y-0.5">
          {navItems.map(({ panel, label, icon: Icon }) => {
            const isActive = activePanel === panel;

            if (!sidebarOpen) {
              return (
                <Tooltip key={panel}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => setActivePanel(panel)}
                      className={`h-10 w-full justify-center rounded-lg ${
                        isActive
                          ? 'bg-jarvis-cyan/15 text-jarvis-cyan jarvis-glow-border'
                          : 'text-jarvis-cyan/50 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan/80'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <motion.button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                  isActive
                    ? 'bg-jarvis-cyan/15 text-jarvis-cyan jarvis-glow-border'
                    : 'text-jarvis-cyan/50 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan/80'
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{label}</span>
                {isActive && (
                  <motion.div
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-jarvis-cyan"
                    layoutId="activeIndicator"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        </ScrollArea>

        {/* Conversations Section */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex min-h-0 flex-1 flex-col"
            >
              <Separator className="bg-jarvis-border" />

              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60">
                  CONVERSATIONS
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => createConversation()}
                      className="h-6 w-6 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New Conversation</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <ScrollArea className="jarvis-scrollbar flex-1 px-2">
                <div className="space-y-0.5 pb-2">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <MessageCircle className="mb-2 h-8 w-8 text-jarvis-cyan/20" />
                      <p className="text-xs text-jarvis-cyan/30">No conversations yet</p>
                      <p className="text-[10px] text-jarvis-cyan/20">
                        Start a new chat to begin
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isCurrent = currentConversationId === conv.id;
                      return (
                        <motion.div
                          key={conv.id}
                          className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all ${
                            isCurrent
                              ? 'bg-jarvis-cyan/10 text-jarvis-cyan'
                              : 'text-jarvis-cyan/50 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan/80'
                          }`}
                          whileHover={{ x: 2 }}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <button
                            onClick={() => loadConversation(conv.id)}
                            className="flex min-w-0 flex-1 flex-col text-left"
                          >
                            <span className="truncate text-xs font-medium">
                              {conv.title || 'New Chat'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-jarvis-cyan/30">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTimeAgo(conv.updatedAt)}
                            </span>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-jarvis-cyan/30 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom - Collapsed Icons */}
        {!sidebarOpen && (
          <div className="mt-auto px-1.5 py-2">
            <Separator className="mb-2 bg-jarvis-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => createConversation()}
                  className="h-10 w-full justify-center text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
