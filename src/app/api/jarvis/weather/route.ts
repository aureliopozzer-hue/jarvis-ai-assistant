import { NextRequest, NextResponse } from 'next/server';
import { getZAI } from '@/lib/zai';
import { db } from '@/lib/db';

// ─── Cache duration (15 minutes) ──────────────────────────────────────────
const CACHE_TTL_MS = 15 * 60 * 1000;

// ─── Default Brazilian cities ─────────────────────────────────────────────
const DEFAULT_CITIES = [
  'São Paulo',
  'Rio de Janeiro',
  'Brasília',
  'Salvador',
  'Belo Horizonte',
  'Fortaleza',
  'Curitiba',
  'Recife',
  'Porto Alegre',
  'Manaus',
];

interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  windDirection: string;
  condition: string;
  conditionIcon: string;
  pressure: number;
  visibility: number;
  uvIndex: number;
  updatedAt: string;
}

interface ForecastDay {
  date: string;
  dayOfWeek: string;
  high: number;
  low: number;
  condition: string;
  conditionIcon: string;
  precipitation: number;
}

// ─── Helper: try to get cached data ───────────────────────────────────────
async function getCachedWeather(city: string): Promise<WeatherData | null> {
  try {
    const cached = await db.weatherCache.findUnique({ where: { city } });
    if (cached) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) {
        return JSON.parse(cached.data) as WeatherData;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

// ─── Helper: save weather to cache ────────────────────────────────────────
async function setCachedWeather(city: string, data: WeatherData): Promise<void> {
  try {
    await db.weatherCache.upsert({
      where: { city },
      update: { data: JSON.stringify(data), fetchedAt: new Date() },
      create: { city, data: JSON.stringify(data), fetchedAt: new Date() },
    });
  } catch {
    // Ignore cache errors
  }
}

// ─── Helper: perform web search via ZAI SDK ──────────────────────────────
async function webSearch(query: string): Promise<string> {
  try {
    const zai = await getZAI();
    const searchResults = await zai.functions.invoke('web_search', {
      query,
      num: 10,
    });

    if (Array.isArray(searchResults)) {
      return searchResults
        .map((r: { name?: string; snippet?: string; url?: string }) => `${r.name || ''}: ${r.snippet || ''}`)
        .join('\n');
    }
    return JSON.stringify(searchResults);
  } catch (err) {
    console.error('[JARVIS WEATHER] Web search failed:', err);
    return '';
  }
}

// ─── Helper: fetch weather via ZAI ────────────────────────────────────────
async function fetchCurrentWeather(city: string): Promise<WeatherData> {
  // Use web search to get real weather data
  const searchContext = await webSearch(`current weather ${city} Brazil today temperature humidity wind`);

  const zai = await getZAI();

  // Use chat completion with search context to format weather data
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a weather data extraction assistant. Given search results about weather, extract the weather information and return it as a JSON object with EXACTLY this structure. All temperatures in Celsius. If you cannot find exact values, provide reasonable estimates based on the search results.

{
  "city": "City Name",
  "temperature": 25,
  "feelsLike": 27,
  "humidity": 65,
  "wind": 15,
  "windDirection": "NE",
  "condition": "Partly Cloudy",
  "conditionIcon": "⛅",
  "pressure": 1013,
  "visibility": 10,
  "uvIndex": 6,
  "updatedAt": "2024-01-15T14:00:00Z"
}

Return ONLY the JSON object, no other text.`,
      },
      {
        role: 'user',
        content: searchContext
          ? `Extract current weather data for ${city} from these search results:\n\n${searchContext}`
          : `Provide current estimated weather data for ${city}, Brazil. Use typical values for the current season.`,
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = completion.choices[0]?.message?.content || '';

  // Extract JSON from the response
  let weatherData: WeatherData;
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      weatherData = JSON.parse(jsonMatch[0]) as WeatherData;
    } else {
      throw new Error('No JSON found in response');
    }
  } catch {
    // Fallback with basic data
    weatherData = {
      city,
      temperature: 25,
      feelsLike: 27,
      humidity: 60,
      wind: 10,
      windDirection: 'N',
      condition: 'Clear',
      conditionIcon: '☀️',
      pressure: 1013,
      visibility: 10,
      uvIndex: 5,
      updatedAt: new Date().toISOString(),
    };
  }

  // Ensure city name is correct
  weatherData.city = city;
  weatherData.updatedAt = new Date().toISOString();

  // Save to cache
  await setCachedWeather(city, weatherData);

  return weatherData;
}

// ─── Helper: fetch forecast via ZAI ───────────────────────────────────────
async function fetchForecast(city: string): Promise<ForecastDay[]> {
  const searchContext = await webSearch(`5 day weather forecast ${city} Brazil`);

  const zai = await getZAI();

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a weather forecast extraction assistant. Given search results about a 5-day weather forecast, extract the data and return it as a JSON array with EXACTLY this structure. All temperatures in Celsius.

[
  {
    "date": "2024-01-16",
    "dayOfWeek": "Tuesday",
    "high": 30,
    "low": 22,
    "condition": "Partly Cloudy",
    "conditionIcon": "⛅",
    "precipitation": 20
  }
]

Return an array of 5 days. Return ONLY the JSON array, no other text.`,
      },
      {
        role: 'user',
        content: searchContext
          ? `Extract 5-day forecast for ${city} from these search results:\n\n${searchContext}`
          : `Provide a reasonable 5-day weather forecast for ${city}, Brazil based on typical seasonal patterns.`,
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = completion.choices[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ForecastDay[];
    }
  } catch {
    // Fallback
  }

  // Generate reasonable fallback forecast
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
  const icons = ['☀️', '⛅', '☁️', '🌧️', '🌙'];

  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const condIdx = i % conditions.length;
    return {
      date: date.toISOString().split('T')[0],
      dayOfWeek: days[date.getDay()],
      high: 28 + (i % 4),
      low: 18 + (i % 3),
      condition: conditions[condIdx],
      conditionIcon: icons[condIdx],
      precipitation: (i * 10) % 60,
    };
  });
}

// ─── GET Handler ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const city = searchParams.get('city') || 'São Paulo';

    switch (action) {
      // ── Current weather ──
      case 'current': {
        // Check cache first
        const cached = await getCachedWeather(city);
        if (cached) {
          return NextResponse.json({ weather: cached, cached: true });
        }

        // Fetch fresh data
        const weather = await fetchCurrentWeather(city);
        return NextResponse.json({ weather, cached: false });
      }

      // ── 5-day forecast ──
      case 'forecast': {
        const forecast = await fetchForecast(city);
        return NextResponse.json({ city, forecast });
      }

      // ── Default cities list ──
      case 'cities': {
        // Try to get cached weather for default cities
        const citiesWeather: WeatherData[] = [];
        for (const cityName of DEFAULT_CITIES) {
          const cached = await getCachedWeather(cityName);
          if (cached) {
            citiesWeather.push(cached);
          }
        }
        return NextResponse.json({ cities: DEFAULT_CITIES, cached: citiesWeather });
      }

      default:
        return NextResponse.json(
          { error: 'Ação inválida. Disponíveis: current, forecast, cities' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS WEATHER GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados meteorológicos' },
      { status: 500 }
    );
  }
}
