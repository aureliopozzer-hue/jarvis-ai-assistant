// ─── ZAI Proxy Client for VPS Deployment ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// This module replaces the direct ZAI SDK with calls to the sandbox proxy.
// On the VPS, the ZAI SDK can't reach internal-api.z.ai, so we route
// all AI calls through the sandbox's /api/zai-proxy endpoint.

const SANDBOX_PROXY_URL = process.env.ZAI_PROXY_URL || '';

interface ProxyChatCompletion {
  choices: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
}

interface ProxyImageResult {
  data?: Array<{ url?: string; b64_json?: string }>;
}

interface ProxySearchResult {
  results: unknown;
}

interface ProxyReadResult {
  result: unknown;
}

async function proxyCall(type: string, params: Record<string, unknown>): Promise<unknown> {
  if (!SANDBOX_PROXY_URL) {
    throw new Error('ZAI_PROXY_URL not configured. Set it in .env to point to the sandbox proxy.');
  }

  const response = await fetch(`${SANDBOX_PROXY_URL}/api/zai-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, params }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ZAI Proxy error (${response.status}): ${error}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('audio/')) {
    // TTS returns audio buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
  }

  return response.json();
}

// ─── ZAI-compatible interface ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ProxyZAI {
  chat = {
    completions: {
      create: async (params: {
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        thinking?: { type: string };
      }): Promise<ProxyChatCompletion> => {
        return proxyCall('chat', params) as Promise<ProxyChatCompletion>;
      },
      createVision: async (params: {
        messages: Array<{ role: string; content: unknown }>;
        thinking?: { type: string };
      }): Promise<ProxyChatCompletion> => {
        return proxyCall('vision', params) as Promise<ProxyChatCompletion>;
      },
    },
  };

  audio = {
    tts: {
      create: async (params: {
        input: string;
        voice?: string;
        speed?: number;
      }): Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }> => {
        const buffer = (await proxyCall('tts', params)) as Buffer;
        return {
          arrayBuffer: async () => buffer.buffer as ArrayBuffer,
        };
      },
    },
    asr: {
      create: async (params: {
        audio: Buffer;
        language?: string;
      }): Promise<unknown> => {
        const base64Audio = params.audio.toString('base64');
        return proxyCall('asr', { audio: base64Audio, language: params.language });
      },
    },
  };

  images = {
    generate: async (params: {
      prompt: string;
      size?: string;
    }): Promise<ProxyImageResult> => {
      return proxyCall('image', params) as Promise<ProxyImageResult>;
    },
  };

  functions = {
    invoke: async (functionName: string, args: Record<string, unknown>): Promise<unknown> => {
      if (functionName === 'web_search') {
        const result = (await proxyCall('search', args)) as ProxySearchResult;
        return result.results;
      }
      if (functionName === 'web_reader') {
        const result = (await proxyCall('read', args)) as ProxyReadResult;
        return result.result;
      }
      throw new Error(`Unknown function: ${functionName}`);
    },
  };
}

// Singleton instance
let proxyZai: ProxyZAI | null = null;

export async function getZAI(): Promise<ProxyZAI> {
  if (!proxyZai) {
    proxyZai = new ProxyZAI();
  }
  return proxyZai;
}

export { ProxyZAI };
