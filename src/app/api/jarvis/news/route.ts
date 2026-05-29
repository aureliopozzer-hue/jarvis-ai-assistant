import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';

// ─── News categories ──────────────────────────────────────────────────────
const NEWS_CATEGORIES = [
  { id: 'general', label: 'Geral', icon: '📰' },
  { id: 'technology', label: 'Tecnologia', icon: '💻' },
  { id: 'business', label: 'Negócios', icon: '💼' },
  { id: 'science', label: 'Ciência', icon: '🔬' },
  { id: 'health', label: 'Saúde', icon: '🏥' },
  { id: 'sports', label: 'Esportes', icon: '⚽' },
  { id: 'entertainment', label: 'Entretenimento', icon: '🎬' },
  { id: 'politics', label: 'Política', icon: '🏛️' },
];

interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
}

// ─── Helper: fetch news via ZAI web search ────────────────────────────────
async function fetchNewsViaSearch(query: string, category?: string): Promise<NewsItem[]> {
  const zai = await getZAI();

  const searchQuery = category
    ? `${query} ${category} news Brazil Brasil`
    : `${query} Brazil Brasil`;

  const searchResult = await zai.web.search.create({
    query: searchQuery,
  });

  // Process search results into news items
  const results = Array.isArray(searchResult)
    ? searchResult
    : [];

  return results.slice(0, 15).map((item: { title?: string; snippet?: string; url?: string; source?: string }, index: number) => ({
    id: `news-${Date.now()}-${index}`,
    title: item.title || 'Sem título',
    snippet: item.snippet || '',
    source: item.source || 'Desconhecido',
    url: item.url || '#',
    category: category || 'general',
    publishedAt: new Date().toISOString(),
  }));
}

// ─── Helper: fetch headlines via ZAI ──────────────────────────────────────
async function fetchHeadlines(): Promise<NewsItem[]> {
  const zai = await getZAI();

  // Search for top headlines in Brazil
  const searchResult = await zai.web.search.create({
    query: 'top news headlines Brazil Brasil today 2025',
  });

  const results = Array.isArray(searchResult)
    ? searchResult
    : [];

  const headlines = results.slice(0, 15).map((item: { title?: string; snippet?: string; url?: string; source?: string }, index: number) => ({
    id: `headline-${Date.now()}-${index}`,
    title: item.title || 'Sem título',
    snippet: item.snippet || '',
    source: item.source || 'Desconhecido',
    url: item.url || '#',
    category: 'general',
    publishedAt: new Date().toISOString(),
  }));

  // Use AI to enhance with categorization
  if (headlines.length > 0) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a news categorization assistant. Given a list of news titles, categorize each one into exactly one of these categories: ${NEWS_CATEGORIES.map((c) => c.id).join(', ')}. Return a JSON object mapping the index (0-based) to the category id. Return ONLY the JSON object.`,
          },
          {
            role: 'user',
            content: JSON.stringify(headlines.map((h) => h.title)),
          },
        ],
        thinking: { type: 'disabled' },
      });

      const content = completion.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const categories = JSON.parse(jsonMatch[0]) as Record<string, string>;
        for (const [idx, cat] of Object.entries(categories)) {
          const i = parseInt(idx, 10);
          if (headlines[i] && NEWS_CATEGORIES.some((c) => c.id === cat)) {
            headlines[i].category = cat;
          }
        }
      }
    } catch {
      // Categorization is optional, continue without it
    }
  }

  return headlines;
}

// ─── GET Handler ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      // ── Top headlines ──
      case 'headlines': {
        const headlines = await fetchHeadlines();
        return NextResponse.json({ headlines });
      }

      // ── Search news ──
      case 'search': {
        const q = searchParams.get('q') || '';
        if (!q) {
          return NextResponse.json(
            { error: 'Parâmetro de busca "q" é obrigatório' },
            { status: 400 }
          );
        }

        const news = await fetchNewsViaSearch(q);
        return NextResponse.json({ news, query: q });
      }

      // ── News by category ──
      case 'categories': {
        const category = searchParams.get('category') || 'general';
        const validCategory = NEWS_CATEGORIES.find((c) => c.id === category);
        if (!validCategory) {
          return NextResponse.json(
            { error: `Categoria inválida. Use: ${NEWS_CATEGORIES.map((c) => c.id).join(', ')}` },
            { status: 400 }
          );
        }

        const queryMap: Record<string, string> = {
          general: 'notícias principais Brasil',
          technology: 'notícias tecnologia Brasil inovação',
          business: 'notícias negócios economia Brasil',
          science: 'notícias ciência descobertas Brasil',
          health: 'notícias saúde medicina Brasil',
          sports: 'notícias esportes futebol Brasil',
          entertainment: 'notícias entretenimento cultura Brasil',
          politics: 'notícias política governo Brasil',
        };

        const news = await fetchNewsViaSearch(queryMap[category] || category, category);
        return NextResponse.json({
          news,
          category: validCategory,
          categories: NEWS_CATEGORIES,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Ação GET inválida. Disponíveis: headlines, search, categories' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS NEWS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notícias' },
      { status: 500 }
    );
  }
}
