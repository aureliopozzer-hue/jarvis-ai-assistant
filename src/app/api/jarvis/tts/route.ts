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

    // Split text into chunks if too long (max 1024 chars per request)
    const MAX_CHUNK = 1000;
    const chunks: string[] = [];
    if (text.length <= MAX_CHUNK) {
      chunks.push(text);
    } else {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      let currentChunk = '';
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= MAX_CHUNK) {
          currentChunk += sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
    }

    // Valid voices: tongtong, chuichui, xiaochen, jam, kazi, douji, luodo
    const selectedVoice = voice || 'jam'; // jam = English gentleman voice

    if (chunks.length === 1) {
      // Single chunk - stream directly
      const response = await zai.audio.tts.create({
        input: chunks[0],
        voice: selectedVoice,
        speed: 1.0,
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Multiple chunks - combine audio buffers
    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const response = await zai.audio.tts.create({
        input: chunk,
        voice: selectedVoice,
        speed: 1.0,
      });

      const arrayBuffer = await response.arrayBuffer();
      audioBuffers.push(Buffer.from(new Uint8Array(arrayBuffer)));
    }

    const combined = Buffer.concat(audioBuffers);
    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': combined.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[JARVIS TTS ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao sintetizar a fala' },
      { status: 500 }
    );
  }
}
