// Yahoo Finance API Service
// 通过公开接口获取实时数据（浏览器兼容）

const YAHOO_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QUOTE_API = 'https://query1.finance.yahoo.com/v7/finance/quote';

export interface YahooQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  trailingPE: number;
  forwardPE: number;
  priceToBook: number;
  trailingEps: number;
  forwardEps: number;
  bookValue: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  sharesOutstanding: number;
  beta: number;
  dividendYield: number;
}

/**
 * 获取实时报价 - 通过 Vercel API 路由
 */
export async function getQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    // 使用 Vercel serverless function 代理请求
    const url = `/api/quote?symbol=${encodeURIComponent(symbol)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const quote = await response.json();

    if (!quote || !quote.symbol) return null;

    return {
      symbol: quote.symbol,
      shortName: quote.shortName || quote.symbol,
      longName: quote.longName || quote.shortName || quote.symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      regularMarketVolume: quote.regularMarketVolume,
      regularMarketDayHigh: quote.regularMarketDayHigh,
      regularMarketDayLow: quote.regularMarketDayLow,
      regularMarketOpen: quote.regularMarketOpen,
      regularMarketPreviousClose: quote.regularMarketPreviousClose,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      marketCap: quote.marketCap,
      trailingPE: quote.trailingPE,
      forwardPE: quote.forwardPE,
      priceToBook: quote.priceToBook,
      trailingEps: quote.trailingEps,
      forwardEps: quote.forwardEps,
      bookValue: quote.bookValue,
      fiftyDayAverage: quote.fiftyDayAverage,
      twoHundredDayAverage: quote.twoHundredDayAverage,
      sharesOutstanding: quote.sharesOutstanding,
      beta: quote.beta,
      dividendYield: quote.dividendYield,
    };
  } catch (err) {
    console.error(`Yahoo Finance quote error for ${symbol}:`, err);
    return null;
  }
}

/**
 * 格式化报价数据为 AI 可读文本
 */
export function formatQuoteForAI(quote: YahooQuote): string {
  if (!quote) return '无法获取数据';

  const formatNum = (n: number | undefined, decimals = 2) =>
    n !== undefined && !isNaN(n) ? n.toFixed(decimals) : 'N/A';

  const formatPct = (n: number | undefined) =>
    n !== undefined && !isNaN(n) ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : 'N/A';

  const formatMarketCap = (n: number | undefined) => {
    if (!n || isNaN(n)) return 'N/A';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  return `## ${quote.longName} (${quote.symbol}) - 实时数据

### 实时行情 (Yahoo Finance)
- **当前价格**: $${formatNum(quote.regularMarketPrice)}
- **涨跌**: ${formatNum(quote.regularMarketChange)} (${formatPct(quote.regularMarketChangePercent)})
- **今日区间**: $${formatNum(quote.regularMarketDayLow)} - $${formatNum(quote.regularMarketDayHigh)}
- **开盘价**: $${formatNum(quote.regularMarketOpen)}
- **昨收**: $${formatNum(quote.regularMarketPreviousClose)}
- **成交量**: ${quote.regularMarketVolume?.toLocaleString() || 'N/A'}

### 估值指标
- **市值**: ${formatMarketCap(quote.marketCap)}
- **P/E (TTM)**: ${formatNum(quote.trailingPE)}
- **P/E (Forward)**: ${formatNum(quote.forwardPE)}
- **P/B**: ${formatNum(quote.priceToBook)}

### 每股数据
- **EPS (TTM)**: $${formatNum(quote.trailingEps)}
- **EPS (Forward)**: $${formatNum(quote.forwardEps)}
- **每股净资产**: $${formatNum(quote.bookValue)}

### 技术指标
- **52周高/低**: $${formatNum(quote.fiftyTwoWeekHigh)} / $${formatNum(quote.fiftyTwoWeekLow)}
- **50日均线**: $${formatNum(quote.fiftyDayAverage)}
- **200日均线**: $${formatNum(quote.twoHundredDayAverage)}
- **Beta**: ${formatNum(quote.beta)}

### 其他
- **股息率**: ${quote.dividendYield ? formatPct(quote.dividendYield * 100) : '无股息'}
- **流通股数**: ${quote.sharesOutstanding ? (quote.sharesOutstanding / 1e9).toFixed(2) + 'B' : 'N/A'}

---
*数据来源: Yahoo Finance (实时)*`;
}

/**
 * 获取历史价格数据 - 通过 Vercel API 路由
 */
export interface HistoricalData {
  symbol: string;
  currency: string;
  exchangeName: string;
  regularMarketPrice: number;
  timestamps: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  adjClose: number[];
  dataPoints: number;
}

export async function getHistoricalData(
  symbol: string,
  range: string = '3y',
  interval: string = '1d'
): Promise<HistoricalData | null> {
  try {
    const url = `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Yahoo Finance chart error for ${symbol}:`, err);
    return null;
  }
}

/**
 * 格式化历史数据为 AI 可读的摘要
 */
export function formatHistoricalDataForAI(data: HistoricalData): string {
  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return '无法获取历史数据';
  }

  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('zh-CN');
  const formatNum = (n: number | undefined, decimals = 2) =>
    n !== undefined && !isNaN(n) ? n.toFixed(decimals) : 'N/A';

  // 计算关键统计数据
  const closes = data.close.filter(c => c !== null && !isNaN(c));
  const latestClose = closes[closes.length - 1];
  const firstClose = closes[0];
  const totalReturn = ((latestClose - firstClose) / firstClose * 100);

  // 最高/最低价
  const highs = data.high.filter(h => h !== null && !isNaN(h));
  const lows = data.low.filter(l => l !== null && !isNaN(l));
  const periodHigh = Math.max(...highs);
  const periodLow = Math.min(...lows);

  // 年化收益率 (假设3年数据)
  const years = data.dataPoints / 252; // 交易日
  const annualizedReturn = (Math.pow(latestClose / firstClose, 1 / years) - 1) * 100;

  // 波动率计算 (简化版)
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] && closes[i - 1]) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const dailyVol = Math.sqrt(variance);
  const annualizedVol = dailyVol * Math.sqrt(252) * 100;

  // 获取最近的数据点时间
  const latestDate = formatDate(data.timestamps[data.timestamps.length - 1]);
  const firstDate = formatDate(data.timestamps[0]);

  return `## ${data.symbol} 历史数据分析

### 数据范围
- **起始日期**: ${firstDate}
- **截止日期**: ${latestDate}
- **数据点数**: ${data.dataPoints} 个交易日

### 价格表现
- **起始价格**: $${formatNum(firstClose)}
- **最新价格**: $${formatNum(latestClose)}
- **区间最高**: $${formatNum(periodHigh)}
- **区间最低**: $${formatNum(periodLow)}

### 收益统计
- **累计收益**: ${formatNum(totalReturn)}%
- **年化收益**: ${formatNum(annualizedReturn)}%
- **年化波动率**: ${formatNum(annualizedVol)}%

---
*数据来源: Yahoo Finance 历史数据*`;
}

/**
 * 技术指标数据类型
 */
export interface TechnicalData {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  performance: {
    '1d': number | null;
    '1w': number | null;
    '1m': number | null;
    '3m': number | null;
    '1y': number | null;
    'ytd': number | null;
  };
  bollingerBands: {
    daily: {
      upper: number;
      middle: number;
      lower: number;
      position: number;
    };
    weekly: {
      upper: number;
      middle: number;
      lower: number;
      position: number;
    };
  };
  alerts: string[];
  timestamp: number;
}

/**
 * 获取技术指标数据 - 通过 Vercel API 路由
 */
export async function getTechnicalData(symbol: string): Promise<TechnicalData | null> {
  try {
    const url = `/api/technical?symbol=${encodeURIComponent(symbol)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Technical data fetch error for ${symbol}:`, err);
    return null;
  }
}

/**
 * 格式化技术指标数据为 AI 可读文本
 */
export function formatTechnicalDataForAI(data: TechnicalData): string {
  if (!data) return '无法获取技术指标数据';

  const formatNum = (n: number | null | undefined, decimals = 2) =>
    n !== null && n !== undefined && !isNaN(n) ? n.toFixed(decimals) : 'N/A';

  const formatPct = (n: number | null | undefined) => {
    if (n === null || n === undefined || isNaN(n)) return 'N/A';
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
  };

  const getBBStatus = (position: number): string => {
    if (position > 95) return '触及上轨 (极度超买)';
    if (position > 80) return '接近上轨 (超买)';
    if (position > 60) return '上半区';
    if (position > 40) return '中轨附近';
    if (position > 20) return '下半区';
    if (position > 5) return '接近下轨 (超卖)';
    return '触及下轨 (极度超卖)';
  };

  let alertText = '';
  if (data.alerts && data.alerts.length > 0) {
    alertText = `\n### 技术警报\n${data.alerts.map(a => `- ${a}`).join('\n')}`;
  }

  return `## ${data.symbol} 技术分析数据

### 实时价格
- **当前价格**: $${formatNum(data.currentPrice)}
- **昨收**: $${formatNum(data.previousClose)}
- **日涨跌**: ${formatPct(data.performance['1d'])}

### 多周期涨跌幅
| 周期 | 涨跌幅 |
|------|--------|
| 1日 | ${formatPct(data.performance['1d'])} |
| 1周 | ${formatPct(data.performance['1w'])} |
| 1月 | ${formatPct(data.performance['1m'])} |
| 3月 | ${formatPct(data.performance['3m'])} |
| 1年 | ${formatPct(data.performance['1y'])} |
| YTD | ${formatPct(data.performance['ytd'])} |

### 布林带分析 (20日, 2倍标准差)

**日线布林带:**
- 上轨: $${formatNum(data.bollingerBands.daily.upper)}
- 中轨: $${formatNum(data.bollingerBands.daily.middle)}
- 下轨: $${formatNum(data.bollingerBands.daily.lower)}
- 当前位置: ${formatNum(data.bollingerBands.daily.position, 0)}% (${getBBStatus(data.bollingerBands.daily.position)})

**周线布林带:**
- 上轨: $${formatNum(data.bollingerBands.weekly.upper)}
- 中轨: $${formatNum(data.bollingerBands.weekly.middle)}
- 下轨: $${formatNum(data.bollingerBands.weekly.lower)}
- 当前位置: ${formatNum(data.bollingerBands.weekly.position, 0)}% (${getBBStatus(data.bollingerBands.weekly.position)})
${alertText}

---
*数据来源: Yahoo Finance (实时计算)*`;
}

export default {
  getQuote,
  formatQuoteForAI,
  getHistoricalData,
  formatHistoricalDataForAI,
  getTechnicalData,
  formatTechnicalDataForAI,
};
