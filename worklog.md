---
Task ID: 1
Agent: Main Agent
Task: Fix dev server, connect voice to all functions, enhance voice, provide requirements

Work Log:
- Investigated dev server crash — server was dying after shell session ended
- Found CORS cross-origin warning from preview panel in dev log
- Fixed next.config.ts — added allowedDevOrigins for .space-z.ai and .z.ai domains
- Created detached server launcher script (/tmp/jarvis-launcher.js) for persistent process
- Verified server compiles and serves pages correctly (GET / 200)
- Created comprehensive voice command router connecting voice to ALL 15 JARVIS panels:
  - Navigation: chat, vision, search, dashboard, email, social, campaigns, calendar, files, stripe, finance, weather, automation, tasks, news
  - Portuguese keyword mapping for each panel (e.g., "email", "e-mail", "correio", "caixa de entrada" → email panel)
  - Direct action commands: finance briefing, memory save, web search, email send
  - Panel auto-loading data on navigation
  - Voice confirmation for each navigation ("Abrindo Mercado Financeiro.")
- Enhanced voice humanization:
  - TTS speed reduced from 1.0 to 0.92 for authoritative, deliberate delivery
  - Fallback Web Speech API rate set to 0.92, pitch to 0.95
  - Added Portuguese voice preference (pt-BR Google first)
  - Created preprocessForSpeech() function with:
    - Markdown stripping (code blocks, bold, italic, links, headings, lists)
    - Natural pause insertion (... after colons, before conjunctions like "mas", "porém")
    - Number formatting for natural speech
  - All speech now preprocessed for natural delivery
- Verified all code compiles without errors

Stage Summary:
- Dev server running on port 3000, serving pages correctly
- Voice commands now route to all 15 JARVIS functions directly
- Voice is more humanized with slower speed, natural pauses, Portuguese optimization
- No compilation errors
