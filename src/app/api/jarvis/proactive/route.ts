import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getZAI } from '@/lib/zai';

interface ProactiveEventResult {
  id: string;
  eventType: string;
  title: string;
  content: string;
  action: string;
}

// ─── Helper: Get time-of-day greeting ──────────────────────────────

function getTimeGreeting(): { period: string; greeting: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { period: 'morning', greeting: 'Bom dia, senhor!' };
  } else if (hour >= 12 && hour < 18) {
    return { period: 'afternoon', greeting: 'Boa tarde, senhor!' };
  } else {
    return { period: 'evening', greeting: 'Boa noite, senhor!' };
  }
}

// ─── Helper: Get a random tip ─────────────────────────────────────

const JARVIS_TIPS = [
  'Você sabia? A luz viaja a aproximadamente 300.000 km/s no vácuo.',
  'Dica: Use atalhos de teclado para ser mais produtivo. Ctrl+Shift+T reabre abas fechadas.',
  'Fato interessante: O primeiro programa de computador foi escrito por Ada Lovelace em 1843.',
  'Dica: Pausas regulares aumentam a produtividade. Tente a técnica Pomodoro.',
  'Você sabia? O nome "JARVIS" é uma homenagem ao mordomo dos Stark na história original.',
  'Dica: Manter-se hidratado melhora a concentração em até 25%.',
  'Fato: O primeiro servidor web do mundo ainda está online em info.cern.ch.',
  'Dica: Organizar sua área de trabalho digital reduz o estresse cognitivo.',
  'Você sabia? O termo "bug" em computação vem de um inseto real encontrado em um computador em 1947.',
  'Dica: Backup em 3-2-1: 3 cópias, 2 tipos de mídia, 1 fora do local.',
];

function getRandomTip(): string {
  return JARVIS_TIPS[Math.floor(Math.random() * JARVIS_TIPS.length)];
}

// GET - Check for proactive events that need to fire
export async function GET() {
  try {
    const now = new Date();

    // Find active events that are due
    const dueEvents = await db.proactiveEvent.findMany({
      where: {
        active: true,
        OR: [{ lastRun: null }, { lastRun: { not: null } }],
      },
    });

    // Filter events where lastRun + interval < now
    const eventsToProcess = dueEvents.filter((event) => {
      if (!event.lastRun) return true;
      const nextRun = new Date(
        event.lastRun.getTime() + event.interval * 1000
      );
      return nextRun < now;
    });

    const triggered: ProactiveEventResult[] = [];

    for (const event of eventsToProcess) {
      try {
        let action = '';

        switch (event.eventType) {
          case 'system': {
            // Check system stats including disk space and process count
            const os = await import('os');
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memPercentage = ((totalMem - freeMem) / totalMem) * 100;
            const loadAvg = os.loadavg();
            const cpuCount = os.cpus().length;
            const uptime = os.uptime();

            // Calculate disk space info
            let diskInfo = '';
            try {
              const { execSync } = await import('child_process');
              const dfOutput = execSync('df -h / 2>/dev/null || echo "N/A"', {
                encoding: 'utf-8',
                timeout: 3000,
              }).trim();
              const lines = dfOutput.split('\n');
              if (lines.length >= 2) {
                const parts = lines[1].split(/\s+/);
                if (parts.length >= 5) {
                  diskInfo = `Disco: ${parts[2]}/${parts[1]} (${parts[4]} usado)`;
                }
              }
            } catch {
              diskInfo = 'Disco: info indisponível';
            }

            // Get process count
            let processCount = 0;
            try {
              const { execSync } = await import('child_process');
              const psOutput = execSync('ps aux 2>/dev/null | wc -l || echo 0', {
                encoding: 'utf-8',
                timeout: 3000,
              }).trim();
              processCount = parseInt(psOutput, 10) || 0;
            } catch {
              processCount = 0;
            }

            const warnings: string[] = [];

            if (memPercentage > 85) {
              warnings.push(`Memória alta: ${memPercentage.toFixed(1)}%`);
            }
            if (loadAvg[0] > cpuCount * 1.5) {
              warnings.push(`Carga elevada: ${loadAvg[0].toFixed(2)}`);
            }
            if (processCount > 300) {
              warnings.push(`Muitos processos: ${processCount}`);
            }

            if (warnings.length > 0) {
              await db.notification.create({
                data: {
                  type: 'warning',
                  title: 'Alerta de Sistema',
                  message: `${warnings.join(' | ')} — ${diskInfo} — Uptime: ${Math.floor(uptime / 3600)}h`,
                },
              });
              action = 'system_warning';
            } else {
              action = 'system_ok';
            }
            break;
          }

          case 'news': {
            // Quick web search for recent news
            try {
              const zai = await getZAI();
              const searchResults = await zai.functions.invoke('web_search', {
                query: event.content || 'notícias de hoje',
                num: 3,
              });

              if (Array.isArray(searchResults) && searchResults.length > 0) {
                const summary = searchResults
                  .slice(0, 3)
                  .map(
                    (r: { name?: string; snippet?: string }) =>
                      `${r.name || ''}: ${r.snippet || ''}`
                  )
                  .join(' | ');

                await db.notification.create({
                  data: {
                    type: 'info',
                    title: event.title,
                    message: summary.substring(0, 500),
                  },
                });
                action = 'news_summary_created';
              } else {
                action = 'no_news_found';
              }
            } catch {
              action = 'news_search_failed';
            }
            break;
          }

          case 'reminder': {
            // Fire the reminder as a notification
            await db.notification.create({
              data: {
                type: 'alert',
                title: event.title,
                message: event.content,
              },
            });
            action = 'reminder_fired';
            break;
          }

          case 'web_search': {
            // Search for content, create notification if interesting
            try {
              const zai = await getZAI();
              const searchResults = await zai.functions.invoke('web_search', {
                query: event.content,
                num: 5,
              });

              if (Array.isArray(searchResults) && searchResults.length > 0) {
                const topResult = searchResults[0] as {
                  name?: string;
                  snippet?: string;
                  url?: string;
                };
                await db.notification.create({
                  data: {
                    type: 'info',
                    title: event.title,
                    message: `${topResult.name || 'Resultado encontrado'}: ${topResult.snippet || ''}`,
                  },
                });
                action = 'search_result_notified';
              } else {
                action = 'no_search_results';
              }
            } catch {
              action = 'web_search_failed';
            }
            break;
          }

          case 'greeting': {
            // Time-of-day personalized greeting
            const { greeting, period } = getTimeGreeting();

            // Retrieve a few user facts for personalization
            const memories = await db.memory.findMany({
              where: { category: 'fact' },
              take: 3,
              orderBy: { updatedAt: 'desc' },
            });

            let personalizedGreeting = greeting;

            if (memories.length > 0) {
              // Add a personalized touch using known facts
              const name = memories.find((m) =>
                m.key.toLowerCase().includes('name')
              );
              if (name) {
                personalizedGreeting = greeting.replace(
                  'senhor',
                  name.value
                );
              }
            }

            await db.notification.create({
              data: {
                type: 'info',
                title: `Saudação — ${period === 'morning' ? 'Manhã' : period === 'afternoon' ? 'Tarde' : 'Noite'}`,
                message: personalizedGreeting,
              },
            });
            action = 'greeting_sent';
            break;
          }

          case 'memory_recall': {
            // Periodically recall important memories and mention them
            try {
              const importantMemories = await db.memory.findMany({
                where: { important: true },
                take: 3,
                orderBy: { updatedAt: 'desc' },
              });

              const recentMemories = await db.memory.findMany({
                where: {
                  updatedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  },
                },
                take: 3,
                orderBy: { updatedAt: 'desc' },
              });

              const memoriesToRecall =
                importantMemories.length > 0
                  ? importantMemories
                  : recentMemories;

              if (memoriesToRecall.length > 0) {
                const recallSummary = memoriesToRecall
                  .map((m) => `${m.key}: ${m.value}`)
                  .join(' | ');

                await db.notification.create({
                  data: {
                    type: 'info',
                    title: 'Recordação de Memória',
                    message: `Lembrete: ${recallSummary.substring(0, 300)}`,
                  },
                });
                action = 'memory_recalled';
              } else {
                action = 'no_memories_to_recall';
              }
            } catch {
              action = 'memory_recall_failed';
            }
            break;
          }

          case 'tip': {
            // Share a useful tip or fact
            const tip = getRandomTip();
            await db.notification.create({
              data: {
                type: 'info',
                title: 'Dica do JARVIS',
                message: tip,
              },
            });
            action = 'tip_sent';
            break;
          }

          default:
            action = 'unknown_event_type';
        }

        // Update lastRun
        await db.proactiveEvent.update({
          where: { id: event.id },
          data: { lastRun: now },
        });

        triggered.push({
          id: event.id,
          eventType: event.eventType,
          title: event.title,
          content: event.content,
          action,
        });
      } catch (eventError) {
        console.error(
          `[JARVIS PROACTIVE] Error processing event ${event.id}:`,
          eventError
        );
        // Still update lastRun to prevent repeated failures
        await db.proactiveEvent.update({
          where: { id: event.id },
          data: { lastRun: now },
        });

        triggered.push({
          id: event.id,
          eventType: event.eventType,
          title: event.title,
          content: event.content,
          action: 'error',
        });
      }
    }

    return NextResponse.json({
      triggered: triggered.length,
      events: triggered,
    });
  } catch (error) {
    console.error('[JARVIS PROACTIVE GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao verificar eventos proativos' },
      { status: 500 }
    );
  }
}

// POST - Create a new proactive event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, title, content, interval } = body as {
      eventType: string;
      title: string;
      content: string;
      interval?: number;
    };

    if (!eventType || !title || !content) {
      return NextResponse.json(
        {
          error:
            'Tipo de evento, título e conteúdo são obrigatórios',
        },
        { status: 400 }
      );
    }

    const validTypes = [
      'system',
      'news',
      'reminder',
      'web_search',
      'greeting',
      'memory_recall',
      'tip',
    ];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json(
        {
          error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const event = await db.proactiveEvent.create({
      data: {
        eventType,
        title,
        content,
        interval: interval || 300,
        active: true,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('[JARVIS PROACTIVE POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar evento proativo' },
      { status: 500 }
    );
  }
}
