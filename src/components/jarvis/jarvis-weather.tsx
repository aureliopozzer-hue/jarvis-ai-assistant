'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Search,
  RefreshCw,
  Volume2,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useJarvisStore, type WeatherData } from '@/lib/jarvis-store';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';

// ─── Helpers ───────────────────────────────────────────────────────────

function getWeatherIcon(condition: string, size = 'h-8 w-8') {
  const c = condition.toLowerCase();
  if (c.includes('thunder') || c.includes('storm')) return <CloudLightning className={`${size} text-yellow-400`} />;
  if (c.includes('snow') || c.includes('ice')) return <CloudSnow className={`${size} text-blue-300`} />;
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className={`${size} text-blue-400`} />;
  if (c.includes('cloud') || c.includes('overcast')) return <Cloud className={`${size} text-gray-400`} />;
  if (c.includes('sun') || c.includes('clear')) return <Sun className={`${size} text-yellow-400`} />;
  return <Cloud className={`${size} text-jarvis-cyan/60`} />;
}

function getForecastIcon(condition: string) {
  return getWeatherIcon(condition, 'h-4 w-4');
}

function formatTemp(temp: number): string {
  return `${Math.round(temp)}°C`;
}

// ─── Skeleton Card ────────────────────────────────────────────────────

function WeatherSkeleton() {
  return (
    <div className="jarvis-panel p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg bg-jarvis-cyan/10" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-jarvis-cyan/10" />
          <Skeleton className="h-3 w-24 bg-jarvis-cyan/10" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 bg-jarvis-cyan/10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-24 bg-jarvis-cyan/10" />
          <Skeleton className="h-3 w-20 bg-jarvis-cyan/10" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-jarvis-cyan/10" />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg bg-jarvis-cyan/10" />
        ))}
      </div>
    </div>
  );
}

// ─── Current Weather Section ──────────────────────────────────────────

function CurrentWeatherSection({ data }: { data: WeatherData }) {
  const { speak, isSpeaking } = useJarvisVoice();

  const handleBriefing = useCallback(() => {
    const text = `Clima em ${data.city}: ${data.condition}, ${Math.round(data.temperature)} graus. Sensação térmica de ${Math.round(data.feelsLike)} graus. Umidade ${data.humidity} por cento. Vento a ${data.windSpeed} quilômetros por hora.`;
    speak(text);
  }, [data, speak]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="jarvis-panel p-4"
    >
      {/* City & Condition */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-jarvis-cyan/10">
            {getWeatherIcon(data.condition, 'h-6 w-6')}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-jarvis-cyan/60" />
              <h3 className="text-sm font-semibold text-foreground/80">{data.city}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground/50">{data.condition}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBriefing}
          disabled={isSpeaking}
          className="h-7 w-7 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Temperature */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-bold text-foreground/90 tabular-nums">
          {formatTemp(data.temperature)}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Thermometer className="h-3.5 w-3.5 text-jarvis-cyan/50" />
            <span className="text-xs text-muted-foreground/50">
              Sensação: {formatTemp(data.feelsLike)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-3.5 w-3.5 text-jarvis-cyan/50" />
            <span className="text-xs text-muted-foreground/50">
              Umidade: {data.humidity}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5 text-jarvis-cyan/50" />
            <span className="text-xs text-muted-foreground/50">
              Vento: {data.windSpeed} km/h
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-jarvis-dark/50 border border-jarvis-border/10 p-2.5 text-center">
          <Droplets className="h-4 w-4 text-blue-400/60 mx-auto mb-1" />
          <p className="text-xs font-medium text-foreground/70">{data.humidity}%</p>
          <p className="text-[9px] text-muted-foreground/40">Umidade</p>
        </div>
        <div className="rounded-lg bg-jarvis-dark/50 border border-jarvis-border/10 p-2.5 text-center">
          <Wind className="h-4 w-4 text-emerald-400/60 mx-auto mb-1" />
          <p className="text-xs font-medium text-foreground/70">{data.windSpeed}</p>
          <p className="text-[9px] text-muted-foreground/40">km/h</p>
        </div>
        <div className="rounded-lg bg-jarvis-dark/50 border border-jarvis-border/10 p-2.5 text-center">
          <Thermometer className="h-4 w-4 text-orange-400/60 mx-auto mb-1" />
          <p className="text-xs font-medium text-foreground/70">{formatTemp(data.feelsLike)}</p>
          <p className="text-[9px] text-muted-foreground/40">Sensação</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Forecast Section ─────────────────────────────────────────────────

function ForecastSection({ forecast }: { forecast: WeatherData['forecast'] }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="jarvis-panel p-4"
    >
      <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60 mb-3 block">
        PREVISÃO 5 DIAS
      </span>
      <div className="grid grid-cols-5 gap-2">
        {forecast.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg bg-jarvis-dark/50 border border-jarvis-border/10 p-2 text-center"
          >
            <p className="text-[10px] font-medium text-muted-foreground/50 mb-1.5">{day.day}</p>
            <div className="flex justify-center mb-1.5">
              {getForecastIcon(day.condition)}
            </div>
            <p className="text-xs font-bold text-foreground/80">{formatTemp(day.high)}</p>
            <p className="text-[10px] text-muted-foreground/40">{formatTemp(day.low)}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Weather Panel Component ─────────────────────────────────────

export function JarvisWeather() {
  const { weatherData, isLoadingWeather, loadWeather } = useJarvisStore();
  const [cityInput, setCityInput] = useState('São Paulo');
  const [forecast, setForecast] = useState<Array<{ day: string; high: number; low: number; condition: string }>>([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  const loadForecast = useCallback(async (city: string) => {
    setIsLoadingForecast(true);
    try {
      const response = await fetch(`/api/jarvis/weather?action=forecast&city=${encodeURIComponent(city)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.forecast) {
          setForecast(data.forecast.map((d: { dayOfWeek?: string; date?: string; high: number; low: number; condition: string }) => ({
            day: d.dayOfWeek || (d.date ? new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' }) : '?'),
            high: d.high,
            low: d.low,
            condition: d.condition,
          })));
        }
      }
    } catch {
      // Forecast is optional
    } finally {
      setIsLoadingForecast(false);
    }
  }, []);

  useEffect(() => {
    loadWeather('São Paulo');
    loadForecast('São Paulo');
  }, [loadWeather, loadForecast]);

  const handleSearch = useCallback(() => {
    if (cityInput.trim()) {
      loadWeather(cityInput.trim());
      loadForecast(cityInput.trim());
    }
  }, [cityInput, loadWeather, loadForecast]);

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <Cloud className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Clima
          </h2>
          <p className="text-xs text-muted-foreground">
            Previsão do tempo e condições atuais
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { loadWeather(weatherData?.city || 'São Paulo'); loadForecast(weatherData?.city || 'São Paulo'); }}
          className="h-8 w-8 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingWeather ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* City Search */}
      <div className="flex gap-2 mb-4">
        <Input
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Buscar cidade..."
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          disabled={isLoadingWeather}
          size="sm"
          className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 px-3"
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 jarvis-scrollbar">
        <div className="space-y-4 pr-2">
          {isLoadingWeather && !weatherData ? (
            <WeatherSkeleton />
          ) : weatherData ? (
            <>
              <CurrentWeatherSection data={weatherData} />
              <ForecastSection forecast={forecast} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Cloud className="h-12 w-12 text-jarvis-cyan/10 mb-3" />
              <p className="text-sm text-muted-foreground/30 mb-1">
                Nenhum dado climático disponível
              </p>
              <p className="text-[10px] text-muted-foreground/20">
                Busque uma cidade para ver a previsão
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
