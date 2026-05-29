import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all memories, optionally filter by category or type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    // If type=facts, return UserFact records instead
    if (type === 'facts') {
      const facts = await db.userFact.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ facts, memories: [] });
    }

    const where = category ? { category } : {};

    const memories = await db.memory.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Also include facts count for context
    const factsCount = await db.userFact.count();

    return NextResponse.json({
      memories,
      factsCount,
    });
  } catch (error) {
    console.error('[JARVIS MEMORY GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar memórias' },
      { status: 500 }
    );
  }
}

// POST - Create or update a memory (upsert on category+key)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, key, value, source, important } = body as {
      category: string;
      key: string;
      value: string;
      source?: string;
      important?: boolean;
    };

    if (!category || !key || !value) {
      return NextResponse.json(
        { error: 'Categoria, chave e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const validCategories = [
      'preference',
      'fact',
      'routine',
      'context',
      'note',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Categoria inválida. Categorias válidas: ${validCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const validSources = ['user', 'system', 'inferred'];
    const memorySource = source || 'user';
    if (!validSources.includes(memorySource)) {
      return NextResponse.json(
        {
          error: `Fonte inválida. Fontes válidas: ${validSources.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Upsert on the unique (category, key) constraint
    const memory = await db.memory.upsert({
      where: {
        category_key: {
          category,
          key,
        },
      },
      update: {
        value,
        source: memorySource,
        important: important ?? false,
      },
      create: {
        category,
        key,
        value,
        source: memorySource,
        important: important ?? false,
      },
    });

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('[JARVIS MEMORY POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao salvar memória' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a memory by id
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'ID da memória é obrigatório' },
        { status: 400 }
      );
    }

    const memory = await db.memory.findUnique({
      where: { id },
    });

    if (!memory) {
      return NextResponse.json(
        { error: 'Memória não encontrada' },
        { status: 404 }
      );
    }

    await db.memory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[JARVIS MEMORY DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao deletar memória' },
      { status: 500 }
    );
  }
}
