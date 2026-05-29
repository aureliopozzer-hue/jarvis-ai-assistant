'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'speaking' | 'loading';

interface SpeakOptions {
  /** Volume level 0..1 (default: 1) */
  volume?: number;
  /** If true, add to queue instead of interrupting current speech (default: false) */
  queue?: boolean;
}

interface UseJarvisVoiceReturn {
  state: VoiceState;
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  /** Current volume level */
  volume: number;
  /** Set volume for subsequent speak calls */
  setVolume: (v: number) => void;
  /** Add text to the audio queue */
  queueAudio: (text: string) => void;
  /** Clear all queued audio */
  clearQueue: () => void;
  /** Number of items in the queue */
  queueLength: number;
}

// ─── Chunk long text for TTS (max ~4000 chars per request) ──────────

function chunkText(text: string, maxLen = 3900): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Try to break at sentence end
    let breakIdx = remaining.lastIndexOf('.', maxLen);
    if (breakIdx < maxLen * 0.3) {
      breakIdx = remaining.lastIndexOf('!', maxLen);
    }
    if (breakIdx < maxLen * 0.3) {
      breakIdx = remaining.lastIndexOf('?', maxLen);
    }
    if (breakIdx < maxLen * 0.3) {
      // Fallback: break at last space
      breakIdx = remaining.lastIndexOf(' ', maxLen);
    }
    if (breakIdx < maxLen * 0.3) {
      // Hard cut
      breakIdx = maxLen;
    }

    chunks.push(remaining.substring(0, breakIdx + 1));
    remaining = remaining.substring(breakIdx + 1).trim();
  }

  return chunks;
}

// ─── Preprocess text for more natural speech ─────────────────────────

function preprocessForSpeech(text: string): string {
  return text
    // Strip markdown code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Strip inline code
    .replace(/`[^`]+`/g, '')
    // Strip bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Strip links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip headings
    .replace(/^#{1,6}\s+/gm, '')
    // Strip list markers
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Add natural pauses: replace double newlines with a pause marker
    .replace(/\n{2,}/g, '... ')
    // Replace single newlines with a short pause
    .replace(/\n/g, '. ')
    // Convert numbers with comma to natural speech (1,000 → 1000)
    .replace(/(\d),(\d{3})/g, '$1$2')
    // Convert currency symbols to spoken words
    .replace(/R\$\s*/g, 'reais ')
    .replace(/\$\s*/g, 'dólares ')
    // Convert percentage to spoken form
    .replace(/(\d)\s*%/g, '$1 por cento')
    // Convert common abbreviations to full words
    .replace(/\bvs\.?\b/gi, 'versus')
    .replace(/\betc\.?\b/gi, 'etcétera')
    .replace(/\bi\.e\.?\b/gi, 'isto é')
    .replace(/\be\.g\.?\b/gi, 'por exemplo')
    .replace(/\bCEO\b/g, 'CEO')
    .replace(/\bCFO\b/g, 'CFO')
    .replace(/\bCTO\b/g, 'CTO')
    .replace(/\bNPS\b/g, 'N P S')
    .replace(/\bROI\b/g, 'R O I')
    .replace(/\bKPI\b/g, 'K P I')
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bSaaS\b/g, 'S a a S')
    .replace(/\bB2B\b/g, 'B dois B')
    .replace(/\bB2C\b/g, 'B dois C')
    // Add natural pauses before "portanto", "assim", "logo" (conclusive conjunctions)
    .replace(/\s+(portanto|assim|logo|pois|consequentemente|por consequência|por isso)\s*/gi, '... $1 ')
    // Add pauses before "mas", "porém", "entretanto" (natural Portuguese pauses)
    .replace(/\s+(mas|porém|entretanto|contudo|todavia|no entanto)\s*/gi, '... $1 ')
    // Add slight pauses after "senhor", "senhora" (respectful address)
    .replace(/\b(senhor|senhora)\b/gi, '$1, ')
    // Add pauses after colons
    .replace(/:\s*/g, '... ')
    // Clean up multiple periods/spaces
    .replace(/\.{2,}/g, '...')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function useJarvisVoice(): UseJarvisVoiceReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [volume, setVolumeState] = useState(1);
  const [queueLength, setQueueLength] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Audio queue: texts waiting to be spoken sequentially
  const audioQueueRef = useRef<string[]>([]);
  // Whether we are currently processing the queue
  const isProcessingQueueRef = useRef(false);

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
    // Clear queue on explicit stop
    audioQueueRef.current = [];
    isProcessingQueueRef.current = false;
    setQueueLength(0);
    setState('idle');
  }, [cleanup]);

  // Fallback to browser's Web Speech API when backend TTS fails
  const fallbackToWebSpeech = useCallback(
    (text: string, vol: number) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('[JarvisVoice] Web Speech API not available');
        setState('idle');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      // Slightly slower rate for natural, authoritative JARVIS feel
      utterance.rate = 0.92;
      // Slightly lower pitch for a more masculine, confident tone
      utterance.pitch = 0.95;
      utterance.volume = vol;

      // Try to find the best voice for JARVIS — prefer Google PT-BR, then any PT, then Google EN
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith('pt-BR') && v.name.toLowerCase().includes('google')) ||
        voices.find((v) => v.lang.startsWith('pt-BR')) ||
        voices.find((v) => v.lang.startsWith('pt')) ||
        voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('male')) ||
        voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) ||
        voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('female')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
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
    },
    []
  );

  // Speak a single chunk via backend TTS API
  const speakChunk = useCallback(
    async (text: string, vol: number): Promise<void> => {
      if (typeof window === 'undefined') return;
      if (!text.trim()) return;

      // Stop any current playback (interruption)
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
        audio.volume = vol;
        audioRef.current = audio;

        return new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            cleanup();
            resolve();
          };

          audio.onerror = () => {
            console.warn('[JarvisVoice] Audio playback error, falling back to Web Speech API');
            cleanup();
            reject(new Error('Audio playback failed'));
          };

          audio.play().catch(reject);
          setState('speaking');
        });
      } catch (error) {
        // If aborted, don't do anything (user stopped playback)
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.warn('[JarvisVoice] Backend TTS failed, falling back to Web Speech API:', error);
        cleanup();
        fallbackToWebSpeech(text, vol);
      }
    },
    [cleanup, fallbackToWebSpeech]
  );

  // Process the audio queue sequentially
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const text = audioQueueRef.current.shift();
      setQueueLength(audioQueueRef.current.length);

      if (text) {
        // Chunk long text
        const chunks = chunkText(text);
        for (const chunk of chunks) {
          try {
            await speakChunk(chunk, volume);
          } catch {
            // If a chunk fails, try fallback
            fallbackToWebSpeech(chunk, volume);
          }
          // Small pause between chunks
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    }

    isProcessingQueueRef.current = false;
    setQueueLength(0);
    setState('idle');
  }, [speakChunk, fallbackToWebSpeech, volume]);

  // Main speak function with interruption support
  const speak = useCallback(
    async (text: string, options?: SpeakOptions) => {
      if (typeof window === 'undefined') return;

      // Preprocess text for more natural speech
      const processedText = preprocessForSpeech(text);
      if (!processedText.trim()) return;

      const vol = options?.volume ?? volume;
      const shouldQueue = options?.queue ?? false;

      if (shouldQueue) {
        // Add to queue and process
        audioQueueRef.current.push(processedText);
        setQueueLength(audioQueueRef.current.length);
        processQueue();
      } else {
        // Interrupt current speech
        cleanup();
        // Clear queue - new speak takes priority
        audioQueueRef.current = [];
        isProcessingQueueRef.current = false;
        setQueueLength(0);

        // Chunk and play sequentially
        const chunks = chunkText(processedText);
        setState('loading');

        for (let i = 0; i < chunks.length; i++) {
          try {
            await speakChunk(chunks[i], vol);
          } catch {
            fallbackToWebSpeech(chunks[i], vol);
          }
          if (i < chunks.length - 1) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }
        setState('idle');
      }
    },
    [cleanup, speakChunk, fallbackToWebSpeech, volume, processQueue]
  );

  const queueAudio = useCallback((text: string) => {
    if (!text.trim()) return;
    audioQueueRef.current.push(text);
    setQueueLength(audioQueueRef.current.length);
    processQueue();
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
    setQueueLength(0);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

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
    volume,
    setVolume,
    queueAudio,
    clearQueue,
    queueLength,
  };
}
