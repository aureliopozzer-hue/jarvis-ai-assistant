'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type WakeWordState = 'idle' | 'listening' | 'awake' | 'processing';

interface UseWakeWordOptions {
  /** The wake word to listen for (default: "jarvis") */
  wakeWord?: string;
  /** Callback when wake word is detected */
  onWake?: () => void;
  /** Callback when a command is captured after the wake word */
  onCommand?: (command: string) => void;
  /** Whether to auto-start listening on mount (default: false) */
  autoStart?: boolean;
  /** Timeout in ms before going back to idle after wake word without command (default: 5000) */
  commandTimeout?: number;
}

interface UseWakeWordReturn {
  state: WakeWordState;
  startListening: () => void;
  stopListening: () => void;
  resetWake: () => void;
  transcript: string;
  isSupported: boolean;
  /** The text spoken AFTER the wake word (the command) */
  commandText: string;
}

/** Check if SpeechRecognition is supported (SSR-safe) */
function getIsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const {
    wakeWord = 'jarvis',
    onWake,
    onCommand,
    autoStart = false,
    commandTimeout = 5000,
  } = options;

  const [state, setState] = useState<WakeWordState>('idle');
  const [transcript, setTranscript] = useState('');
  const [commandText, setCommandText] = useState('');
  const [isSupported] = useState(getIsSupported);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onWakeRef = useRef(onWake);
  const onCommandRef = useRef(onCommand);
  const stateRef = useRef(state);
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandAccumulatorRef = useRef('');

  // Keep refs in sync (inside effect to avoid render-time ref write)
  useEffect(() => {
    onWakeRef.current = onWake;
  }, [onWake]);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Clear command timeout
  const clearCommandTimeout = useCallback(() => {
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearCommandTimeout();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already be stopped
      }
    }
    setState('idle');
    setCommandText('');
    commandAccumulatorRef.current = '';
  }, [clearCommandTimeout]);

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

    // Try Portuguese first, fall back to English
    try {
      // Test if pt-BR is available
      const testLang = 'pt-BR';
      recognition.lang = testLang;
    } catch {
      recognition.lang = 'en-US';
    }

    recognition.onstart = () => {
      setState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);

      const currentState = stateRef.current;

      // If already awake, accumulate the command text
      if (currentState === 'awake') {
        commandAccumulatorRef.current = fullTranscript;
        setCommandText(fullTranscript.trim());

        // Check if the result is final (user finished speaking the command)
        let hasFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            hasFinal = true;
          }
        }

        if (hasFinal && fullTranscript.trim().length > 0) {
          // Command captured, clear the timeout
          clearCommandTimeout();

          // Process the command
          setState('processing');
          onCommandRef.current?.(fullTranscript.trim());
        }
        return;
      }

      // Check for wake word (case insensitive)
      if (
        fullTranscript.toLowerCase().includes(wakeWord.toLowerCase()) &&
        currentState !== 'awake' &&
        currentState !== 'processing'
      ) {
        // Clear any previous command
        commandAccumulatorRef.current = '';
        setCommandText('');

        setState('awake');
        onWakeRef.current?.();

        // Start command timeout
        clearCommandTimeout();
        commandTimeoutRef.current = setTimeout(() => {
          // No command spoken after wake word, go back to listening
          if (stateRef.current === 'awake') {
            setCommandText('');
            commandAccumulatorRef.current = '';
            setState('listening');
          }
        }, commandTimeout);

        // Extract any text after the wake word as potential command start
        const wakeIdx = fullTranscript.toLowerCase().indexOf(wakeWord.toLowerCase());
        const afterWake = fullTranscript.substring(wakeIdx + wakeWord.length).trim();
        if (afterWake.length > 0) {
          commandAccumulatorRef.current = afterWake;
          setCommandText(afterWake);
        }
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
      // Auto-restart if we're still in listening or awake state (not manually stopped)
      const currentState = stateRef.current;
      if (currentState === 'listening' || currentState === 'awake') {
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
  }, [wakeWord, commandTimeout, clearCommandTimeout]);

  const resetWake = useCallback(() => {
    clearCommandTimeout();
    setCommandText('');
    commandAccumulatorRef.current = '';
    setState('listening');
    setTranscript('');
  }, [clearCommandTimeout]);

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
      clearCommandTimeout();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [clearCommandTimeout]);

  return {
    state,
    startListening,
    stopListening,
    resetWake,
    transcript,
    isSupported,
    commandText,
  };
}
