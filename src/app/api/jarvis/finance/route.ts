import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';
import { db } from '@/lib/db';

const GATEWAY_URL = 'https://internal-api.z.ai';
const API_PREFIX = '/external/finance';

// ─── Finance API Proxy Helper ──────────────────────────────────────────

async function financeFetch(endpoint: string): Promise<unknown> {
  const url = `${GATEWAY_URL}${API_PREFIX}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'X-Z-AI-From': 'Z' },
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Finance API error: ${response.status}`);
  }
  return response.json();
}

// ─── Format snapshot quote data ────────────────────────────────────────

interface RawQuote {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: { raw?: number; fmt?: string };
  regularMarketChange?: { raw?: number; fmt?: string };
  regularMarketChangePercent?: { raw?: number; fmt?: string };
  regularMarketVolume?: { raw?: number; fmt?: string };
  marketCap?: { raw?: number; fmt?: string };
  currency?: string;
  exchange?: string;
  [key: string]: unknown;
}

function formatQuote(raw: RawQuote) {
  return {
    ticker: raw.symbol || '',
    name: raw.shortName || raw.longName || raw.symbol || '',
    price: raw.regularMarketPrice?.raw ?? 0,
    change: raw.regularMarketChange?.raw ?? 0,
    changePercent: raw.regularMarketChangePercent?.raw ?? 0,
    currency: raw.currency || 'USD',
    exchange: raw.exchange || '',
    marketCap: raw.marketCap?.raw,
    volume: raw.regularMarketVolume?.raw,
  };
}

// ─── GET Handler ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      // ── Quotes: batch snapshot for multiple tickers ──
      case 'quotes': {
        const tickersParam = searchParams.get('tickers') || '^GSPC,^DJI,^IXIC,^BVSP,BTC-USD';
        try {
          const data = await financeFetch(`/v1/markets/stock/quotes?ticker=${encodeURIComponent(tickersParam)}`);
          const body = data as { body?: RawQuote[] };
          const quotes = Array.isArray(body?.body)
            ? body.body.map(formatQuote)
            : [];
          return NextResponse.json({ quotes });
        } catch {
          return NextResponse.json({ quotes: [] });
        }
      }

      // ── Snapshot: alias for quotes with ticker param ──
      case 'snapshot': {
        const ticker = searchParams.get('ticker') || '^GSPC,^DJI,^IXIC,^BVSP,BTC-USD';
        try {
          const data = await financeFetch(`/v1/markets/stock/quotes?ticker=${encodeURIComponent(ticker)}`);
          const body = data as { body?: RawQuote[] };
          const quotes = Array.isArray(body?.body)
            ? body.body.map(formatQuote)
            : [];
          return NextResponse.json({ snapshot: quotes });
        } catch {
          return NextResponse.json({ snapshot: [] });
        }
      }

      // ── Single quote ──
      case 'quote': {
        const ticker = searchParams.get('ticker');
        const type = searchParams.get('type') || 'STOCKS';
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker obrigatório' }, { status: 400 });
        }
        try {
          const data = await financeFetch(`/v1/markets/stock/quotes?ticker=${encodeURIComponent(ticker)}`);
          const body = data as { body?: RawQuote[] };
          const quotes = Array.isArray(body?.body) ? body.body : [];
          if (quotes.length > 0) {
            const q = formatQuote(quotes[0]) as Record<string, unknown>;
            // Also try to get statistics for more detail
            try {
              const statsData = await financeFetch(`/v1/markets/stock/modules?ticker=${encodeURIComponent(ticker)}&module=statistics`) as { statistics?: Record<string, unknown> };
              const stats = statsData?.statistics || {};
              const finData = (stats as Record<string, Record<string, { raw?: number }>>);
              q.pe = finData?.trailingPE?.raw;
              q.eps = finData?.trailingEps?.raw;
              q.week52High = finData?.fiftyTwoWeekHigh?.raw;
              q.week52Low = finData?.fiftyTwoWeekLow?.raw;
            } catch {
              // stats optional
            }
            void type;
            return NextResponse.json({ quote: q });
          }
          return NextResponse.json({ quote: null });
        } catch {
          return NextResponse.json({ quote: null });
        }
      }

      // ── News ──
      case 'news': {
        const ticker = searchParams.get('ticker');
        try {
          let endpoint = '/v1/markets/news';
          if (ticker) {
            endpoint += `?ticker=${encodeURIComponent(ticker)}`;
          }
          const data = await financeFetch(endpoint);
          const body = data as { body?: Array<{ uuid?: string; title?: string; publisher?: string; link?: string; summary?: string; relatedTickers?: string[]; providerPublishTime?: number }> };
          const rawNews = Array.isArray(body?.body) ? body.body : [];
          const news = rawNews.slice(0, 20).map((n) => ({
            id: n.uuid || String(Math.random()),
            title: n.title || '',
            source: n.publisher || '',
            url: n.link || '',
            snippet: (n.summary || '').slice(0, 200),
            tickers: n.relatedTickers || [],
            publishedAt: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : new Date().toISOString(),
          }));
          return NextResponse.json({ news });
        } catch {
          return NextResponse.json({ news: [] });
        }
      }

      // ── History: historical price data ──
      case 'history': {
        const symbol = searchParams.get('symbol');
        const interval = searchParams.get('interval') || '1d';
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol obrigatório' }, { status: 400 });
        }
        try {
          const data = await financeFetch(`/v1/markets/stock/history?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`);
          return NextResponse.json({ history: data });
        } catch {
          return NextResponse.json({ history: null });
        }
      }

      // ── Profile: company profile ──
      case 'profile': {
        const ticker = searchParams.get('ticker');
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker obrigatório' }, { status: 400 });
        }
        try {
          const data = await financeFetch(`/v1/markets/stock/modules?ticker=${encodeURIComponent(ticker)}&module=assetProfile`);
          return NextResponse.json({ profile: data });
        } catch {
          return NextResponse.json({ profile: null });
        }
      }

      // ── Financials: financial statements ──
      case 'financials': {
        const ticker = searchParams.get('ticker');
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker obrigatório' }, { status: 400 });
        }
        try {
          const data = await financeFetch(`/v1/markets/stock/modules?ticker=${encodeURIComponent(ticker)}&module=financialData`);
          return NextResponse.json({ financials: data });
        } catch {
          return NextResponse.json({ financials: null });
        }
      }

      // ── Statistics: key statistics ──
      case 'statistics': {
        const ticker = searchParams.get('ticker');
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker obrigatório' }, { status: 400 });
        }
        try {
          const data = await financeFetch(`/v1/markets/stock/modules?ticker=${encodeURIComponent(ticker)}&module=statistics`);
          return NextResponse.json({ statistics: data });
        } catch {
          return NextResponse.json({ statistics: null });
        }
      }

      // ── Earnings: earnings data ──
      case 'earnings': {
        const ticker = searchParams.get('ticker');
        if (!ticker) {
          return NextResponse.json({ error: 'Ticker obrigatório' }, { status: 400 });
        }
        try {
          const data = await financeFetch(`/v1/markets/stock/modules?ticker=${encodeURIComponent(ticker)}&module=earnings`);
          return NextResponse.json({ earnings: data });
        } catch {
          return NextResponse.json({ earnings: null });
        }
      }

      // ── Watchlist (from DB + live quotes) ──
      case 'watchlist': {
        try {
          const items = await db.financeWatchlist.findMany({ orderBy: { createdAt: 'desc' } });
          const watchlist = items.map((item) => ({
            id: item.id,
            ticker: item.ticker,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            avgPrice: item.avgPrice,
            notes: item.notes,
          }));

          // Also fetch live quotes for watchlist tickers
          if (watchlist.length > 0) {
            try {
              const tickerStr = watchlist.map((w) => w.ticker).join(',');
              const data = await financeFetch(`/v1/markets/stock/quotes?ticker=${encodeURIComponent(tickerStr)}`);
              const body = data as { body?: RawQuote[] };
              const quotes = Array.isArray(body?.body) ? body.body : [];
              // Merge live quotes into watchlist
              const quoteMap = new Map(quotes.map((q) => [q.symbol, formatQuote(q)]));
              const enriched = watchlist.map((w) => ({
                ...w,
                ...quoteMap.get(w.ticker),
              }));
              return NextResponse.json({ watchlist: enriched });
            } catch {
              // Return without live quotes
            }
          }

          return NextResponse.json({ watchlist });
        } catch {
          return NextResponse.json({ watchlist: [] });
        }
      }

      // ── Alerts (from DB) ──
      case 'alerts': {
        try {
          const alerts = await db.financeAlert.findMany({ orderBy: { createdAt: 'desc' } });
          const formatted = alerts.map((a) => ({
            id: a.id,
            ticker: a.ticker,
            type: a.type,
            value: a.value,
            isActive: a.isActive,
            active: a.isActive,
            triggered: a.triggered,
            createdAt: a.createdAt.toISOString(),
          }));
          return NextResponse.json({ alerts: formatted });
        } catch {
          return NextResponse.json({ alerts: [] });
        }
      }

      // ── Search stocks ──
      case 'search': {
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json({ results: [] });
        }
        try {
          const data = await financeFetch(`/v1/markets/search?search=${encodeURIComponent(query)}`);
          const body = data as { body?: Array<{ symbol?: string; shortname?: string; longname?: string; typeDisp?: string; exchange?: string }> };
          const raw = Array.isArray(body?.body) ? body.body : [];
          const results = raw.slice(0, 10).map((r) => ({
            ticker: r.symbol || '',
            name: r.shortname || r.longname || r.symbol || '',
            price: 0,
            change: 0,
            changePercent: 0,
            currency: 'USD',
          }));
          return NextResponse.json({ results });
        } catch {
          return NextResponse.json({ results: [] });
        }
      }

      // ── Briefing: GET version for quick access ──
      case 'briefing': {
        // 1. Fetch major indices snapshots
        let indicesData: unknown = null;
        try {
          indicesData = await financeFetch(`/v1/markets/stock/quotes?ticker=${encodeURIComponent('^GSPC,^DJI,^IXIC,^BVSP,BTC-USD')}`);
        } catch (err) {
          console.error('[JARVIS FINANCE] Failed to fetch indices:', err);
        }

        // 2. Fetch market news
        let newsData: unknown[] = [];
        try {
          const newsResult = await financeFetch('/v1/markets/news');
          const newsBody = newsResult as { body?: unknown[] };
          newsData = Array.isArray(newsBody?.body) ? newsBody.body : [];
        } catch (err) {
          console.error('[JARVIS FINANCE] Failed to fetch news:', err);
        }

        // 3. Use ZAI to generate a Portuguese briefing
        let briefingText = 'Não foi possível gerar o briefing no momento.';
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';

        try {
          const zai = await getZAI();
          const briefingPrompt = `Você é J.A.R.V.I.S. Gerando briefing diário do mercado financeiro. Dados atuais:

Índices: ${JSON.stringify(indicesData)}
Notícias: ${JSON.stringify(newsData.slice(0, 5))}

Gere um briefing completo em português brasileiro com:
1. Panorama geral do mercado (alta/baixa/volatilidade)
2. Principais índices e suas variações (S&P 500, Dow Jones, Nasdaq, Bovespa, Bitcoin)
3. Destaque de 3 notícias mais relevantes
4. Recomendação geral (não é conselho financeiro)
5. Ações brasileiras se houver dados do Bovespa

Use um tom profissional mas acessível, como um assistente financeiro de elite.
No final, classifique o sentimento geral do mercado como: POSITIVO, NEGATIVO ou NEUTRO.`;

          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'Você é um assistente financeiro JARVIS que gera briefings diários de mercado. Responda em português brasileiro.' },
              { role: 'user', content: briefingPrompt },
            ],
            thinking: { type: 'disabled' },
          });

          briefingText = completion.choices[0]?.message?.content || briefingText;

          // Determine sentiment from the text
          const lowerText = briefingText.toLowerCase();
          if (lowerText.includes('sentimento: positivo') || (lowerText.includes('positivo') && !lowerText.includes('não positivo'))) {
            sentiment = 'positive';
          } else if (lowerText.includes('sentimento: negativo') || (lowerText.includes('negativo') && !lowerText.includes('não negativo'))) {
            sentiment = 'negative';
          }
        } catch (err) {
          console.error('[JARVIS FINANCE] Failed to generate briefing:', err);
          briefingText = 'Erro ao gerar briefing com IA. Tente novamente em alguns instantes.';
        }

        return NextResponse.json({
          briefing: {
            text: briefingText,
            sentiment,
            generatedAt: new Date().toISOString(),
          },
          indices: indicesData,
          news: newsData.slice(0, 10),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Ação inválida. Disponíveis: quotes, snapshot, quote, news, history, profile, financials, statistics, earnings, watchlist, alerts, search, briefing' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS FINANCE GET ERROR]', error);
    return NextResponse.json({ error: 'Erro ao buscar dados financeiros' }, { status: 500 });
  }
}

// ─── POST Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ── Generate AI Briefing ──
      case 'briefing': {
        // 1. Fetch major indices snapshots
        let indicesData: unknown = null;
        try {
          indicesData = await financeFetch(`/v1/markets/stock/quotes?ticker=${encodeURIComponent('^GSPC,^DJI,^IXIC,^BVSP,BTC-USD')}`);
        } catch (err) {
          console.error('[JARVIS FINANCE] Failed to fetch indices:', err);
        }

        // 2. Fetch market news
        let newsData: unknown[] = [];
        try {
          const newsResult = await financeFetch('/v1/markets/news');
          const newsBody = newsResult as { body?: unknown[] };
          newsData = Array.isArray(newsBody?.body) ? newsBody.body : [];
        } catch (err) {
          console.error('[JARVIS FINANCE] Failed to fetch news:', err);
        }

        // 3. Use ZAI to generate a Portuguese briefing
        let briefingText = 'Não foi possível gerar o briefing no momento.';
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';

        try {
          const zai = await getZAI();
          const briefingPrompt = `Você é J.A.R.V.I.S. Gerando briefing diário do mercado financeiro. Dados atuais:

Índices: ${JSON.stringify(indicesData)}
Notícias: ${JSON.stringify(newsData.slice(0, 5))}

Gere um briefing completo em português brasileiro com:
1. Panorama geral do mercado (alta/baixa/volatilidade)
2. Principais índices e suas variações (S&P 500, Dow Jones, Nasdaq, Bovespa, Bitcoin)
3. Destaque de 3 notícias mais relevantes
4. Recomendação geral (não é conselho financeiro)
5. Ações brasileiras se houver dados do Bovespa

Use um tom profissional mas acessível, como um assistente financeiro de elite.
No final, classifique o sentimento geral do mercado como: POSITIVO, NEGATIVO ou NEUTRO.`;

          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'Você é um assistente financeiro JARVIS que gera briefings diários de mercado. Responda em português brasileiro.' },
              { role: 'user', content: briefingPrompt },
            ],
            thinking: { type: 'disabled' },
          });

          briefingText = completion.choices[0]?.message?.content || briefingText;

          // Determine sentiment from the text
          const lowerText = briefingText.toLowerCase();
          if (lowerText.includes('sentimento: positivo') || (lowerText.includes('positivo') && !lowerText.includes('não positivo'))) {
            sentiment = 'positive';
          } else if (lowerText.includes('sentimento: negativo') || (lowerText.includes('negativo') && !lowerText.includes('não negativo'))) {
            sentiment = 'negative';
          }
        } catch (err) {
          console.error('[JARVIS FINANCE] Failed to generate briefing:', err);
          briefingText = 'Erro ao gerar briefing com IA. Tente novamente em alguns instantes.';
        }

        return NextResponse.json({
          briefing: {
            text: briefingText,
            sentiment,
            generatedAt: new Date().toISOString(),
          },
        });
      }

      // ── Add to watchlist ──
      case 'add_watchlist': {
        const { ticker, name, quantity, avgCost, type } = body;
        if (!ticker || !name) {
          return NextResponse.json({ error: 'Ticker e nome são obrigatórios' }, { status: 400 });
        }
        const item = await db.financeWatchlist.upsert({
          where: { ticker },
          update: {
            name,
            type: type || 'STOCKS',
            quantity: quantity ?? undefined,
            avgPrice: avgCost ?? undefined,
          },
          create: {
            ticker,
            name,
            type: type || 'STOCKS',
            quantity: quantity ?? null,
            avgPrice: avgCost ?? null,
          },
        });
        return NextResponse.json({
          item: {
            id: item.id,
            ticker: item.ticker,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            avgPrice: item.avgPrice,
            avgCost: item.avgPrice,
          },
        });
      }

      // ── Remove from watchlist ──
      case 'remove_watchlist': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }
        await db.financeWatchlist.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ── Create alert ──
      case 'create_alert': {
        const { ticker, type, value } = body;
        if (!ticker || !type || value === undefined) {
          return NextResponse.json({ error: 'Ticker, tipo e valor são obrigatórios' }, { status: 400 });
        }
        const validTypes = ['above', 'below', 'change_percent'];
        if (!validTypes.includes(type)) {
          return NextResponse.json({ error: `Tipo inválido. Use: ${validTypes.join(', ')}` }, { status: 400 });
        }
        const alert = await db.financeAlert.create({
          data: {
            ticker,
            type,
            value: Number(value),
            isActive: true,
            triggered: false,
          },
        });
        return NextResponse.json({
          alert: {
            id: alert.id,
            ticker: alert.ticker,
            type: alert.type,
            value: alert.value,
            active: alert.isActive,
            isActive: alert.isActive,
            triggered: alert.triggered,
            createdAt: alert.createdAt.toISOString(),
          },
        });
      }

      // ── Delete alert ──
      case 'delete_alert': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }
        await db.financeAlert.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ── Toggle alert ──
      case 'toggle_alert': {
        const { id, active } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }
        const alert = await db.financeAlert.update({
          where: { id },
          data: { isActive: Boolean(active) },
        });
        return NextResponse.json({
          alert: {
            id: alert.id,
            ticker: alert.ticker,
            type: alert.type,
            value: alert.value,
            active: alert.isActive,
            isActive: alert.isActive,
            triggered: alert.triggered,
            createdAt: alert.createdAt.toISOString(),
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Ação POST inválida. Disponíveis: briefing, add_watchlist, remove_watchlist, create_alert, delete_alert, toggle_alert' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS FINANCE POST ERROR]', error);
    return NextResponse.json({ error: 'Erro ao processar dados financeiros' }, { status: 500 });
  }
}
