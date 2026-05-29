import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audio } = body as { audio: string };

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json(
        { error: 'Áudio base64 é obrigatório' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    const asrResult = await zai.audio.asr.create({
      file_base64: audio,
    });

    const text = asrResult.text || '';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('[JARVIS VOICE ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao transcrever o áudio' },
      { status: 500 }
    );
  }
}
