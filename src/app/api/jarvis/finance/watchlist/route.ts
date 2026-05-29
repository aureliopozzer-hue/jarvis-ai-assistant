import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List watchlist items
export async function GET() {
  try {
    const watchlist = await db.financeWatchlist.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('[FINANCE WATCHLIST GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar watchlist' },
      { status: 500 }
    );
  }
}

// POST - Add item to watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, name, type, quantity, avgPrice, notes } = body;

    if (!ticker || !name) {
      return NextResponse.json(
        { error: 'Ticker e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const item = await db.financeWatchlist.upsert({
      where: { ticker },
      update: {
        name,
        type: type || 'STOCKS',
        quantity: quantity ?? null,
        avgPrice: avgPrice ?? null,
        notes: notes ?? null,
      },
      create: {
        ticker,
        name,
        type: type || 'STOCKS',
        quantity: quantity ?? null,
        avgPrice: avgPrice ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('[FINANCE WATCHLIST POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar à watchlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from watchlist
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

    await db.financeWatchlist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FINANCE WATCHLIST DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao remover da watchlist' },
      { status: 500 }
    );
  }
}
