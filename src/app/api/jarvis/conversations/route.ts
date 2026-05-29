import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all conversations ordered by updatedAt desc
export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only get the last message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[JARVIS CONVERSATIONS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conversas' },
      { status: 500 }
    );
  }
}

// POST - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body as { title?: string };

    const conversation = await db.conversation.create({
      data: {
        title: title || 'Nova Conversa',
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('[JARVIS CONVERSATIONS POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar conversa' },
      { status: 500 }
    );
  }
}
