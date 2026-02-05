// Vercel Serverless Function - Technical Indicators
// 计算布林带、多时间段涨跌幅等技术指标

import type { VercelRequest, VercelResponse } from '@vercel/node';

const YAHOO_CHART_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

interface ChartData {
  timestamps: number[];
  close: number[];
  high: number[];
  low: number[];
  open: number[];
  volume: number[];
}

// 获取历史数据
async function fetchChartData(symbol: string, range: string, interval: string): Promise<ChartData | null> {
  try {
    const url = `${YAHOO_CHART_API}/${symbol}?range=${range}&interval=${interval}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const quotes = result.indicators?.quote?.[0] || {};
    return {
      timestamps: result.timestamp || [],
      close: quotes.close || [],
      high: quotes.high || [],
      low: quotes.low || [],
      open: quotes.open || [],
      volume: quotes.volume || [],
    };
  } catch {
    return null;
  }
}

// 计算布林带
function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2) {
  const validCloses = closes.filter(c => c !== null && !isNaN(c));
  if (validCloses.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  // 取最近 period 个数据点
  const recentCloses = validCloses.slice(-period);

  // 计算简单移动平均 (中轨)
  const sma = recentCloses.reduce((a, b) => a + b, 0) / period;

  // 计算标准差
  const squaredDiffs = recentCloses.map(c => Math.pow(c - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: sma + (stdDev * std),
    middle: sma,
    lower: sma - (stdDev * std),
  };
}

// 计算涨跌幅
function calculateReturn(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// 获取特定日期前的收盘价
function getPriceNDaysAgo(data: ChartData, days: number): number | null {
  const validData = data.close.filter((c, i) => c !== null && !isNaN(c) && data.timestamps[i]);
  if (validData.length === 0) return null;

  const now = Date.now() / 1000;
  const targetTime = now - (days * 24 * 60 * 60);

  // 找最接近目标时间的数据点
  let closestIdx = 0;
  let closestDiff = Infinity;

  for (let i = 0; i < data.timestamps.length; i++) {
    if (data.close[i] === null || isNaN(data.close[i])) continue;
    const diff = Math.abs(data.timestamps[i] - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }

  return data.close[closestIdx];
}

// 获取年初价格 (YTD)
function getYearStartPrice(data: ChartData): number | null {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime() / 1000;

  let closestIdx = -1;
  let closestDiff = Infinity;

  for (let i = 0; i < data.timestamps.length; i++) {
    if (data.close[i] === null || isNaN(data.close[i])) continue;
    if (data.timestamps[i] < yearStart) continue;

    const diff = data.timestamps[i] - yearStart;
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }

  return closestIdx >= 0 ? data.close[closestIdx] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }

  try {
    // 并行获取多个时间范围的数据
    const [dailyData, weeklyData, yearData] = await Promise.all([
      fetchChartData(symbol, '6mo', '1d'),   // 日线数据 (6个月足够计算布林带)
      fetchChartData(symbol, '2y', '1wk'),   // 周线数据
      fetchChartData(symbol, '1y', '1d'),    // 1年日线用于计算涨跌幅
    ]);

    if (!dailyData || !weeklyData) {
      return res.status(404).json({ error: 'Symbol not found or no data available' });
    }

    // 当前价格
    const currentPrice = dailyData.close.filter(c => c !== null && !isNaN(c)).slice(-1)[0];
    const previousClose = dailyData.close.filter(c => c !== null && !isNaN(c)).slice(-2)[0];

    // 计算布林带
    const dailyBB = calculateBollingerBands(dailyData.close, 20, 2);
    const weeklyBB = calculateBollingerBands(weeklyData.close, 20, 2);

    // 计算各时间段涨跌幅
    const price1dAgo = previousClose;
    const price1wAgo = getPriceNDaysAgo(yearData!, 7);
    const price1mAgo = getPriceNDaysAgo(yearData!, 30);
    const price3mAgo = getPriceNDaysAgo(yearData!, 90);
    const price1yAgo = getPriceNDaysAgo(yearData!, 365);
    const priceYTD = getYearStartPrice(yearData!);

    const performance = {
      '1d': price1dAgo ? calculateReturn(currentPrice, price1dAgo) : null,
      '1w': price1wAgo ? calculateReturn(currentPrice, price1wAgo) : null,
      '1m': price1mAgo ? calculateReturn(currentPrice, price1mAgo) : null,
      '3m': price3mAgo ? calculateReturn(currentPrice, price3mAgo) : null,
      '1y': price1yAgo ? calculateReturn(currentPrice, price1yAgo) : null,
      'ytd': priceYTD ? calculateReturn(currentPrice, priceYTD) : null,
    };

    // 判断布林带位置 (0-100, 0=下轨, 50=中轨, 100=上轨)
    const dailyBBPosition = dailyBB.upper !== dailyBB.lower
      ? ((currentPrice - dailyBB.lower) / (dailyBB.upper - dailyBB.lower)) * 100
      : 50;
    const weeklyBBPosition = weeklyBB.upper !== weeklyBB.lower
      ? ((currentPrice - weeklyBB.lower) / (weeklyBB.upper - weeklyBB.lower)) * 100
      : 50;

    // 生成警报
    const alerts: string[] = [];

    if (dailyBBPosition > 95) {
      alerts.push('日线触及上轨，建议减仓或观望');
    } else if (dailyBBPosition > 80) {
      alerts.push('日线接近上轨，注意风险');
    }

    if (dailyBBPosition < 5) {
      alerts.push('日线触及下轨，可考虑建仓/加仓');
    } else if (dailyBBPosition < 20) {
      alerts.push('日线接近下轨，可关注加仓机会');
    }

    if (weeklyBBPosition > 95) {
      alerts.push('周线触及上轨，中期高位风险');
    } else if (weeklyBBPosition < 5) {
      alerts.push('周线触及下轨，中期低位机会');
    }

    return res.status(200).json({
      symbol: symbol.toUpperCase(),
      currentPrice,
      previousClose,
      performance,
      bollingerBands: {
        daily: {
          upper: dailyBB.upper,
          middle: dailyBB.middle,
          lower: dailyBB.lower,
          position: dailyBBPosition, // 0-100
        },
        weekly: {
          upper: weeklyBB.upper,
          middle: weeklyBB.middle,
          lower: weeklyBB.lower,
          position: weeklyBBPosition,
        },
      },
      alerts,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Technical indicators API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to calculate indicators' });
  }
}
