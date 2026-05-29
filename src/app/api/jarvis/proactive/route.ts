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
            // Check system stats
            const os = await import('os');
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memPercentage = ((totalMem - freeMem) / totalMem) * 100;
            const loadAvg = os.loadavg();

            if (memPercentage > 85) {
              await db.notification.create({
                data: {
                  type: 'warning',
                  title: 'Alerta de Sistema',
                  message: `Uso de memória alto: ${memPercentage.toFixed(1)}% - ${event.title}`,
                },
              });
              action = 'high_memory_alert';
            } else if (loadAvg[0] > 2) {
              await db.notification.create({
                data: {
                  type: 'warning',
                  title: 'Alerta de Sistema',
                  message: `Carga do sistema elevada: ${loadAvg[0].toFixed(2)} - ${event.title}`,
                },
              });
              action = 'high_load_alert';
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

    const validTypes = ['system', 'news', 'reminder', 'web_search'];
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
