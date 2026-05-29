import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all memories, optionally filter by category or type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    // If type=insights, return aggregated memory insights
    if (type === 'insights') {
      // Count memories by category
      const categoryCounts = await db.memory.groupBy({
        by: ['category'],
        _count: { category: true },
      });

      const countsByCategory: Record<string, number> = {};
      for (const row of categoryCounts) {
        countsByCategory[row.category] = row._count.category;
      }

      // Total memory count
      const totalMemories = await db.memory.count();

      // Important memories
      const importantMemories = await db.memory.findMany({
        where: { important: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });

      // Recently added memories (last 24h)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentMemories = await db.memory.findMany({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Build summary of what JARVIS knows about the user
      const factMemories = await db.memory.findMany({
        where: { category: 'fact' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });

      const preferenceMemories = await db.memory.findMany({
        where: { category: 'preference' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });

      const routineMemories = await db.memory.findMany({
        where: { category: 'routine' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });

      const summaryParts: string[] = [];
      if (factMemories.length > 0) {
        summaryParts.push(
          `Fatos: ${factMemories.map((m) => m.value).join(', ')}`
        );
      }
      if (preferenceMemories.length > 0) {
        summaryParts.push(
          `Preferências: ${preferenceMemories.map((m) => m.value).join(', ')}`
        );
      }
      if (routineMemories.length > 0) {
        summaryParts.push(
          `Rotinas: ${routineMemories.map((m) => m.value).join(', ')}`
        );
      }

      const factsCount = await db.userFact.count();

      return NextResponse.json({
        insights: {
          totalMemories,
          countsByCategory,
          importantMemories,
          recentMemories,
          summary: summaryParts.length > 0
            ? summaryParts.join(' | ')
            : 'Nenhuma informação armazenada ainda.',
          factsCount,
        },
      });
    }

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

// DELETE - Delete a memory by id (supports both query param and body)
export async function DELETE(request: NextRequest) {
  try {
    // Try query param first, then fall back to body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // No body or invalid JSON
      }
    }

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
