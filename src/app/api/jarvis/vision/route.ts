import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, question } = body as {
      image: string;
      question: string;
    };

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Imagem base64 é obrigatória' },
        { status: 400 }
      );
    }

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Pergunta é obrigatória' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    // Handle both raw base64 and data URL format
    let imageUrl: string;
    if (image.startsWith('data:')) {
      // Already a data URL, use directly
      imageUrl = image;
    } else {
      // Raw base64, add prefix
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    const visionResult = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const analysis =
      visionResult.choices[0]?.message?.content ||
      'Não foi possível analisar a imagem fornecida.';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[JARVIS VISION ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao analisar a imagem' },
      { status: 500 }
    );
  }
}
