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
}

export function useProactive(options: UseProactiveOptions = {}): UseProactiveReturn {
  const { interval = 30000, autoStart = true } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

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
          event.action === 'web_search_failed'
        )
          continue;

        // Check if this event was recently notified (avoid duplicates)
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
      }

      setLastChecked(new Date());
    } catch (error) {
      console.warn('[Proactive] Error checking events:', error);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return; // Already polling

    isPollingRef.current = true;
    setIsPolling(true);

    // Check immediately
    checkProactiveEvents();

    // Then check at intervals
    intervalRef.current = setInterval(() => {
      checkProactiveEvents();
    }, interval);
  }, [interval, checkProactiveEvents]);

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
    default:
      return 'info';
  }
}
