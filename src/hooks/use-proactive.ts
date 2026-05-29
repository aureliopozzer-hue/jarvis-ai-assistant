'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useJarvisStore } from '@/lib/jarvis-store';

interface ProactiveEventResult {
  id: string;
  eventType: string;
  title: string;
  content: string;
  action: string;
}

interface ProactiveResponse {
  triggered: number;
  events: ProactiveEventResult[];
}

interface MemoryInsights {
  totalMemories: number;
  countsByCategory: Record<string, number>;
  importantMemories: Array<{
    id: string;
    category: string;
    key: string;
    value: string;
    source: string;
    important: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  recentMemories: Array<{
    id: string;
    category: string;
    key: string;
    value: string;
    source: string;
    important: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  summary: string;
  factsCount: number;
}

interface UseProactiveOptions {
  /** Polling interval in milliseconds (default: 30000) */
  interval?: number;
  /** Whether to auto-speak proactive notifications (default: false) */
  autoSpeak?: boolean;
  /** Whether to auto-start polling on mount (default: true) */
  autoStart?: boolean;
}

interface UseProactiveReturn {
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  lastChecked: Date | null;
  insights: MemoryInsights | null;
  refreshInsights: () => Promise<void>;
}

/** Track when each event type was last shown to prevent duplicates within 5 min */
const lastShownByType: Record<string, number> = {};
const DUPLICATE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function useProactive(options: UseProactiveOptions = {}): UseProactiveReturn {
  const { interval = 30000, autoStart = true } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [insights, setInsights] = useState<MemoryInsights | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  /** Fetch memory insights */
  const refreshInsights = useCallback(async () => {
    try {
      const response = await fetch('/api/jarvis/memory?type=insights');
      if (!response.ok) return;
      const data = await response.json();
      if (data.insights) {
        setInsights(data.insights as MemoryInsights);
      }
    } catch (error) {
      console.warn('[Proactive] Error fetching insights:', error);
    }
  }, []);

  /** Check if an event type was recently shown (within 5 min) */
  const wasRecentlyShown = useCallback((eventType: string): boolean => {
    const lastShown = lastShownByType[eventType];
    if (!lastShown) return false;
    return Date.now() - lastShown < DUPLICATE_THRESHOLD_MS;
  }, []);

  /** Mark an event type as shown now */
  const markAsShown = useCallback((eventType: string) => {
    lastShownByType[eventType] = Date.now();
  }, []);

  const checkProactiveEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/jarvis/proactive');

      if (!response.ok) {
        console.warn('[Proactive] API returned', response.status);
        return;
      }

      const data: ProactiveResponse = await response.json();
      const events = data.events || [];

      if (events.length === 0) {
        setLastChecked(new Date());
        return;
      }

      const addNotification = useJarvisStore.getState().addNotification;

      for (const event of events) {
        // Skip events with errors
        if (event.action === 'error') continue;
        // Skip "ok" status events (no notification needed)
        if (event.action === 'system_ok') continue;
        // Skip "not found" results
        if (
          event.action === 'no_news_found' ||
          event.action === 'no_search_results' ||
          event.action === 'news_search_failed' ||
          event.action === 'web_search_failed' ||
          event.action === 'no_memories_to_recall' ||
          event.action === 'memory_recall_failed'
        )
          continue;

        // Smarter filtering: don't show the same type within 5 minutes
        if (wasRecentlyShown(event.eventType)) continue;

        // Check if this event was recently notified by title (avoid duplicates)
        const existingNotifications = useJarvisStore.getState().notifications;
        const alreadyNotified = existingNotifications.some(
          (n) => n.title === event.title
        );

        if (alreadyNotified) continue;

        // Map event type to notification type
        const notificationType = mapEventTypeToNotificationType(event.eventType);

        await addNotification({
          type: notificationType,
          title: event.title,
          message: event.content,
          read: false,
        });

        // Mark this event type as shown
        markAsShown(event.eventType);
      }

      setLastChecked(new Date());
    } catch (error) {
      console.warn('[Proactive] Error checking events:', error);
    }
  }, [wasRecentlyShown, markAsShown]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return; // Already polling

    isPollingRef.current = true;
    setIsPolling(true);

    // Check immediately
    checkProactiveEvents();
    // Also load insights on start
    refreshInsights();

    // Then check at intervals
    intervalRef.current = setInterval(() => {
      checkProactiveEvents();
    }, interval);
  }, [interval, checkProactiveEvents, refreshInsights]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    setIsPolling(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start polling on mount if configured — defer with requestAnimationFrame
  // to avoid calling setState synchronously within the effect body
  useEffect(() => {
    if (autoStart) {
      const id = requestAnimationFrame(() => {
        startPolling();
      });

      return () => {
        cancelAnimationFrame(id);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        isPollingRef.current = false;
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [autoStart, startPolling]);

  return {
    isPolling,
    startPolling,
    stopPolling,
    lastChecked,
    insights,
    refreshInsights,
  };
}

/** Map proactive event type to notification type */
function mapEventTypeToNotificationType(
  eventType: string
): 'alert' | 'info' | 'warning' | 'success' {
  switch (eventType) {
    case 'web_search':
      return 'info';
    case 'news':
      return 'info';
    case 'reminder':
      return 'warning';
    case 'system':
      return 'alert';
    case 'greeting':
      return 'info';
    case 'memory_recall':
      return 'info';
    case 'tip':
      return 'info';
    default:
      return 'info';
  }
}
