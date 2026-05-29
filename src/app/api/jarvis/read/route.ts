import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    const pageResult = await zai.functions.invoke('page_reader', { url });

    const title = String(
      (pageResult as Record<string, unknown>).title || ''
    );
    const content = String(
      (pageResult as Record<string, unknown>).content || ''
    );

    return NextResponse.json({
      title,
      content,
      url,
    });
  } catch (error) {
    console.error('[JARVIS READ ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao ler a página' },
      { status: 500 }
    );
  }
}
