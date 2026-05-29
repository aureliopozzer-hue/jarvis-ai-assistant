import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice } = body as { text: string; voice?: string };

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Texto é obrigatório para sintetizar a fala' },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: 'Texto muito longo. Máximo de 4096 caracteres.' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    const result = await zai.audio.tts.create({
      input: text,
      voice: voice || 'alloy',
    });

    // The TTS result may return audio data in different formats
    // Check if result is a buffer/arraybuffer or has base64 data
    if (result instanceof ArrayBuffer) {
      return new NextResponse(result, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': result.byteLength.toString(),
        },
      });
    }

    if (result instanceof Uint8Array) {
      return new NextResponse(result, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': result.length.toString(),
        },
      });
    }

    // If result has a base64 field or similar structure
    if (result?.data) {
      const buffer = Buffer.from(result.data, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    if (result?.audio) {
      const buffer = Buffer.from(result.audio, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // If result itself is a base64 string
    if (typeof result === 'string') {
      const buffer = Buffer.from(result, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // Fallback: return the raw result as JSON so client can handle it
    return NextResponse.json({ audio: result });
  } catch (error) {
    console.error('[JARVIS TTS ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao sintetizar a fala' },
      { status: 500 }
    );
  }
}
