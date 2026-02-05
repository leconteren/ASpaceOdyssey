
// Financial Data API Service
// 使用 Financial Modeling Prep API (免费250次/天)
// 申请 API Key: https://financialmodelingprep.com/developer

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// 从环境变量读取 API Key
const getApiKey = () => {
  return import.meta.env.VITE_FMP_API_KEY || '';
};

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  pe: number;
  eps: number;
  volume: number;
  avgVolume: number;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  industry: string;
  sector: string;
  description: string;
  ceo: string;
  employees: number;
  website: string;
  country: string;
  mktCap: number;
  price: number;
  beta: number;
  volAvg: number;
  lastDiv: number;
  dcfDiff: number;
  dcf: number;
}

export interface IncomeStatement {
  date: string;
  symbol: string;
  revenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
}

export interface KeyMetrics {
  symbol: string;
  date: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  peRatio: number;
  priceToSalesRatio: number;
  pbRatio: number;
  evToSales: number;
  evToEBITDA: number;
  debtToEquity: number;
  roic: number;
  roe: number;
  roa: number;
}

export interface AnalystEstimate {
  symbol: string;
  date: string;
  estimatedRevenueAvg: number;
  estimatedEpsAvg: number;
  numberAnalystEstimatedRevenue: number;
  numberAnalystsEstimatedEps: number;
}

// API 调用封装
async function fetchFMP<T>(endpoint: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('FMP API Key not configured');
    return null;
  }

  try {
    const response = await fetch(`${FMP_BASE_URL}${endpoint}?apikey=${apiKey}`);
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('FMP API fetch error:', error);
    return null;
  }
}

// ============ 核心 API 函数 ============

/**
 * 获取实时股票报价
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const data = await fetchFMP<StockQuote[]>(`/quote/${symbol.toUpperCase()}`);
  return data?.[0] || null;
}

/**
 * 获取公司简介
 */
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const data = await fetchFMP<CompanyProfile[]>(`/profile/${symbol.toUpperCase()}`);
  return data?.[0] || null;
}

/**
 * 获取收入报表 (最近5年)
 */
export async function getIncomeStatement(symbol: string, limit = 5): Promise<IncomeStatement[]> {
  const data = await fetchFMP<IncomeStatement[]>(`/income-statement/${symbol.toUpperCase()}&limit=${limit}`);
  return data || [];
}

/**
 * 获取关键财务指标
 */
export async function getKeyMetrics(symbol: string, limit = 5): Promise<KeyMetrics[]> {
  const data = await fetchFMP<KeyMetrics[]>(`/key-metrics/${symbol.toUpperCase()}&limit=${limit}`);
  return data || [];
}

/**
 * 获取分析师预期
 */
export async function getAnalystEstimates(symbol: string): Promise<AnalystEstimate[]> {
  const data = await fetchFMP<AnalystEstimate[]>(`/analyst-estimates/${symbol.toUpperCase()}`);
  return data || [];
}

/**
 * 获取公司新闻
 */
export async function getCompanyNews(symbol: string, limit = 10): Promise<any[]> {
  const data = await fetchFMP<any[]>(`/stock_news?tickers=${symbol.toUpperCase()}&limit=${limit}`);
  return data || [];
}

/**
 * 获取财务比率
 */
export async function getFinancialRatios(symbol: string): Promise<any[]> {
  const data = await fetchFMP<any[]>(`/ratios/${symbol.toUpperCase()}`);
  return data || [];
}

/**
 * 获取 DCF 估值
 */
export async function getDCFValue(symbol: string): Promise<any | null> {
  const data = await fetchFMP<any[]>(`/discounted-cash-flow/${symbol.toUpperCase()}`);
  return data?.[0] || null;
}

// ============ 综合数据获取 ============

/**
 * 获取完整公司分析数据 (一次调用获取所有数据)
 */
export async function getFullCompanyData(symbol: string) {
  const [quote, profile, income, metrics, estimates, news, dcf] = await Promise.all([
    getStockQuote(symbol),
    getCompanyProfile(symbol),
    getIncomeStatement(symbol),
    getKeyMetrics(symbol),
    getAnalystEstimates(symbol),
    getCompanyNews(symbol, 5),
    getDCFValue(symbol),
  ]);

  return {
    quote,
    profile,
    income,
    metrics,
    estimates,
    news,
    dcf,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * 格式化公司数据为 AI 可读的文本
 */
export function formatCompanyDataForAI(data: Awaited<ReturnType<typeof getFullCompanyData>>): string {
  if (!data.profile) {
    return '无法获取公司数据，请检查 ticker 是否正确或 API Key 是否配置。';
  }

  const { quote, profile, income, metrics, dcf } = data;

  let text = `
## ${profile.companyName} (${profile.symbol}) 实时数据

### 基本信息
- **行业**: ${profile.sector} / ${profile.industry}
- **CEO**: ${profile.ceo}
- **员工数**: ${profile.employees?.toLocaleString() || 'N/A'}
- **总部**: ${profile.country}
- **Beta**: ${profile.beta?.toFixed(2) || 'N/A'}

### 实时行情
- **当前价格**: $${quote?.price?.toFixed(2) || 'N/A'}
- **涨跌幅**: ${quote?.changesPercentage?.toFixed(2) || 'N/A'}%
- **市值**: $${(quote?.marketCap / 1e9)?.toFixed(2) || 'N/A'}B
- **PE**: ${quote?.pe?.toFixed(2) || 'N/A'}
- **52周高/低**: $${quote?.yearHigh?.toFixed(2)} / $${quote?.yearLow?.toFixed(2)}

### 关键估值指标 (最新)
`;

  if (metrics?.[0]) {
    const m = metrics[0];
    text += `- **P/E Ratio**: ${m.peRatio?.toFixed(2) || 'N/A'}
- **P/S Ratio**: ${m.priceToSalesRatio?.toFixed(2) || 'N/A'}
- **P/B Ratio**: ${m.pbRatio?.toFixed(2) || 'N/A'}
- **EV/EBITDA**: ${m.evToEBITDA?.toFixed(2) || 'N/A'}
- **ROE**: ${(m.roe * 100)?.toFixed(1) || 'N/A'}%
- **ROIC**: ${(m.roic * 100)?.toFixed(1) || 'N/A'}%
- **Debt/Equity**: ${m.debtToEquity?.toFixed(2) || 'N/A'}
`;
  }

  if (dcf) {
    text += `
### DCF 估值
- **DCF 内在价值**: $${dcf.dcf?.toFixed(2) || 'N/A'}
- **当前价格 vs DCF**: ${((quote?.price / dcf.dcf - 1) * 100)?.toFixed(1)}% ${quote?.price > dcf.dcf ? '溢价' : '折价'}
`;
  }

  if (income?.length > 0) {
    text += `
### 财务趋势 (最近${income.length}年)
| 年份 | 收入 | 毛利率 | 净利率 | EPS |
|------|------|--------|--------|-----|
`;
    income.forEach(i => {
      text += `| ${i.date.slice(0, 4)} | $${(i.revenue / 1e9).toFixed(1)}B | ${(i.grossProfitRatio * 100).toFixed(1)}% | ${(i.netIncomeRatio * 100).toFixed(1)}% | $${i.epsdiluted?.toFixed(2)} |
`;
    });
  }

  text += `
---
*数据来源: Financial Modeling Prep | 更新时间: ${data.fetchedAt}*
`;

  return text;
}

export default {
  getStockQuote,
  getCompanyProfile,
  getIncomeStatement,
  getKeyMetrics,
  getAnalystEstimates,
  getCompanyNews,
  getFinancialRatios,
  getDCFValue,
  getFullCompanyData,
  formatCompanyDataForAI,
};
