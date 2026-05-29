import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default settings matching frontend JarvisSettings interface
const DEFAULT_SETTINGS = {
  voiceRate: '1.0',
  voicePitch: '1.0',
  jarvisPersonality: 'professional',
  autoSpeak: 'false',
  language: 'en-US',
};

// GET - Get all settings as flat object
export async function GET() {
  try {
    const settings = await db.jarvisSetting.findMany();

    // Convert to key-value object for easier frontend use
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    // Return flat object with defaults for missing keys
    const flat: Record<string, string | number | boolean> = {};
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      const raw = settingsMap[key] ?? defaultValue;
      // Parse types correctly
      if (key === 'voiceRate' || key === 'voicePitch') {
        flat[key] = parseFloat(raw);
      } else if (key === 'autoSpeak') {
        flat[key] = raw === 'true';
      } else {
        flat[key] = raw;
      }
    }

    return NextResponse.json(flat);
  } catch (error) {
    console.error('[JARVIS SETTINGS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// PUT - Update setting(s)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both single key/value and flat object updates
    const updates: Record<string, string> = {};

    if (body.key && body.value !== undefined) {
      // Single key-value update
      updates[body.key] = String(body.value);
    } else {
      // Flat object update - extract known settings keys
      const knownKeys = Object.keys(DEFAULT_SETTINGS);
      for (const key of knownKeys) {
        if (body[key] !== undefined) {
          updates[key] = String(body[key]);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma configuração para atualizar' },
        { status: 400 }
      );
    }

    // Upsert each setting
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const setting = await db.jarvisSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      results.push(setting);
    }

    // Return flat object like GET
    const allSettings = await db.jarvisSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const setting of allSettings) {
      settingsMap[setting.key] = setting.value;
    }

    const flat: Record<string, string | number | boolean> = {};
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      const raw = settingsMap[key] ?? defaultValue;
      if (key === 'voiceRate' || key === 'voicePitch') {
        flat[key] = parseFloat(raw);
      } else if (key === 'autoSpeak') {
        flat[key] = raw === 'true';
      } else {
        flat[key] = raw;
      }
    }

    return NextResponse.json(flat);
  } catch (error) {
    console.error('[JARVIS SETTINGS PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração' },
      { status: 500 }
    );
  }
}
