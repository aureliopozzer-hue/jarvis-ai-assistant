import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size } = body as { prompt: string; size?: string };

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    const imageResult = await zai.images.generations.create({
      prompt,
      size: size || '1024x1024',
    });

    const imageBase64 = imageResult.data[0]?.base64 || '';

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Não foi possível gerar a imagem' },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: imageBase64 });
  } catch (error) {
    console.error('[JARVIS IMAGE GEN ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar a imagem' },
      { status: 500 }
    );
  }
}
