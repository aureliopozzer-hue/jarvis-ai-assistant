# Task 7-10: Hooks Builder — Work Record

## Task
Create 4 custom React hooks in `/src/hooks/` for the JARVIS AI Assistant project.

## What Was Done

### 1. `/src/hooks/use-wake-word.ts` — Wake Word Detection
- Web Speech API (SpeechRecognition) continuous listening
- Detects "jarvis" (case insensitive) in any transcript position
- States: `idle | listening | awake | processing`
- Methods: `startListening()`, `stopListening()`, `resetWake()`
- Auto-restarts recognition on end to keep always listening
- SSR-safe: `isSupported` initialized via `getIsSupported()` (no setState in effect)
- Auto-start with `requestAnimationFrame` for React 19 lint compliance

### 2. `/src/hooks/use-jarvis-voice.ts` — TTS with Real Voice
- `speak(text)`: POSTs to `/api/jarvis/tts`, plays returned audio blob
- Falls back to Web Speech API `SpeechSynthesis` when backend fails
- States: `idle | speaking | loading`
- Full lifecycle management: AbortController, object URL cleanup, audio element cleanup
- Voice preference: Google English → any English → Portuguese → first available

### 3. `/src/hooks/use-proactive.ts` — Proactive Notifications
- Polls `/api/jarvis/proactive` every 30s (configurable)
- Adds notifications via `useJarvisStore.addNotification()`
- Filters noise: skips error/ok/failed actions, deduplicates by title
- Maps event types to notification types
- `startPolling()` / `stopPolling()` controls

### 4. `/src/hooks/use-system-monitor.ts` — System Stats
- Fetches `/api/jarvis/system` every 5s (configurable)
- `SystemStats` type matches actual API response: `cpu: { usage, cores, model, speeds }`, `memory: { total, used, free, percentage }`, plus `uptime`, `loadAvg`, `platform`, `hostname`, `network`, `timestamp`
- `refresh()` for manual refresh
- Concurrent fetch prevention via ref guard

## Key Decisions
- All hooks use `'use client'` directive
- SSR safety: window/navigator checks before browser API usage
- React 19 lint compliance: no setState in effects, no ref updates during render
- TypeScript types aligned with actual backend API response shapes
- `requestAnimationFrame` used to defer auto-start calls outside effect synchronous phase

## Verification
- ESLint passes with 0 errors
- All hooks properly clean up on unmount (intervals, audio, recognition instances)
