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
 * 获取实时报价 - 使用 CORS 代理
 */
export async function getQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    // 使用公共 CORS 代理
    const proxyUrl = 'https://corsproxy.io/?';
    const url = `${proxyUrl}${encodeURIComponent(`${YAHOO_QUOTE_API}?symbols=${symbol}`)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data?.quoteResponse?.result?.[0];

    if (!quote) return null;

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

export default {
  getQuote,
  formatQuoteForAI,
};
