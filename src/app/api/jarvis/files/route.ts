import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List files (with optional type filter, search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};

    if (type) where.type = type;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [files, total] = await Promise.all([
      db.fileItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.fileItem.count({ where }),
    ]);

    return NextResponse.json({ files, total, limit, offset });
  } catch (error) {
    console.error('[JARVIS FILES GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar arquivos' },
      { status: 500 }
    );
  }
}

// POST - Create/upload a file (receives metadata, stores in DB)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, size, path, content, tags } = body as {
      name?: string;
      type?: string;
      size?: number;
      path?: string;
      content?: string;
      tags?: string[];
    };

    if (!name || !type || size === undefined || !path) {
      return NextResponse.json(
        { error: 'Nome, tipo, tamanho e caminho são obrigatórios' },
        { status: 400 }
      );
    }

    const validTypes = ['document', 'image', 'code', 'spreadsheet', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const file = await db.fileItem.create({
      data: {
        name,
        type,
        size,
        path,
        content: content || null,
        tags: JSON.stringify(tags || []),
      },
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error('[JARVIS FILES POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar arquivo' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.fileItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

    await db.fileItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[JARVIS FILES DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo' },
      { status: 500 }
    );
  }
}
