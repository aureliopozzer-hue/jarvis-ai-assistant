import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List campaigns (with optional status filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const campaigns = await db.campaign.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    const total = await db.campaign.count({ where });

    return NextResponse.json({ campaigns, total });
  } catch (error) {
    console.error('[JARVIS CAMPAIGNS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar campanhas' },
      { status: 500 }
    );
  }
}

// POST - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, budget, startDate, endDate, metrics } = body as {
      name?: string;
      type?: string;
      budget?: number;
      startDate?: string;
      endDate?: string;
      metrics?: Record<string, unknown>;
    };

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const validTypes = ['email', 'social', 'ads', 'content'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        name,
        type,
        budget: budget ?? 0,
        metrics: JSON.stringify(metrics || {}),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('[JARVIS CAMPAIGNS POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar campanha' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign (status, metrics, budget)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, metrics, budget, spent, name, startDate, endDate } = body as {
      id?: string;
      status?: string;
      metrics?: Record<string, unknown>;
      budget?: number;
      spent?: number;
      name?: string;
      startDate?: string;
      endDate?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'ID da campanha é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    if (status) {
      const validStatuses = ['draft', 'active', 'paused', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status inválido. Status válidos: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (metrics !== undefined) data.metrics = JSON.stringify(metrics);
    if (budget !== undefined) data.budget = budget;
    if (spent !== undefined) data.spent = spent;
    if (name) data.name = name;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

    const campaign = await db.campaign.update({
      where: { id },
      data,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('[JARVIS CAMPAIGNS PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar campanha' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da campanha é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    await db.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[JARVIS CAMPAIGNS DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao deletar campanha' },
      { status: 500 }
    );
  }
}
