
export interface DailyPrice {
  date: string;
  close: number;
}

const AV_BASE = 'https://www.alphavantage.co/query';

// Simple in-memory + localStorage cache to avoid burning free tier quota
const memoryCache = new Map<string, { data: DailyPrice[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(symbol: string): string {
  return `av_daily_${symbol}`;
}

function getFromCache(symbol: string): DailyPrice[] | null {
  // Memory cache first
  const mem = memoryCache.get(symbol);
  if (mem && Date.now() - mem.ts < CACHE_TTL) return mem.data;

  // localStorage fallback
  try {
    const raw = localStorage.getItem(cacheKey(symbol));
    if (raw) {
      const parsed = JSON.parse(raw) as { data: DailyPrice[]; ts: number };
      if (Date.now() - parsed.ts < CACHE_TTL) {
        memoryCache.set(symbol, parsed);
        return parsed.data;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function setCache(symbol: string, data: DailyPrice[]) {
  const entry = { data, ts: Date.now() };
  memoryCache.set(symbol, entry);
  try {
    localStorage.setItem(cacheKey(symbol), JSON.stringify(entry));
  } catch { /* quota exceeded, ignore */ }
}

export async function fetchDailyPrices(
  symbol: string,
  apiKey: string
): Promise<DailyPrice[]> {
  const cached = getFromCache(symbol);
  if (cached) return cached;

  const url = `${AV_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Alpha Vantage HTTP ${res.status} for ${symbol}`);
  }

  const json = await res.json();

  // Check for error messages from Alpha Vantage
  if (json['Error Message']) {
    throw new Error(`无法获取 ${symbol} 数据: ${json['Error Message']}`);
  }
  if (json['Note']) {
    throw new Error(`Alpha Vantage 调用频率限制，请稍后再试: ${json['Note']}`);
  }
  if (json['Information']) {
    throw new Error(`Alpha Vantage: ${json['Information']}`);
  }

  const timeSeries = json['Time Series (Daily)'];
  if (!timeSeries) {
    throw new Error(`${symbol}: 未返回时序数据。请检查 ticker 是否正确。`);
  }

  const prices: DailyPrice[] = Object.entries(timeSeries)
    .map(([date, vals]) => ({
      date,
      close: parseFloat((vals as Record<string, string>)['4. close']),
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // chronological order

  setCache(symbol, prices);
  return prices;
}

// Fetch multiple symbols sequentially with a small delay to respect rate limits
// Alpha Vantage free tier: 5 requests/min, 25 requests/day
export async function fetchMultipleDailyPrices(
  symbols: string[],
  apiKey: string,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<Map<string, DailyPrice[]>> {
  const result = new Map<string, DailyPrice[]>();
  const total = symbols.length;

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    onProgress?.(i, total, sym);

    const prices = await fetchDailyPrices(sym, apiKey);
    result.set(sym, prices);

    // Delay between non-cached requests to respect rate limit (5/min)
    // Only delay if we actually hit the API (not cache)
    if (i < symbols.length - 1 && !getFromCache(symbols[i + 1])) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  onProgress?.(total, total, '');
  return result;
}

// Filter prices by period string like "1M", "3M", "1Y", etc.
export function filterByPeriod(prices: DailyPrice[], period: string): DailyPrice[] {
  const tradingDays: Record<string, number> = {
    '1M': 21,
    '3M': 63,
    '6M': 126,
    '1Y': 252,
    '2Y': 504,
    '5Y': 1260,
  };

  const days = tradingDays[period] || 252;
  return prices.slice(-days);
}
