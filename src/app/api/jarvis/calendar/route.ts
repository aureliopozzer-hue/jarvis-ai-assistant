import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List events (with optional date range: start, end)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};

    if (start || end) {
      where.startTime = {};
      if (start) (where.startTime as Record<string, unknown>).gte = new Date(start);
      if (end) (where.startTime as Record<string, unknown>).lte = new Date(end);
    }

    if (source) where.source = source;

    const [events, total] = await Promise.all([
      db.calendarEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        take: limit,
        skip: offset,
      }),
      db.calendarEvent.count({ where }),
    ]);

    return NextResponse.json({ events, total, limit, offset });
  } catch (error) {
    console.error('[JARVIS CALENDAR GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos' },
      { status: 500 }
    );
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, location, startTime, endTime, recurrence, reminder, source } = body as {
      title?: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      recurrence?: string;
      reminder?: number;
      source?: string;
    };

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Título, horário de início e fim são obrigatórios' },
        { status: 400 }
      );
    }

    const event = await db.calendarEvent.create({
      data: {
        title,
        description: description || null,
        location: location || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        recurrence: recurrence || null,
        reminder: reminder ?? null,
        source: source || 'jarvis',
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('[JARVIS CALENDAR POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar evento' },
      { status: 500 }
    );
  }
}

// PUT - Update an event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, location, startTime, endTime, recurrence, reminder, source } = body as {
      id?: string;
      title?: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      recurrence?: string;
      reminder?: number;
      source?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'ID do evento é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (location !== undefined) data.location = location || null;
    if (startTime) data.startTime = new Date(startTime);
    if (endTime) data.endTime = new Date(endTime);
    if (recurrence !== undefined) data.recurrence = recurrence || null;
    if (reminder !== undefined) data.reminder = reminder ?? null;
    if (source) data.source = source;

    const event = await db.calendarEvent.update({
      where: { id },
      data,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[JARVIS CALENDAR PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar evento' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do evento é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    await db.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[JARVIS CALENDAR DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao deletar evento' },
      { status: 500 }
    );
  }
}
