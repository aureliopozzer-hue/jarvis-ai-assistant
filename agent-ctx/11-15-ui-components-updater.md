# Task ID: 11-15
# Agent: UI Components Updater

## Work Log

### 1. Updated `/src/lib/jarvis-store.ts` — Added new store fields
- Added imports for `WakeWordState` and `SystemStats` types from hooks
- Added `Memory` interface with id, category, key, value, source, createdAt
- Added state fields: `wakeWordActive`, `wakeWordState`, `systemStats`, `memories`, `proactivePolling`
- Added actions: `setWakeWordActive`, `setWakeWordState`, `setSystemStats`, `loadMemories`, `addMemory`, `removeMemory`, `setProactivePolling`
- Implemented `loadMemories` with API fetch to `/api/jarvis/memory`

### 2. Updated `/src/components/jarvis/jarvis-header.tsx` — Wake word status indicator
- Added `Radio` and `SignalZero` imports from lucide-react
- Added `wakeWordActive`, `wakeWordState`, `setWakeWordActive` from store
- Added wake word status indicator BEFORE connection status in the right section:
  - When `wakeWordActive && wakeWordState === 'listening'`: breathing Radio icon + "LISTENING" label in cyan
  - When `wakeWordState === 'awake'`: pulsing Radio icon + "AWAKE" label in bright cyan
  - When `wakeWordState === 'processing'`: pulsing Radio icon + "PROCESSING" label
  - When inactive: SignalZero icon + "SLEEP" label in muted color
- Toggle button on click to enable/disable wake word

### 3. Updated `/src/components/jarvis/jarvis-input.tsx` — Wake word integration
- Added `Radio`, `SignalZero` imports from lucide-react
- Added `wakeWordActive`, `wakeWordState`, `setWakeWordActive`, `setWakeWordState` from store
- Auto-focus input when wake word state becomes 'awake' (switches to chat panel)
- Added wake word awake indicator above input row
- Added wake word toggle button (Radio icon) next to mic button
- Input gets cyan glow effect when wake word is 'awake'
- Mic recording now sets `wakeWordState` to 'processing' while transcribing
- Placeholder changes to "JARVIS detectado!" when awake

### 4. Updated `/src/components/jarvis/jarvis-chat.tsx` — Replaced TTS with useJarvisVoice hook
- Removed old `speak` helper function that used Web Speech API directly
- Removed `voicesLoaded` state
- Imported and used `useJarvisVoice` hook: `speakVoice`, `stopVoice`, `voiceSpeaking`, `voiceState`
- Added `speakingMessageId` state to track which message is being spoken
- Auto-speak effect now uses `speakVoice()` instead of old `speak()`
- Syncs speaking state with store (`startSpeaking`/`stopSpeaking`)
- Added voice wave animation bar at top when speaking (5 bars with `jarvis-voice-bar` class)
- Added stop button for voice playback
- Voice wave animation also shown inside message bubble for the currently speaking message
- Fixed React 19 lint compliance: used `requestAnimationFrame` for setState in effects

### 5. Updated `/src/components/jarvis/jarvis-dashboard.tsx` — Real system data
- Imported `useSystemMonitor` and `useProactive` hooks
- ArcReactor now accepts `cpuUsage` prop — rotation speed varies based on CPU usage (faster when busier)
- Added `CircularProgress` component for CPU and RAM usage visualization
- Replaced static system status with real data:
  - CPU: circular progress, usage bar with `jarvis-stat-bar`, model name, core count
  - RAM: circular progress, usage bar, GB used/total
  - Uptime: formatted string (days/hours/minutes)
  - Load Average: displayed as string
  - Platform & hostname info
  - Network interface info
- Added refresh button for system stats
- Added "Monitoramento Proativo" section showing polling status and last checked time
- Added "Memórias" section showing recent stored memories with category badges
- Stats bars change color to orange when usage is high (>80% CPU, >85% RAM)
- Version updated to v2.0

### 6. Updated `/src/app/page.tsx` — Top-level integrations
- Imported `useWakeWord`, `useJarvisVoice`, `useProactive`, `useSystemMonitor` hooks
- Wake word integration:
  - When detected (state 'awake'): auto-switches to chat panel
  - Resets after 3 seconds via timer
  - Visual flash overlay (cyan radial gradient, fades out)
- Proactive polling: auto-starts on mount with 30s interval
- System monitor: auto-starts on mount, syncs data to store
- Wake word state synced between hook and store
- Start/stop wake word listening based on `wakeWordActive` store flag
- Initial greeting (once per session via sessionStorage):
  - Uses `speakVoice()` from useJarvisVoice hook
  - Says "Sistema JARVIS online. {greeting}, senhor. Como posso ajudar?"
  - Fires after 2 seconds delay
  - Only once per session (sessionStorage check)

## Stage Summary
- All 5 components updated with new hook integrations
- ESLint passes with 0 errors
- Dev server running and serving pages correctly
- All existing features preserved and enhanced
- Wake word, voice TTS, system monitoring, proactive polling all integrated
