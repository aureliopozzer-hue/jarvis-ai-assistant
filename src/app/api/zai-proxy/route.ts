import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

// ─── ZAI Proxy for External VPS Deployment ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// This route proxies ZAI SDK calls so that an external VPS can use the
// Z.AI API through the sandbox's internal access.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, params } = body as {
      type: 'chat' | 'vision' | 'tts' | 'asr' | 'image' | 'search' | 'read';
      params: Record<string, unknown>;
    };

    const zai = await getZAI();

    switch (type) {
      case 'chat': {
        const { messages, thinking } = params as {
          messages: Array<{ role: string; content: string }>;
          thinking?: { type: string };
        };
        const result = await zai.chat.completions.create({
          messages: messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
          thinking: thinking || { type: 'disabled' },
        });
        return NextResponse.json(result);
      }

      case 'vision': {
        const { messages, thinking } = params as {
          messages: Array<{ role: string; content: unknown }>;
          thinking?: { type: string };
        };
        const result = await zai.chat.completions.createVision({
          messages: messages as Array<{ role: 'user' | 'assistant' | 'system'; content: unknown }>,
          thinking: thinking || { type: 'disabled' },
        });
        return NextResponse.json(result);
      }

      case 'tts': {
        const { input, voice, speed } = params as {
          input: string;
          voice?: string;
          speed?: number;
        };
        const result = await zai.audio.tts.create({
          input,
          voice: voice || 'tongtong',
          speed: speed || 0.92,
        });
        const arrayBuffer = await result.arrayBuffer();
        const buffer = Buffer.from(new Uint8Array(arrayBuffer));
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'no-cache',
          },
        });
      }

      case 'asr': {
        const { audio, language } = params as {
          audio: string; // base64 encoded
          language?: string;
        };
        const audioBuffer = Buffer.from(audio, 'base64');
        const result = await zai.audio.asr.create({
          audio: audioBuffer,
          language: language || 'pt-BR',
        });
        return NextResponse.json(result);
      }

      case 'image': {
        const { prompt, size } = params as {
          prompt: string;
          size?: string;
        };
        const result = await zai.images.generate({
          prompt,
          size: size || '1024x1024',
        });
        return NextResponse.json(result);
      }

      case 'search': {
        const { query, num } = params as {
          query: string;
          num?: number;
        };
        const result = await zai.functions.invoke('web_search', {
          query,
          num: num || 10,
        });
        return NextResponse.json({ results: result });
      }

      case 'read': {
        const { url } = params as { url: string };
        const result = await zai.functions.invoke('web_reader', { url });
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json(
          { error: `Unknown proxy type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ZAI PROXY ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy error' },
      { status: 500 }
    );
  }
}
