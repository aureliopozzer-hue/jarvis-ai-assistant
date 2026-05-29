# JARVIS Project Worklog

---
Task ID: 1
Agent: Main Agent
Task: Fix hydration mismatch in FloatingParticles component

Work Log:
- Identified `Math.random()` in `FloatingParticles` component causing SSR/client hydration mismatch
- Replaced with pre-computed deterministic `PARTICLE_DATA` array (20 particles with fixed values)
- Fixed `new Date().getFullYear()` in footer to static "2025" to prevent timezone hydration mismatch

Stage Summary:
- FloatingParticles now uses deterministic values — no more hydration mismatch
- Footer year hardcoded to avoid SSR/client drift
- Lint passes, page loads with 200 status

---
Task ID: 2
Agent: Main Agent
Task: Fix cross-origin blocking of /_next/* resources from preview iframe

Work Log:
- Added `preview-chat-01052e57-800c-49a0-bc19-a9bc8cbc574d.space-z.ai` to `allowedDevOrigins` in `next.config.ts`
- Server auto-restarted after config change

Stage Summary:
- Cross-origin warnings resolved after config update
- Page serves correctly from preview iframe

---
Task ID: 3
Agent: Main Agent
Task: Read and analyze current codebase state

Work Log:
- Read `page.tsx` (1300+ lines), `jarvis-store.ts` (1400+ lines), all hooks, API routes
- Identified 22 module integrations, 15+ API endpoints
- Mapped all components and their dependencies

Stage Summary:
- Full codebase understanding achieved
- Identified hydration mismatch and cross-origin issues as root causes of broken preview

---
Task ID: 4
Agent: Sub-agent (full-stack-developer)
Task: Enhance voice commands and voice humanization

Work Log:
- Added 10 new voice-triggered actions (agendar, criar tarefa, criar automação, status do sistema, ler página, gerar imagem, clima, cotação, parar fala, voltar)
- Implemented rotating confirmation phrases (6 variants) for humanized panel navigation
- Enhanced preprocessForSpeech with currency/percentage/abbreviation handling
- Added SSML-like markup processing to TTS API route
- Lint passes after changes

Stage Summary:
- Voice commands now cover ALL 15+ JARVIS functions
- Humanized confirmations with varied phrasing
- TTS preprocessing converts symbols to natural speech
- Micro-pauses added for natural rhythm
