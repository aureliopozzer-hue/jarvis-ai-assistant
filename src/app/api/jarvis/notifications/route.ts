import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List unread notifications
export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      where: { read: false },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('[JARVIS NOTIFICATIONS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message } = body as {
      type: string;
      title: string;
      message: string;
    };

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Tipo, título e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    const validTypes = ['alert', 'info', 'warning', 'success'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const notification = await db.notification.create({
      data: {
        type,
        title,
        message,
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('[JARVIS NOTIFICATIONS POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar notificação' },
      { status: 500 }
    );
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      );
    }

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }

    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error('[JARVIS NOTIFICATIONS PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar notificação' },
      { status: 500 }
    );
  }
}
