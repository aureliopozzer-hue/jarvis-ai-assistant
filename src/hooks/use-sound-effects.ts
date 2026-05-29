'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useJarvisStore } from '@/lib/jarvis-store';

// ─── Web Audio Context Singleton ─────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      console.warn('[SoundEffects] Web Audio API not available');
      return null;
    }
  }
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ─── Helper: Create an oscillator tone ───────────────────────────────

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  startDelay: number = 0
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);

  // Envelope: quick attack, short sustain, quick release
  gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.01);
  gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay + duration * 0.7);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startDelay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration);
}

// ─── Helper: Frequency sweep ─────────────────────────────────────────

function playSweep(
  ctx: AudioContext,
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.12,
  startDelay: number = 0
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime + startDelay);
  osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + startDelay + duration);

  // Envelope
  gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.01);
  gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay + duration * 0.6);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startDelay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration);
}

// ─── Sound Definitions ───────────────────────────────────────────────

const sounds = {
  /** Short ascending two-tone beep (JARVIS activating) */
  activation: (ctx: AudioContext) => {
    playTone(ctx, 520, 0.08, 'square', 0.12, 0);
    playTone(ctx, 780, 0.12, 'square', 0.15, 0.1);
    playTone(ctx, 1040, 0.15, 'sine', 0.1, 0.22);
  },

  /** Short descending two-tone beep (JARVIS deactivating) */
  deactivation: (ctx: AudioContext) => {
    playTone(ctx, 1040, 0.1, 'sine', 0.12, 0);
    playTone(ctx, 780, 0.1, 'square', 0.1, 0.12);
    playTone(ctx, 520, 0.15, 'square', 0.08, 0.24);
  },

  /** Gentle chime sound */
  notification: (ctx: AudioContext) => {
    playTone(ctx, 880, 0.1, 'sine', 0.1, 0);
    playTone(ctx, 1100, 0.15, 'sine', 0.08, 0.08);
  },

  /** Pleasant confirmation tone */
  success: (ctx: AudioContext) => {
    playTone(ctx, 660, 0.08, 'sine', 0.12, 0);
    playTone(ctx, 880, 0.08, 'sine', 0.12, 0.1);
    playTone(ctx, 1100, 0.15, 'sine', 0.1, 0.2);
  },

  /** Alert tone */
  warning: (ctx: AudioContext) => {
    playSweep(ctx, 440, 220, 0.15, 'square', 0.12, 0);
    playSweep(ctx, 440, 220, 0.15, 'square', 0.12, 0.2);
  },

  /** Subtle electronic hum/click */
  processing: (ctx: AudioContext) => {
    playTone(ctx, 200, 0.03, 'square', 0.06, 0);
    playSweep(ctx, 400, 600, 0.05, 'sine', 0.04, 0.04);
  },

  /** Distinctive "listening" sound (triple ascending tones) */
  wakeWord: (ctx: AudioContext) => {
    playTone(ctx, 440, 0.06, 'sine', 0.12, 0);
    playTone(ctx, 660, 0.06, 'sine', 0.12, 0.08);
    playTone(ctx, 880, 0.1, 'sine', 0.15, 0.16);
    // Add a subtle harmonic
    playTone(ctx, 880, 0.1, 'square', 0.04, 0.16);
  },

  /** Soft send confirmation */
  messageSent: (ctx: AudioContext) => {
    playSweep(ctx, 600, 900, 0.08, 'sine', 0.08, 0);
  },
} as const;

type SoundName = keyof typeof sounds;

// ─── Hook ────────────────────────────────────────────────────────────

interface UseSoundEffectsReturn {
  playActivation: () => void;
  playDeactivation: () => void;
  playNotification: () => void;
  playSuccess: () => void;
  playWarning: () => void;
  playProcessing: () => void;
  playWakeWord: () => void;
  playMessageSent: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

export function useSoundEffects(): UseSoundEffectsReturn {
  const soundEnabled = useJarvisStore((s) => s.soundEnabled);
  const toggleSound = useJarvisStore((s) => s.toggleSound);
  const playedRef = useRef(false);

  // Ensure AudioContext is initialized on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined' || playedRef.current) return;

    const initAudio = () => {
      getAudioContext();
      playedRef.current = true;
      // Remove listeners after first interaction
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        sounds[name](ctx);
      } catch (err) {
        console.warn(`[SoundEffects] Failed to play ${name}:`, err);
      }
    },
    [soundEnabled]
  );

  return {
    playActivation: useCallback(() => play('activation'), [play]),
    playDeactivation: useCallback(() => play('deactivation'), [play]),
    playNotification: useCallback(() => play('notification'), [play]),
    playSuccess: useCallback(() => play('success'), [play]),
    playWarning: useCallback(() => play('warning'), [play]),
    playProcessing: useCallback(() => play('processing'), [play]),
    playWakeWord: useCallback(() => play('wakeWord'), [play]),
    playMessageSent: useCallback(() => play('messageSent'), [play]),
    isSoundEnabled: soundEnabled,
    toggleSound,
  };
}
