'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'speaking' | 'loading';

interface UseJarvisVoiceReturn {
  state: VoiceState;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
}

export function useJarvisVoice(): UseJarvisVoiceReturn {
  const [state, setState] = useState<VoiceState>('idle');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    // Clean up audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Revoke object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Abort any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setState('idle');
  }, [cleanup]);

  // Fallback to browser's Web Speech API when backend TTS fails
  const fallbackToWebSpeech = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[JarvisVoice] Web Speech API not available');
      setState('idle');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a good English or Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('pt')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setState('speaking');
    };

    utterance.onend = () => {
      setState('idle');
    };

    utterance.onerror = () => {
      console.warn('[JarvisVoice] Web Speech API error');
      setState('idle');
    };

    window.speechSynthesis.speak(utterance);
    setState('speaking');
  }, []);

  // Main speak function: try backend TTS, fallback to Web Speech API
  const speakWithFallback = useCallback(
    async (text: string) => {
      if (typeof window === 'undefined') return;
      if (!text.trim()) return;

      // Stop any current playback
      cleanup();
      setState('loading');

      try {
        // Try backend TTS API first
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await fetch('/api/jarvis/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS API returned ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('audio') && !contentType.includes('octet-stream')) {
          throw new Error('TTS API did not return audio content');
        }

        const audioBlob = await response.blob();
        const objectUrl = URL.createObjectURL(audioBlob);
        objectUrlRef.current = objectUrl;

        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setState('idle');
          cleanup();
        };

        audio.onerror = () => {
          console.warn('[JarvisVoice] Audio playback error, falling back to Web Speech API');
          cleanup();
          fallbackToWebSpeech(text);
        };

        await audio.play();
        setState('speaking');
      } catch (error) {
        // If aborted, don't do anything (user stopped playback)
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.warn('[JarvisVoice] Backend TTS failed, falling back to Web Speech API:', error);
        cleanup();
        fallbackToWebSpeech(text);
      }
    },
    [cleanup, fallbackToWebSpeech]
  );

  const speak = useCallback(
    async (text: string) => {
      await speakWithFallback(text);
    },
    [speakWithFallback]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Also cancel any Web Speech API utterances
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cleanup]);

  return {
    state,
    speak,
    stop,
    isSpeaking: state === 'speaking',
  };
}
