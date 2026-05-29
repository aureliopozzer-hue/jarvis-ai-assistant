'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speeds: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  uptime: number;
  loadAvg: number[];
  platform: string;
  hostname: string;
  network: Array<{
    name: string;
    addresses: Array<{ family: string; address: string }>;
  }>;
  timestamp: string;
}

interface UseSystemMonitorOptions {
  /** Polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Whether to auto-start polling on mount (default: true) */
  autoStart?: boolean;
}

interface UseSystemMonitorReturn {
  data: SystemStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSystemMonitor(
  options: UseSystemMonitorOptions = {}
): UseSystemMonitorReturn {
  const { interval = 10000, autoStart = true } = options;

  const [data, setData] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadingRef = useRef(false);

  const fetchStats = useCallback(async () => {
    // Prevent concurrent fetches
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jarvis/system');

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else if (result.cpu) {
        // API returns stats at the top level
        setData(result as SystemStats);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch system stats';
      setError(message);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Auto-start polling
  useEffect(() => {
    if (autoStart) {
      // Fetch immediately
      fetchStats();

      // Then poll at intervals
      intervalRef.current = setInterval(() => {
        fetchStats();
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoStart, interval, fetchStats]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
