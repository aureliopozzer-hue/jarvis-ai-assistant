import { create } from 'zustand';

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

export type JarvisPanel = 'chat' | 'vision' | 'search' | 'dashboard';
export type JarvisPersonality = 'professional' | 'friendly' | 'witty';
export type JarvisLanguage = 'pt-BR' | 'en-US';

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

  // UI
  activePanel: JarvisPanel;
  sidebarOpen: boolean;
  isOnline: boolean;

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

  // UI
  activePanel: 'chat',
  sidebarOpen: true,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

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
    });

    try {
      const result = await apiFetch<{
        response: string;
        conversationId: string;
        messageId: string;
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
      set({ isLoading: false });
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

  // ── UI Actions ──────────────────────────────────────────────────

  setActivePanel: (panel: JarvisPanel) => {
    set({ activePanel: panel });
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
