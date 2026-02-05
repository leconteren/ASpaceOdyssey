
// 统一数据服务入口
export * from './financeAPI';
export * from './alphaVantage';

import financeAPI, { getFullCompanyData, formatCompanyDataForAI } from './financeAPI';
import alphaVantage, { getOverview, formatOverviewForAI } from './alphaVantage';

/**
 * 综合获取公司数据 (优先使用 FMP，备用 Alpha Vantage)
 */
export async function fetchCompanyData(symbol: string): Promise<string> {
  // 尝试 Financial Modeling Prep
  const fmpData = await getFullCompanyData(symbol);
  if (fmpData.profile) {
    return formatCompanyDataForAI(fmpData);
  }

  // 备用: Alpha Vantage
  const avData = await getOverview(symbol);
  if (avData && !avData.Note) {
    return formatOverviewForAI(avData);
  }

  return `无法获取 ${symbol} 的数据。请检查:
1. Ticker 是否正确 (如 NVDA, AAPL, TSLA)
2. API Key 是否已配置 (VITE_FMP_API_KEY 或 VITE_ALPHA_VANTAGE_KEY)
3. API 调用次数是否已用完`;
}

/**
 * 检查 API 配置状态
 */
export function checkAPIStatus(): {
  fmp: boolean;
  alphaVantage: boolean;
  anyConfigured: boolean;
} {
  const fmp = !!import.meta.env.VITE_FMP_API_KEY;
  const av = !!import.meta.env.VITE_ALPHA_VANTAGE_KEY;
  return {
    fmp,
    alphaVantage: av,
    anyConfigured: fmp || av,
  };
}

export { financeAPI, alphaVantage };
