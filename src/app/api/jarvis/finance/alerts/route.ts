import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List active alerts
export async function GET() {
  try {
    const alerts = await db.financeAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[FINANCE ALERTS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    );
  }
}

// POST - Create new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, type, value } = body;

    if (!ticker || !type || value === undefined) {
      return NextResponse.json(
        { error: 'Ticker, tipo e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const validTypes = ['above', 'below', 'change_percent'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipo inválido. Use: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const alert = await db.financeAlert.create({
      data: {
        ticker,
        type,
        value: Number(value),
        isActive: true,
        triggered: false,
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('[FINANCE ALERTS POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar alerta' },
      { status: 500 }
    );
  }
}

// PUT - Update alert (toggle active, mark triggered)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive, triggered } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (triggered !== undefined) updateData.triggered = Boolean(triggered);

    const alert = await db.financeAlert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('[FINANCE ALERTS PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar alerta' },
      { status: 500 }
    );
  }
}

// DELETE - Delete alert
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await db.financeAlert.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FINANCE ALERTS DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao deletar alerta' },
      { status: 500 }
    );
  }
}
