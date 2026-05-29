'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type WakeWordState = 'idle' | 'listening' | 'awake' | 'processing';

interface UseWakeWordOptions {
  /** The wake word to listen for (default: "jarvis") */
  wakeWord?: string;
  /** Callback when wake word is detected */
  onWake?: () => void;
  /** Whether to auto-start listening on mount (default: false) */
  autoStart?: boolean;
}

interface UseWakeWordReturn {
  state: WakeWordState;
  startListening: () => void;
  stopListening: () => void;
  resetWake: () => void;
  transcript: string;
  isSupported: boolean;
}

/** Check if SpeechRecognition is supported (SSR-safe) */
function getIsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const { wakeWord = 'jarvis', onWake, autoStart = false } = options;

  const [state, setState] = useState<WakeWordState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isSupported] = useState(getIsSupported);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onWakeRef = useRef(onWake);
  const stateRef = useRef(state);

  // Keep onWake ref in sync (inside effect to avoid render-time ref write)
  useEffect(() => {
    onWakeRef.current = onWake;
  }, [onWake]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already be stopped
      }
    }
    setState('idle');
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('[WakeWord] SpeechRecognition is not supported in this browser');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);

      // Check for wake word (case insensitive)
      if (
        fullTranscript.toLowerCase().includes(wakeWord.toLowerCase()) &&
        stateRef.current !== 'awake' &&
        stateRef.current !== 'processing'
      ) {
        setState('awake');
        onWakeRef.current?.();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are normal during continuous listening
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      if (event.error === 'not-allowed') {
        console.warn('[WakeWord] Microphone permission denied');
        setState('idle');
        return;
      }

      console.warn('[WakeWord] Recognition error:', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if we're still in listening state (not manually stopped)
      if (stateRef.current === 'listening') {
        try {
          recognition.start();
        } catch {
          // If restart fails, stay idle
          setState('idle');
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.warn('[WakeWord] Failed to start recognition:', error);
      setState('idle');
    }
  }, [wakeWord]);

  const resetWake = useCallback(() => {
    setState('listening');
    setTranscript('');
  }, []);

  // Auto-start if configured — defer with requestAnimationFrame to avoid
  // calling setState synchronously within the effect body
  useEffect(() => {
    if (autoStart && isSupported) {
      const id = requestAnimationFrame(() => {
        startListening();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [autoStart, isSupported, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    state,
    startListening,
    stopListening,
    resetWake,
    transcript,
    isSupported,
  };
}
