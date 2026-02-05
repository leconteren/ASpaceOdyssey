// Vercel Serverless Function - Yahoo Finance Historical Data Proxy
// 获取历史价格数据（3年）

import type { VercelRequest, VercelResponse } from '@vercel/node';

const YAHOO_CHART_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { symbol, range = '3y', interval = '1d' } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }

  try {
    const url = `${YAHOO_CHART_API}/${symbol}?range=${range}&interval=${interval}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    // 提取并格式化历史数据
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

    // 返回结构化数据
    return res.status(200).json({
      symbol: result.meta?.symbol,
      currency: result.meta?.currency,
      exchangeName: result.meta?.exchangeName,
      regularMarketPrice: result.meta?.regularMarketPrice,
      previousClose: result.meta?.previousClose,
      chartPreviousClose: result.meta?.chartPreviousClose,
      dataGranularity: result.meta?.dataGranularity,
      range: result.meta?.range,
      // 历史数据点
      timestamps,
      open: quotes.open,
      high: quotes.high,
      low: quotes.low,
      close: quotes.close,
      volume: quotes.volume,
      adjClose,
      // 统计信息
      dataPoints: timestamps.length,
    });
  } catch (error: any) {
    console.error('Yahoo Finance Chart API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch chart data' });
  }
}
