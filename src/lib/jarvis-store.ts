import { create } from 'zustand';
import type { WakeWordState } from '@/hooks/use-wake-word';
import type { SystemStats } from '@/hooks/use-system-monitor';

// ─── Type Definitions ───────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  toolsUsed?: string[];
}

export interface SearchResult {
  name: string;
  url: string;
  snippet: string;
  host_name: string;
  date: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type JarvisPanel = 'chat' | 'vision' | 'search' | 'dashboard' | 'email' | 'social' | 'campaigns' | 'calendar' | 'files' | 'stripe' | 'finance';
export type JarvisPersonality = 'professional' | 'friendly' | 'witty';
export type JarvisLanguage = 'pt-BR' | 'en-US';

export interface Memory {
  id: string;
  category: string;
  key: string;
  value: string;
  source: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAccount {
  id: string;
  provider: string;
  email: string;
  isActive: boolean;
  lastSync: string | null;
}

export interface Email {
  id: string;
  accountId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  receivedAt: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  isActive: boolean;
  lastSync: string | null;
}

export interface SocialPost {
  id: string;
  accountId: string;
  content: string;
  mediaUrls: string[];
  likes: number;
  comments: number;
  shares: number;
  postedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  metrics: Record<string, number>;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  recurrence: string | null;
  reminder: number | null;
  source: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  tags: string[];
  createdAt: string;
}

export interface StripeConfig {
  id: string;
  publicKey: string;
  secretKey: string;
  mode: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  customerId: string;
  email: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface FinanceQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketCap?: number;
  volume?: number;
  pe?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
  quantity?: number;
  avgCost?: number;
}

export interface FinanceNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  snippet: string;
  tickers: string[];
  publishedAt: string;
}

export interface FinanceWatchlistItem {
  id: string;
  ticker: string;
  name: string;
  type: string;
  quantity: number | null;
  avgPrice: number | null;
  notes: string | null;
}

export interface FinanceAlert {
  id: string;
  ticker: string;
  type: string;
  value: number;
  isActive: boolean;
  triggered: boolean;
  createdAt: string;
}

export interface FinanceBriefing {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  generatedAt: string;
}

export interface JarvisSettings {
  voiceRate: number;
  voicePitch: number;
  jarvisPersonality: JarvisPersonality;
  autoSpeak: boolean;
  language: JarvisLanguage;
}

export interface JarvisState {
  // Chat
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isLoading: boolean;

  // Voice
  isListening: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;

  // Vision
  visionImage: string | null;
  visionAnalysis: string | null;
  isAnalyzing: boolean;

  // Search
  searchResults: SearchResult[];
  searchQuery: string;
  isSearching: boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Wake Word
  wakeWordActive: boolean;
  wakeWordState: WakeWordState;

  // System Stats
  systemStats: SystemStats | null;

  // Memories
  memories: Memory[];

  // Proactive
  proactivePolling: boolean;

  // Voice Pipeline
  audioQueue: string[];
  isProcessingAudio: boolean;

  // Sound Effects
  soundEnabled: boolean;

  // Ambient Mode
  ambientMode: boolean;

  // Agent
  activeTools: string[];
  agentThinking: boolean;

  // Email
  emailAccounts: EmailAccount[];
  emails: Email[];
  isLoadingEmails: boolean;

  // Social
  socialAccounts: SocialAccount[];
  socialPosts: SocialPost[];
  isLoadingSocial: boolean;

  // Campaigns
  campaigns: Campaign[];
  isLoadingCampaigns: boolean;

  // Calendar
  calendarEvents: CalendarEvent[];
  isLoadingCalendar: boolean;

  // Files
  files: FileItem[];
  isLoadingFiles: boolean;

  // Stripe
  stripeConfig: StripeConfig | null;
  subscription: Subscription | null;
  subscriptions: Subscription[];
  isLoadingStripe: boolean;

  // Finance
  financeQuotes: FinanceQuote[];
  financeNews: FinanceNewsItem[];
  financeWatchlist: FinanceWatchlistItem[];
  financeAlerts: FinanceAlert[];
  financeBriefing: FinanceBriefing | null;
  isLoadingFinance: boolean;
  financeSearchResults: FinanceQuote[];
  financeSelectedStock: FinanceQuote | null;

  // UI
  activePanel: JarvisPanel;
  sidebarOpen: boolean;
  isOnline: boolean;
  loadedPanels: Set<string>;

  // Settings
  voiceRate: number;
  voicePitch: number;
  jarvisPersonality: JarvisPersonality;
  autoSpeak: boolean;
  language: JarvisLanguage;
}

export interface JarvisActions {
  // Chat Actions
  sendMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;

  // Voice Actions
  startListening: () => void;
  stopListening: () => void;
  startSpeaking: () => void;
  stopSpeaking: () => void;
  toggleVoice: () => void;
  toggleAutoSpeak: () => void;

  // Vision Actions
  setVisionImage: (base64: string) => void;
  analyzeImage: (question: string) => Promise<void>;
  clearVision: () => void;

  // Search Actions
  searchWeb: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Notification Actions
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearNotifications: () => void;

  // Wake Word Actions
  setWakeWordActive: (active: boolean) => void;
  setWakeWordState: (state: WakeWordState) => void;

  // System Stats Actions
  setSystemStats: (stats: SystemStats | null) => void;

  // Memory Actions
  loadMemories: () => Promise<void>;
  addMemory: (memory: { category: string; key: string; value: string; source?: string; important?: boolean }) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;

  // Proactive Actions
  setProactivePolling: (polling: boolean) => void;

  // Voice Pipeline Actions
  queueAudio: (text: string) => void;
  clearAudioQueue: () => void;
  setProcessingAudio: (processing: boolean) => void;

  // Sound Actions
  toggleSound: () => void;

  // Ambient Mode Actions
  toggleAmbientMode: () => void;

  // Agent Actions
  setActiveTools: (tools: string[]) => void;
  setAgentThinking: (thinking: boolean) => void;

  // Email Actions
  loadEmails: (filters?: { isRead?: boolean; isStarred?: boolean; limit?: number }) => Promise<void>;
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  markEmailRead: (id: string, read: boolean) => Promise<void>;
  starEmail: (id: string, starred: boolean) => Promise<void>;

  // Social Actions
  loadSocialData: (platform?: string) => Promise<void>;
  createSocialPost: (accountId: string, content: string) => Promise<void>;

  // Campaign Actions
  loadCampaigns: (status?: string) => Promise<void>;
  createCampaign: (name: string, type: string, budget?: number) => Promise<void>;
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  // Calendar Actions
  loadCalendarEvents: (start?: string, end?: string) => Promise<void>;
  createCalendarEvent: (event: { title: string; description?: string; location?: string; startTime: string; endTime: string; reminder?: number }) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  // File Actions
  loadFiles: (type?: string) => Promise<void>;
  uploadFile: (file: { name: string; type: string; size: number; path: string; content?: string; tags?: string[] }) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;

  // Stripe Actions
  loadStripeConfig: () => Promise<void>;
  configureStripe: (publicKey: string, secretKey: string, mode: string) => Promise<void>;

  // Finance Actions
  loadFinanceQuotes: (tickers?: string[]) => Promise<void>;
  loadFinanceNews: (ticker?: string) => Promise<void>;
  loadFinanceWatchlist: () => Promise<void>;
  addToWatchlist: (ticker: string, name: string, quantity?: number, avgCost?: number) => Promise<void>;
  removeFromWatchlist: (id: string) => Promise<void>;
  loadFinanceAlerts: () => Promise<void>;
  createFinanceAlert: (ticker: string, type: 'above' | 'below' | 'change_percent', value: number) => Promise<void>;
  deleteFinanceAlert: (id: string) => Promise<void>;
  toggleFinanceAlert: (id: string, active: boolean) => Promise<void>;
  loadFinanceBriefing: () => Promise<void>;
  searchFinanceStocks: (query: string) => Promise<void>;
  selectFinanceStock: (ticker: string) => Promise<void>;
  clearFinanceSearch: () => void;

  // UI Actions
  setActivePanel: (panel: JarvisPanel) => void;
  toggleSidebar: () => void;
  setOnlineStatus: (status: boolean) => void;

  // Settings Actions
  updateSettings: (settings: Partial<JarvisSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
}

// ─── Helper: Generate a unique ID ───────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Helper: API fetch wrapper with error handling ──────────────────

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText} for ${url}`);
      return null;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`API fetch error for ${url}:`, error);
    return null;
  }
}

// ─── Store ──────────────────────────────────────────────────────────

export const useJarvisStore = create<JarvisState & JarvisActions>((set, get) => ({
  // ── Initial State ───────────────────────────────────────────────

  // Chat
  conversations: [],
  currentConversationId: null,
  messages: [],
  isLoading: false,

  // Voice
  isListening: false,
  isSpeaking: false,
  voiceEnabled: true,

  // Vision
  visionImage: null,
  visionAnalysis: null,
  isAnalyzing: false,

  // Search
  searchResults: [],
  searchQuery: '',
  isSearching: false,

  // Notifications
  notifications: [],
  unreadCount: 0,

  // Wake Word
  wakeWordActive: false,
  wakeWordState: 'idle',

  // System Stats
  systemStats: null,

  // Memories
  memories: [],

  // Proactive
  proactivePolling: false,

  // Voice Pipeline
  audioQueue: [],
  isProcessingAudio: false,

  // Sound Effects
  soundEnabled: true,

  // Ambient Mode
  ambientMode: false,

  // Agent
  activeTools: [],
  agentThinking: false,

  // Email
  emailAccounts: [],
  emails: [],
  isLoadingEmails: false,

  // Social
  socialAccounts: [],
  socialPosts: [],
  isLoadingSocial: false,

  // Campaigns
  campaigns: [],
  isLoadingCampaigns: false,

  // Calendar
  calendarEvents: [],
  isLoadingCalendar: false,

  // Files
  files: [],
  isLoadingFiles: false,

  // Stripe
  stripeConfig: null,
  subscription: null,
  subscriptions: [],
  isLoadingStripe: false,

  // Finance
  financeQuotes: [],
  financeNews: [],
  financeWatchlist: [],
  financeAlerts: [],
  financeBriefing: null,
  isLoadingFinance: false,
  financeSearchResults: [],
  financeSelectedStock: null,

  // UI
  activePanel: 'chat',
  sidebarOpen: true,
  isOnline: true,
  loadedPanels: new Set<string>(),

  // Settings
  voiceRate: 1.0,
  voicePitch: 1.0,
  jarvisPersonality: 'professional',
  autoSpeak: false,
  language: 'en-US',

  // ── Chat Actions ────────────────────────────────────────────────

  sendMessage: async (content: string) => {
    const state = get();
    if (state.isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...state.messages, userMessage],
      isLoading: true,
      agentThinking: true,
    });

    try {
      const result = await apiFetch<{
        response: string;
        conversationId: string;
        messageId: string;
        toolsUsed?: string[];
      }>(
        '/api/jarvis/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: content,
            conversationId: state.currentConversationId,
          }),
        }
      );

      if (result?.response) {
        const assistantMessage: Message = {
          id: result.messageId || generateId(),
          role: 'assistant',
          content: result.response,
          createdAt: new Date().toISOString(),
          toolsUsed: result.toolsUsed,
        };
        set((s) => ({
          messages: [...s.messages, assistantMessage],
          currentConversationId: result.conversationId ?? s.currentConversationId,
        }));

        // Update conversations list
        get().loadConversations();
      } else {
        // Add error message if API fails
        const errorMessage: Message = {
          id: generateId(),
          role: 'system',
          content: 'Desculpe, senhor. Encontrei um erro ao processar sua solicitação. Por favor, tente novamente.',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, errorMessage],
        }));
      }
    } catch {
      const errorMessage: Message = {
        id: generateId(),
        role: 'system',
        content: 'Erro de conexão. Por favor, verifique sua rede e tente novamente.',
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, errorMessage],
      }));
    } finally {
      set({ isLoading: false, agentThinking: false, activeTools: [] });
    }
  },

  loadConversations: async () => {
    const result = await apiFetch<{ conversations: Conversation[] }>(
      '/api/jarvis/conversations'
    );
    if (result?.conversations) {
      set({ conversations: result.conversations });
    }
  },

  loadConversation: async (id: string) => {
    set({ isLoading: true, messages: [] });
    const result = await apiFetch<{ conversation: Conversation; messages: Message[] }>(
      `/api/jarvis/conversations/${id}`
    );
    if (result) {
      set({
        currentConversationId: id,
        messages: result.messages ?? [],
        conversations: get().conversations.map((c) =>
          c.id === id ? { ...c, ...result.conversation } : c
        ),
      });
    }
    set({ isLoading: false });
  },

  createConversation: async () => {
    const result = await apiFetch<{ conversation: Conversation }>(
      '/api/jarvis/conversations',
      { method: 'POST' }
    );
    if (result?.conversation) {
      set((s) => ({
        conversations: [result.conversation, ...s.conversations],
        currentConversationId: result.conversation.id,
        messages: [],
      }));
      return result.conversation.id;
    }
    return null;
  },

  deleteConversation: async (id: string) => {
    const result = await apiFetch<null>(
      `/api/jarvis/conversations/${id}`,
      { method: 'DELETE' }
    );

    // Optimistically remove regardless of API result
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const isCurrent = s.currentConversationId === id;
      return {
        conversations,
        currentConversationId: isCurrent ? null : s.currentConversationId,
        messages: isCurrent ? [] : s.messages,
      };
    });

    void result; // suppress unused warning
  },

  setCurrentConversation: (id: string | null) => {
    set({ currentConversationId: id });
  },

  // ── Voice Actions ───────────────────────────────────────────────

  startListening: () => {
    set({ isListening: true });
  },

  stopListening: () => {
    set({ isListening: false });
  },

  startSpeaking: () => {
    set({ isSpeaking: true });
  },

  stopSpeaking: () => {
    set({ isSpeaking: false });
  },

  toggleVoice: () => {
    set((s) => ({ voiceEnabled: !s.voiceEnabled }));
  },

  toggleAutoSpeak: () => {
    set((s) => ({ autoSpeak: !s.autoSpeak }));
  },

  // ── Vision Actions ──────────────────────────────────────────────

  setVisionImage: (base64: string) => {
    set({ visionImage: base64, visionAnalysis: null });
  },

  analyzeImage: async (question: string) => {
    const { visionImage } = get();
    if (!visionImage) return;

    set({ isAnalyzing: true, visionAnalysis: null });

    try {
      const result = await apiFetch<{ analysis: string }>(
        '/api/jarvis/vision',
        {
          method: 'POST',
          body: JSON.stringify({ image: visionImage, question }),
        }
      );

      if (result?.analysis) {
        set({ visionAnalysis: result.analysis });
      } else {
        set({ visionAnalysis: 'Unable to analyze the image. Please try again.' });
      }
    } catch {
      set({ visionAnalysis: 'Error analyzing image. Please check your connection.' });
    } finally {
      set({ isAnalyzing: false });
    }
  },

  clearVision: () => {
    set({ visionImage: null, visionAnalysis: null, isAnalyzing: false });
  },

  // ── Search Actions ──────────────────────────────────────────────

  searchWeb: async (query: string) => {
    set({ isSearching: true, searchQuery: query, searchResults: [] });

    try {
      const result = await apiFetch<{ results: SearchResult[] }>(
        '/api/jarvis/search',
        {
          method: 'POST',
          body: JSON.stringify({ query, num: 10 }),
        }
      );

      if (result?.results) {
        set({ searchResults: result.results });
      }
    } catch {
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchQuery: '', isSearching: false });
  },

  // ── Notification Actions ────────────────────────────────────────

  loadNotifications: async () => {
    const result = await apiFetch<{ notifications: Notification[] }>(
      '/api/jarvis/notifications'
    );
    if (result?.notifications) {
      const unreadCount = result.notifications.filter((n) => !n.read).length;
      set({ notifications: result.notifications, unreadCount });
    }
  },

  addNotification: async (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    // Optimistically add to local state
    set((s) => ({
      notifications: [newNotification, ...s.notifications],
      unreadCount: s.unreadCount + (notification.read ? 0 : 1),
    }));

    // Persist to API
    await apiFetch('/api/jarvis/notifications', {
      method: 'POST',
      body: JSON.stringify(newNotification),
    });
  },

  markAsRead: async (id: string) => {
    // Optimistically update local state
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });

    // Persist to API
    await apiFetch('/api/jarvis/notifications', {
      method: 'PUT',
      body: JSON.stringify({ id }),
    });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  // ── Wake Word Actions ──────────────────────────────────────────

  setWakeWordActive: (active: boolean) => {
    set({ wakeWordActive: active });
  },

  setWakeWordState: (state: WakeWordState) => {
    set({ wakeWordState: state });
  },

  // ── System Stats Actions ───────────────────────────────────────

  setSystemStats: (stats: SystemStats | null) => {
    set({ systemStats: stats });
  },

  // ── Memory Actions ─────────────────────────────────────────────

  loadMemories: async () => {
    const result = await apiFetch<{ memories: Memory[] }>('/api/jarvis/memory');
    if (result?.memories) {
      set({ memories: result.memories });
    }
  },

  addMemory: async (memory: { category: string; key: string; value: string; source?: string; important?: boolean }) => {
    await apiFetch('/api/jarvis/memory', {
      method: 'POST',
      body: JSON.stringify(memory),
    });
    // Reload memories after adding
    await get().loadMemories();
  },

  removeMemory: async (id: string) => {
    // Optimistically remove from local state
    set((s) => ({
      memories: s.memories.filter((m) => m.id !== id),
    }));

    // Persist to API
    await apiFetch(`/api/jarvis/memory?id=${id}`, {
      method: 'DELETE',
    });
  },

  // ── Proactive Actions ──────────────────────────────────────────

  setProactivePolling: (polling: boolean) => {
    set({ proactivePolling: polling });
  },

  // ── Voice Pipeline Actions ────────────────────────────────────────

  queueAudio: (text: string) => {
    set((s) => ({
      audioQueue: [...s.audioQueue, text],
    }));
  },

  clearAudioQueue: () => {
    set({ audioQueue: [], isProcessingAudio: false });
  },

  setProcessingAudio: (processing: boolean) => {
    set({ isProcessingAudio: processing });
  },

  // ── Sound Actions ────────────────────────────────────────────────

  toggleSound: () => {
    set((s) => ({ soundEnabled: !s.soundEnabled }));
  },

  // ── Ambient Mode Actions ──────────────────────────────────────────

  toggleAmbientMode: () => {
    set((s) => ({ ambientMode: !s.ambientMode }));
  },

  // ── Agent Actions ──────────────────────────────────────────────

  setActiveTools: (tools: string[]) => {
    set({ activeTools: tools });
  },

  setAgentThinking: (thinking: boolean) => {
    set({ agentThinking: thinking });
  },

  // ── Email Actions ──────────────────────────────────────────────

  loadEmails: async (filters?: { isRead?: boolean; isStarred?: boolean; limit?: number }) => {
    set({ isLoadingEmails: true });
    try {
      const params = new URLSearchParams();
      if (filters?.isRead !== undefined) params.set('isRead', String(filters.isRead));
      if (filters?.isStarred !== undefined) params.set('isStarred', String(filters.isStarred));
      if (filters?.limit !== undefined) params.set('limit', String(filters.limit));

      const queryString = params.toString();
      const url = `/api/jarvis/email${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<{ emails: Email[]; total: number }>(url);
      if (result?.emails) {
        set({ emails: result.emails });
      }
    } catch {
      console.error('Failed to load emails');
    } finally {
      set({ isLoadingEmails: false });
    }
  },

  sendEmail: async (to: string, subject: string, body: string) => {
    set({ isLoadingEmails: true });
    try {
      const result = await apiFetch<{ email: Email }>('/api/jarvis/email', {
        method: 'POST',
        body: JSON.stringify({ to, subject, body }),
      });
      if (result?.email) {
        set((s) => ({ emails: [result.email, ...s.emails] }));
      }
    } catch {
      console.error('Failed to send email');
    } finally {
      set({ isLoadingEmails: false });
    }
  },

  markEmailRead: async (id: string, read: boolean) => {
    // Optimistic update
    set((s) => ({
      emails: s.emails.map((e) => e.id === id ? { ...e, isRead: read } : e),
    }));
    await apiFetch('/api/jarvis/email', {
      method: 'PUT',
      body: JSON.stringify({ id, isRead: read }),
    });
  },

  starEmail: async (id: string, starred: boolean) => {
    // Optimistic update
    set((s) => ({
      emails: s.emails.map((e) => e.id === id ? { ...e, isStarred: starred } : e),
    }));
    await apiFetch('/api/jarvis/email', {
      method: 'PUT',
      body: JSON.stringify({ id, isStarred: starred }),
    });
  },

  // ── Social Actions ─────────────────────────────────────────────

  loadSocialData: async (platform?: string) => {
    set({ isLoadingSocial: true });
    try {
      const params = new URLSearchParams();
      if (platform) params.set('platform', platform);

      const queryString = params.toString();
      const url = `/api/jarvis/social${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<{ accounts: (SocialAccount & { posts: SocialPost[] })[]; totalPosts: number }>(url);
      if (result?.accounts) {
        const accounts: SocialAccount[] = result.accounts.map(({ posts, ...account }) => account);
        const allPosts: SocialPost[] = result.accounts.flatMap((a) => a.posts || []);
        set({ socialAccounts: accounts, socialPosts: allPosts });
      }
    } catch {
      console.error('Failed to load social data');
    } finally {
      set({ isLoadingSocial: false });
    }
  },

  createSocialPost: async (accountId: string, content: string) => {
    set({ isLoadingSocial: true });
    try {
      const result = await apiFetch<{ post: SocialPost }>('/api/jarvis/social', {
        method: 'POST',
        body: JSON.stringify({ accountId, content }),
      });
      if (result?.post) {
        set((s) => ({ socialPosts: [result.post, ...s.socialPosts] }));
      }
    } catch {
      console.error('Failed to create social post');
    } finally {
      set({ isLoadingSocial: false });
    }
  },

  // ── Campaign Actions ───────────────────────────────────────────

  loadCampaigns: async (status?: string) => {
    set({ isLoadingCampaigns: true });
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const queryString = params.toString();
      const url = `/api/jarvis/campaigns${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<{ campaigns: Campaign[]; total: number }>(url);
      if (result?.campaigns) {
        set({ campaigns: result.campaigns });
      }
    } catch {
      console.error('Failed to load campaigns');
    } finally {
      set({ isLoadingCampaigns: false });
    }
  },

  createCampaign: async (name: string, type: string, budget?: number) => {
    set({ isLoadingCampaigns: true });
    try {
      const result = await apiFetch<{ campaign: Campaign }>('/api/jarvis/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, type, budget }),
      });
      if (result?.campaign) {
        set((s) => ({ campaigns: [result.campaign, ...s.campaigns] }));
      }
    } catch {
      console.error('Failed to create campaign');
    } finally {
      set({ isLoadingCampaigns: false });
    }
  },

  updateCampaign: async (id: string, data: Partial<Campaign>) => {
    // Optimistic update
    set((s) => ({
      campaigns: s.campaigns.map((c) => c.id === id ? { ...c, ...data } : c),
    }));
    await apiFetch('/api/jarvis/campaigns', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });
  },

  deleteCampaign: async (id: string) => {
    // Optimistic delete
    set((s) => ({
      campaigns: s.campaigns.filter((c) => c.id !== id),
    }));
    await apiFetch(`/api/jarvis/campaigns?id=${id}`, {
      method: 'DELETE',
    });
  },

  // ── Calendar Actions ───────────────────────────────────────────

  loadCalendarEvents: async (start?: string, end?: string) => {
    set({ isLoadingCalendar: true });
    try {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);

      const queryString = params.toString();
      const url = `/api/jarvis/calendar${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<{ events: CalendarEvent[]; total: number }>(url);
      if (result?.events) {
        set({ calendarEvents: result.events });
      }
    } catch {
      console.error('Failed to load calendar events');
    } finally {
      set({ isLoadingCalendar: false });
    }
  },

  createCalendarEvent: async (event: { title: string; description?: string; location?: string; startTime: string; endTime: string; reminder?: number }) => {
    set({ isLoadingCalendar: true });
    try {
      const result = await apiFetch<{ event: CalendarEvent }>('/api/jarvis/calendar', {
        method: 'POST',
        body: JSON.stringify(event),
      });
      if (result?.event) {
        set((s) => ({ calendarEvents: [...s.calendarEvents, result.event] }));
      }
    } catch {
      console.error('Failed to create calendar event');
    } finally {
      set({ isLoadingCalendar: false });
    }
  },

  deleteCalendarEvent: async (id: string) => {
    // Optimistic delete
    set((s) => ({
      calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
    }));
    await apiFetch(`/api/jarvis/calendar?id=${id}`, {
      method: 'DELETE',
    });
  },

  // ── File Actions ───────────────────────────────────────────────

  loadFiles: async (type?: string) => {
    set({ isLoadingFiles: true });
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);

      const queryString = params.toString();
      const url = `/api/jarvis/files${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<{ files: FileItem[]; total: number }>(url);
      if (result?.files) {
        set({ files: result.files });
      }
    } catch {
      console.error('Failed to load files');
    } finally {
      set({ isLoadingFiles: false });
    }
  },

  uploadFile: async (file: { name: string; type: string; size: number; path: string; content?: string; tags?: string[] }) => {
    set({ isLoadingFiles: true });
    try {
      const result = await apiFetch<{ file: FileItem }>('/api/jarvis/files', {
        method: 'POST',
        body: JSON.stringify(file),
      });
      if (result?.file) {
        set((s) => ({ files: [result.file, ...s.files] }));
      }
    } catch {
      console.error('Failed to upload file');
    } finally {
      set({ isLoadingFiles: false });
    }
  },

  deleteFile: async (id: string) => {
    // Optimistic delete
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
    }));
    await apiFetch(`/api/jarvis/files?id=${id}`, {
      method: 'DELETE',
    });
  },

  // ── Stripe Actions ─────────────────────────────────────────────

  loadStripeConfig: async () => {
    set({ isLoadingStripe: true });
    try {
      const result = await apiFetch<{ stripeConfig: StripeConfig | null; subscriptions: Subscription[] }>('/api/jarvis/stripe');
      if (result) {
        set({
          stripeConfig: result.stripeConfig,
          subscription: result.subscriptions[0] || null,
          subscriptions: result.subscriptions || [],
        });
      }
    } catch {
      console.error('Failed to load Stripe config');
    } finally {
      set({ isLoadingStripe: false });
    }
  },

  configureStripe: async (publicKey: string, secretKey: string, mode: string) => {
    set({ isLoadingStripe: true });
    try {
      const result = await apiFetch<{ config: StripeConfig }>('/api/jarvis/stripe', {
        method: 'POST',
        body: JSON.stringify({ action: 'configure', publicKey, secretKey, mode }),
      });
      if (result?.config) {
        set({ stripeConfig: result.config });
      }
    } catch {
      console.error('Failed to configure Stripe');
    } finally {
      set({ isLoadingStripe: false });
    }
  },

  // ── Finance Actions ───────────────────────────────────────────────

  loadFinanceQuotes: async (tickers?: string[]) => {
    set({ isLoadingFinance: true });
    try {
      if (tickers?.length) {
        const tickerParam = tickers.join(',');
        const result = await apiFetch<{ snapshot: FinanceQuote[] }>(`/api/jarvis/finance?action=snapshot&ticker=${encodeURIComponent(tickerParam)}`);
        if (result?.snapshot) {
          set({ financeQuotes: result.snapshot });
        }
      } else {
        // Load from watchlist tickers
        const wl = get().financeWatchlist;
        if (wl.length > 0) {
          const tickerParam = wl.map((w) => w.ticker).join(',');
          const result = await apiFetch<{ snapshot: FinanceQuote[] }>(`/api/jarvis/finance?action=snapshot&ticker=${encodeURIComponent(tickerParam)}`);
          if (result?.snapshot) {
            set({ financeQuotes: result.snapshot });
          }
        }
      }
    } catch {
      console.error('Failed to load finance quotes');
    } finally {
      set({ isLoadingFinance: false });
    }
  },

  loadFinanceNews: async (ticker?: string) => {
    try {
      const params = new URLSearchParams();
      params.set('action', 'news');
      if (ticker) params.set('ticker', ticker);
      const result = await apiFetch<{ news: FinanceNewsItem[] }>(`/api/jarvis/finance?${params.toString()}`);
      if (result?.news) {
        set({ financeNews: result.news });
      }
    } catch {
      console.error('Failed to load finance news');
    }
  },

  loadFinanceWatchlist: async () => {
    try {
      const result = await apiFetch<{ watchlist: FinanceWatchlistItem[] }>('/api/jarvis/finance/watchlist');
      if (result?.watchlist) {
        set({ financeWatchlist: result.watchlist });
      }
    } catch {
      console.error('Failed to load finance watchlist');
    }
  },

  addToWatchlist: async (ticker: string, name: string, quantity?: number, avgCost?: number) => {
    try {
      const result = await apiFetch<{ item: FinanceWatchlistItem }>('/api/jarvis/finance/watchlist', {
        method: 'POST',
        body: JSON.stringify({ ticker, name, quantity, avgPrice: avgCost }),
      });
      if (result?.item) {
        set((s) => ({ financeWatchlist: [...s.financeWatchlist, result.item] }));
      }
    } catch {
      console.error('Failed to add to watchlist');
    }
  },

  removeFromWatchlist: async (id: string) => {
    set((s) => ({ financeWatchlist: s.financeWatchlist.filter((w) => w.id !== id) }));
    await apiFetch(`/api/jarvis/finance/watchlist?id=${id}`, {
      method: 'DELETE',
    });
  },

  loadFinanceAlerts: async () => {
    try {
      const result = await apiFetch<{ alerts: FinanceAlert[] }>('/api/jarvis/finance/alerts');
      if (result?.alerts) {
        set({ financeAlerts: result.alerts });
      }
    } catch {
      console.error('Failed to load finance alerts');
    }
  },

  createFinanceAlert: async (ticker: string, type: 'above' | 'below' | 'change_percent', value: number) => {
    try {
      const result = await apiFetch<{ alert: FinanceAlert }>('/api/jarvis/finance/alerts', {
        method: 'POST',
        body: JSON.stringify({ ticker, type, value }),
      });
      if (result?.alert) {
        set((s) => ({ financeAlerts: [...s.financeAlerts, result.alert] }));
      }
    } catch {
      console.error('Failed to create finance alert');
    }
  },

  deleteFinanceAlert: async (id: string) => {
    set((s) => ({ financeAlerts: s.financeAlerts.filter((a) => a.id !== id) }));
    await apiFetch(`/api/jarvis/finance/alerts?id=${id}`, {
      method: 'DELETE',
    });
  },

  toggleFinanceAlert: async (id: string, active: boolean) => {
    set((s) => ({
      financeAlerts: s.financeAlerts.map((a) => a.id === id ? { ...a, isActive: active } : a),
    }));
    await apiFetch('/api/jarvis/finance/alerts', {
      method: 'PUT',
      body: JSON.stringify({ id, isActive: active }),
    });
  },

  loadFinanceBriefing: async () => {
    set({ isLoadingFinance: true });
    try {
      const result = await apiFetch<{ briefing: { text: string; sentiment: string; generatedAt: string }; indices: unknown; news: unknown[] }>('/api/jarvis/finance?action=briefing');
      if (result?.briefing) {
        set({ financeBriefing: { text: result.briefing.text, sentiment: (result.briefing.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral', generatedAt: result.briefing.generatedAt } });
      }
    } catch {
      console.error('Failed to load finance briefing');
    } finally {
      set({ isLoadingFinance: false });
    }
  },

  searchFinanceStocks: async (query: string) => {
    if (!query.trim()) {
      set({ financeSearchResults: [] });
      return;
    }
    try {
      const result = await apiFetch<{ results: FinanceQuote[] }>(`/api/jarvis/finance?action=search&query=${encodeURIComponent(query)}`);
      if (result?.results) {
        set({ financeSearchResults: result.results });
      }
    } catch {
      console.error('Failed to search stocks');
    }
  },

  selectFinanceStock: async (ticker: string) => {
    try {
      const result = await apiFetch<{ quote: FinanceQuote }>(`/api/jarvis/finance?action=quote&ticker=${encodeURIComponent(ticker)}`);
      if (result?.quote) {
        set({ financeSelectedStock: result.quote });
      }
    } catch {
      console.error('Failed to get stock quote');
    }
  },

  clearFinanceSearch: () => {
    set({ financeSearchResults: [], financeSelectedStock: null });
  },

  // ── UI Actions ──────────────────────────────────────────────────

  setActivePanel: (panel: JarvisPanel) => {
    set((s) => {
      const loadedPanels = new Set(s.loadedPanels);
      loadedPanels.add(panel);
      return { activePanel: panel, loadedPanels };
    });
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
  },

  // ── Settings Actions ────────────────────────────────────────────

  updateSettings: async (settings: Partial<JarvisSettings>) => {
    // Optimistically update local state
    set((s) => ({
      ...settings,
    }));

    // Persist to API
    await apiFetch('/api/jarvis/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  loadSettings: async () => {
    const result = await apiFetch<JarvisSettings>('/api/jarvis/settings');
    if (result) {
      set({
        voiceRate: result.voiceRate ?? 1.0,
        voicePitch: result.voicePitch ?? 1.0,
        jarvisPersonality: result.jarvisPersonality ?? 'professional',
        autoSpeak: result.autoSpeak ?? false,
        language: result.language ?? 'en-US',
      });
    }
  },
}));
