import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

export const maxDuration = 60;

interface SearchResult {
  name: string;
  url: string;
  snippet: string;
  host_name: string;
  date: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, num } = body as { query: string; num?: number };

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query de busca é obrigatória' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    const searchResults = await zai.functions.invoke('web_search', {
      query,
      num: num || 10,
    });

    const results: SearchResult[] = Array.isArray(searchResults)
      ? searchResults.map((result: Record<string, unknown>) => ({
          name: String(result.name || ''),
          url: String(result.url || ''),
          snippet: String(result.snippet || ''),
          host_name: String(result.host_name || ''),
          date: String(result.date || ''),
        }))
      : [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[JARVIS SEARCH ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar a busca' },
      { status: 500 }
    );
  }
}
