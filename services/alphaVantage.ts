
// Alpha Vantage API Service
// 免费 25次/天，申请: https://www.alphavantage.co/support/#api-key

const AV_BASE_URL = 'https://www.alphavantage.co/query';

const getApiKey = () => import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo';

interface AVResponse {
  [key: string]: any;
}

async function fetchAV(params: Record<string, string>): Promise<AVResponse | null> {
  const apiKey = getApiKey();
  const searchParams = new URLSearchParams({ ...params, apikey: apiKey });

  try {
    const response = await fetch(`${AV_BASE_URL}?${searchParams}`);
    if (!response.ok) throw new Error(`AV API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
    return null;
  }
}

/**
 * 获取实时报价
 */
export async function getQuote(symbol: string) {
  const data = await fetchAV({
    function: 'GLOBAL_QUOTE',
    symbol: symbol.toUpperCase(),
  });

  if (!data?.['Global Quote']) return null;

  const q = data['Global Quote'];
  return {
    symbol: q['01. symbol'],
    price: parseFloat(q['05. price']),
    change: parseFloat(q['09. change']),
    changePercent: q['10. change percent'],
    volume: parseInt(q['06. volume']),
    latestTradingDay: q['07. latest trading day'],
  };
}

/**
 * 获取公司概况
 */
export async function getOverview(symbol: string) {
  return await fetchAV({
    function: 'OVERVIEW',
    symbol: symbol.toUpperCase(),
  });
}

/**
 * 获取收入报表
 */
export async function getIncomeStatement(symbol: string) {
  return await fetchAV({
    function: 'INCOME_STATEMENT',
    symbol: symbol.toUpperCase(),
  });
}

/**
 * 获取资产负债表
 */
export async function getBalanceSheet(symbol: string) {
  return await fetchAV({
    function: 'BALANCE_SHEET',
    symbol: symbol.toUpperCase(),
  });
}

/**
 * 获取现金流量表
 */
export async function getCashFlow(symbol: string) {
  return await fetchAV({
    function: 'CASH_FLOW',
    symbol: symbol.toUpperCase(),
  });
}

/**
 * 获取盈利数据
 */
export async function getEarnings(symbol: string) {
  return await fetchAV({
    function: 'EARNINGS',
    symbol: symbol.toUpperCase(),
  });
}

/**
 * 搜索股票
 */
export async function searchSymbol(keywords: string) {
  const data = await fetchAV({
    function: 'SYMBOL_SEARCH',
    keywords,
  });
  return data?.bestMatches || [];
}

/**
 * 获取技术指标 - RSI
 */
export async function getRSI(symbol: string, interval = 'daily', timePeriod = 14) {
  return await fetchAV({
    function: 'RSI',
    symbol: symbol.toUpperCase(),
    interval,
    time_period: timePeriod.toString(),
    series_type: 'close',
  });
}

/**
 * 获取技术指标 - MACD
 */
export async function getMACD(symbol: string, interval = 'daily') {
  return await fetchAV({
    function: 'MACD',
    symbol: symbol.toUpperCase(),
    interval,
    series_type: 'close',
  });
}

/**
 * 获取新闻和情绪分析
 */
export async function getNewsSentiment(tickers: string) {
  return await fetchAV({
    function: 'NEWS_SENTIMENT',
    tickers: tickers.toUpperCase(),
  });
}

/**
 * 格式化公司概况为 AI 可读文本
 */
export function formatOverviewForAI(overview: AVResponse | null): string {
  if (!overview || overview.Note) {
    return '无法获取数据 (可能API调用次数已用完)';
  }

  return `
## ${overview.Name} (${overview.Symbol})

### 公司信息
- **行业**: ${overview.Sector} / ${overview.Industry}
- **交易所**: ${overview.Exchange}
- **员工数**: ${parseInt(overview.FullTimeEmployees || 0).toLocaleString()}
- **描述**: ${overview.Description?.slice(0, 500)}...

### 估值指标
- **市值**: $${(parseFloat(overview.MarketCapitalization) / 1e9).toFixed(2)}B
- **PE (TTM)**: ${overview.PERatio || 'N/A'}
- **Forward PE**: ${overview.ForwardPE || 'N/A'}
- **PEG Ratio**: ${overview.PEGRatio || 'N/A'}
- **P/B Ratio**: ${overview.PriceToBookRatio || 'N/A'}
- **P/S Ratio (TTM)**: ${overview.PriceToSalesRatioTTM || 'N/A'}
- **EV/Revenue**: ${overview.EVToRevenue || 'N/A'}
- **EV/EBITDA**: ${overview.EVToEBITDA || 'N/A'}

### 盈利能力
- **Profit Margin**: ${overview.ProfitMargin || 'N/A'}
- **Operating Margin**: ${overview.OperatingMarginTTM || 'N/A'}
- **ROE**: ${overview.ReturnOnEquityTTM || 'N/A'}
- **ROA**: ${overview.ReturnOnAssetsTTM || 'N/A'}

### 增长指标
- **Revenue Growth (YoY)**: ${overview.QuarterlyRevenueGrowthYOY || 'N/A'}
- **Earnings Growth (YoY)**: ${overview.QuarterlyEarningsGrowthYOY || 'N/A'}

### 分红与股息
- **Dividend Yield**: ${overview.DividendYield || 'N/A'}
- **Dividend Per Share**: $${overview.DividendPerShare || '0'}

### 分析师目标价
- **Target Price**: $${overview.AnalystTargetPrice || 'N/A'}

### 52周表现
- **52周高**: $${overview['52WeekHigh'] || 'N/A'}
- **52周低**: $${overview['52WeekLow'] || 'N/A'}
- **50日均线**: $${overview['50DayMovingAverage'] || 'N/A'}
- **200日均线**: $${overview['200DayMovingAverage'] || 'N/A'}
- **Beta**: ${overview.Beta || 'N/A'}
`;
}

export default {
  getQuote,
  getOverview,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlow,
  getEarnings,
  searchSymbol,
  getRSI,
  getMACD,
  getNewsSentiment,
  formatOverviewForAI,
};
