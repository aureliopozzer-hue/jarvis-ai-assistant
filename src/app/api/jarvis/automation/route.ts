import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Helper: format automation record ─────────────────────────────────────
function formatAutomation(auto: {
  id: string;
  name: string;
  trigger: string;
  actions: string;
  isActive: boolean;
  lastRun: Date | null;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: auto.id,
    name: auto.name,
    trigger: JSON.parse(auto.trigger),
    actions: JSON.parse(auto.actions),
    isActive: auto.isActive,
    lastRun: auto.lastRun?.toISOString() || null,
    runCount: auto.runCount,
    createdAt: auto.createdAt.toISOString(),
    updatedAt: auto.updatedAt.toISOString(),
  };
}

// ─── GET Handler ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      // ── List all automations ──
      case 'list': {
        const isActive = searchParams.get('active');
        const where: Record<string, unknown> = {};
        if (isActive !== null) {
          where.isActive = isActive === 'true';
        }

        const automations = await db.automation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          automations: automations.map(formatAutomation),
        });
      }

      // ── Get specific automation ──
      case 'get': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { error: 'ID da automação é obrigatório' },
            { status: 400 }
          );
        }

        const automation = await db.automation.findUnique({ where: { id } });
        if (!automation) {
          return NextResponse.json(
            { error: 'Automação não encontrada' },
            { status: 404 }
          );
        }

        return NextResponse.json({ automation: formatAutomation(automation) });
      }

      default:
        return NextResponse.json(
          { error: 'Ação GET inválida. Disponíveis: list, get' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS AUTOMATION GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar automações' },
      { status: 500 }
    );
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ── Create automation ──
      case 'create': {
        const { name, trigger, actions, isActive } = body as {
          name?: string;
          trigger?: { type: string; config: Record<string, unknown> };
          actions?: Array<{ type: string; config: Record<string, unknown> }>;
          isActive?: boolean;
        };

        if (!name || !trigger || !actions) {
          return NextResponse.json(
            { error: 'Nome, trigger e actions são obrigatórios' },
            { status: 400 }
          );
        }

        // Validate trigger type
        const validTriggerTypes = ['schedule', 'event', 'condition'];
        if (!validTriggerTypes.includes(trigger.type)) {
          return NextResponse.json(
            { error: `Tipo de trigger inválido. Use: ${validTriggerTypes.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate action types
        const validActionTypes = ['notify', 'email', 'webhook', 'jarvis_action'];
        for (const act of actions) {
          if (!validActionTypes.includes(act.type)) {
            return NextResponse.json(
              { error: `Tipo de ação inválido: ${act.type}. Use: ${validActionTypes.join(', ')}` },
              { status: 400 }
            );
          }
        }

        const automation = await db.automation.create({
          data: {
            name,
            trigger: JSON.stringify(trigger),
            actions: JSON.stringify(actions),
            isActive: isActive ?? true,
          },
        });

        return NextResponse.json(
          { automation: formatAutomation(automation) },
          { status: 201 }
        );
      }

      // ── Update automation ──
      case 'update': {
        const { id, name, trigger, actions, isActive } = body as {
          id?: string;
          name?: string;
          trigger?: { type: string; config: Record<string, unknown> };
          actions?: Array<{ type: string; config: Record<string, unknown> }>;
          isActive?: boolean;
        };

        if (!id) {
          return NextResponse.json(
            { error: 'ID da automação é obrigatório' },
            { status: 400 }
          );
        }

        const existing = await db.automation.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'Automação não encontrada' },
            { status: 404 }
          );
        }

        const data: Record<string, unknown> = {};
        if (name) data.name = name;
        if (trigger) {
          const validTriggerTypes = ['schedule', 'event', 'condition'];
          if (!validTriggerTypes.includes(trigger.type)) {
            return NextResponse.json(
              { error: `Tipo de trigger inválido. Use: ${validTriggerTypes.join(', ')}` },
              { status: 400 }
            );
          }
          data.trigger = JSON.stringify(trigger);
        }
        if (actions) {
          const validActionTypes = ['notify', 'email', 'webhook', 'jarvis_action'];
          for (const act of actions) {
            if (!validActionTypes.includes(act.type)) {
              return NextResponse.json(
                { error: `Tipo de ação inválido: ${act.type}. Use: ${validActionTypes.join(', ')}` },
                { status: 400 }
              );
            }
          }
          data.actions = JSON.stringify(actions);
        }
        if (isActive !== undefined) data.isActive = isActive;

        const automation = await db.automation.update({
          where: { id },
          data,
        });

        return NextResponse.json({ automation: formatAutomation(automation) });
      }

      // ── Delete automation ──
      case 'delete': {
        const { id } = body as { id?: string };
        if (!id) {
          return NextResponse.json(
            { error: 'ID da automação é obrigatório' },
            { status: 400 }
          );
        }

        const existing = await db.automation.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'Automação não encontrada' },
            { status: 404 }
          );
        }

        await db.automation.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ── Toggle automation active state ──
      case 'toggle': {
        const { id, active } = body as { id?: string; active?: boolean };
        if (!id) {
          return NextResponse.json(
            { error: 'ID da automação é obrigatório' },
            { status: 400 }
          );
        }

        const existing = await db.automation.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'Automação não encontrada' },
            { status: 404 }
          );
        }

        const automation = await db.automation.update({
          where: { id },
          data: { isActive: active ?? !existing.isActive },
        });

        return NextResponse.json({ automation: formatAutomation(automation) });
      }

      // ── Execute an automation manually ──
      case 'execute': {
        const { id } = body as { id?: string };
        if (!id) {
          return NextResponse.json(
            { error: 'ID da automação é obrigatório' },
            { status: 400 }
          );
        }

        const existing = await db.automation.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'Automação não encontrada' },
            { status: 404 }
          );
        }

        // Update run count and last run
        const automation = await db.automation.update({
          where: { id },
          data: {
            lastRun: new Date(),
            runCount: { increment: 1 },
          },
        });

        // Parse the actions for execution info
        const parsedActions = JSON.parse(existing.actions) as Array<{
          type: string;
          config: Record<string, unknown>;
        }>;

        const executionResult = {
          automationId: id,
          automationName: existing.name,
          executedAt: new Date().toISOString(),
          trigger: JSON.parse(existing.trigger),
          actions: parsedActions,
          results: parsedActions.map((act) => ({
            type: act.type,
            status: 'simulated',
            message: `Ação "${act.type}" simulada com sucesso. Config: ${JSON.stringify(act.config)}`,
          })),
        };

        return NextResponse.json({
          automation: formatAutomation(automation),
          execution: executionResult,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Ação POST inválida. Disponíveis: create, update, delete, toggle, execute' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS AUTOMATION POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao processar automação' },
      { status: 500 }
    );
  }
}
