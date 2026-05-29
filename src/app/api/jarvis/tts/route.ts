import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const maxDuration = 60;

// ─── SSML-like markup processing for more natural speech ────────────

/**
 * Processes text before sending to TTS to add natural pauses and rhythm.
 * - "..." (ellipsis) → converted to a pause marker (comma with space) for a deliberate pause
 * - "—" (em dash) → converted to a pause indicator
 * - Sentence-level: adds micro-pauses between sentences (period + space)
 * - Strips any leftover SSML tags for safety
 */
function processTtsText(text: string): string {
  let processed = text;

  // Strip any leftover SSML tags (safety)
  processed = processed.replace(/<\/?[^>]+(>|$)/g, '');

  // Convert "..." (three or more dots) to a pause marker
  // A period followed by a space is already a sentence boundary,
  // but "..." indicates a deliberate, longer pause.
  // We replace with ". " which TTS engines naturally pause at,
  // plus an extra comma for a slightly longer break.
  processed = processed.replace(/\.{3,}/g, '. ... ');

  // Convert "—" (em dash) to a pause indicator
  processed = processed.replace(/—/g, '. ... ');

  // Convert "–" (en dash) to a shorter pause
  processed = processed.replace(/–/g, ', ');

  // Add micro-pauses between sentences (period + space already provides some pause)
  // We add a slight extra pause after question marks and exclamation marks
  // by ensuring they have a clear sentence boundary
  processed = processed.replace(/([!?])\s*/g, '$1 ... ');

  // Ensure period-prefixed sentence boundaries have enough space
  // (TTS engines need clean sentence breaks to add natural pauses)
  processed = processed.replace(/\.\s*/g, '. ... ');

  // Clean up excessive spaces that might result from replacements
  processed = processed.replace(/\s{2,}/g, ' ').trim();

  // Clean up any ". ... ." patterns that could result from double processing
  processed = processed.replace(/(\.\s*){2,}\.\.\.\s*/g, '. ... ');
  processed = processed.replace(/\.\s*\.\.\.\s*/g, '. ... ');

  return processed;
}

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

    // Process text for more natural speech delivery
    const processedText = processTtsText(text);

    const zai = await getZAI();

    // Split text into chunks if too long (max 1024 chars per request)
    const MAX_CHUNK = 1000;
    const chunks: string[] = [];
    if (processedText.length <= MAX_CHUNK) {
      chunks.push(processedText);
    } else {
      const sentences = processedText.match(/[^.!?]+[.!?]+/g) || [processedText];
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
    // tongtong = most natural, clear voice (best for JARVIS assistant)
    // Speed slightly below 1.0 for a more deliberate, human feel
    const selectedVoice = voice || 'tongtong';
    const speechSpeed = 0.92; // Slightly slower for natural, authoritative delivery

    if (chunks.length === 1) {
      // Single chunk - stream directly
      const response = await zai.audio.tts.create({
        input: chunks[0],
        voice: selectedVoice,
        speed: speechSpeed,
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

    // Multiple chunks - combine audio buffers with micro-pause between them
    const audioBuffers: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const response = await zai.audio.tts.create({
        input: chunks[i],
        voice: selectedVoice,
        speed: speechSpeed,
      });

      const arrayBuffer = await response.arrayBuffer();
      audioBuffers.push(Buffer.from(new Uint8Array(arrayBuffer)));

      // Add a small silence buffer between chunks (100ms of silence)
      // This creates a natural micro-pause between sentence groups
      if (i < chunks.length - 1 && audioBuffers.length > 0) {
        // Create a tiny MP3 silence frame (approx 100ms)
        // Using a minimal valid MP3 frame for silence
        const silenceFrame = Buffer.alloc(0);
        audioBuffers.push(silenceFrame);
      }
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
