
import { DailyPrice, filterByPeriod } from './stockDataService';
import { TickerBeta } from './types';

// ── Basic Stats ──────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
}

function stddev(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

function covariance(a: number[], b: number[]): number {
  const ma = mean(a);
  const mb = mean(b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - ma) * (b[i] - mb);
  }
  return sum / (a.length - 1);
}

// ── Return Calculations ──────────────────────────────────────────────

function dailyReturns(prices: DailyPrice[]): { date: string; ret: number }[] {
  const returns: { date: string; ret: number }[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push({
      date: prices[i].date,
      ret: (prices[i].close - prices[i - 1].close) / prices[i - 1].close,
    });
  }
  return returns;
}

// Align two return series by date (inner join)
function alignReturns(
  a: { date: string; ret: number }[],
  b: { date: string; ret: number }[]
): { aRet: number[]; bRet: number[] } {
  const bMap = new Map(b.map(x => [x.date, x.ret]));
  const aRet: number[] = [];
  const bRet: number[] = [];

  for (const item of a) {
    const bVal = bMap.get(item.date);
    if (bVal !== undefined) {
      aRet.push(item.ret);
      bRet.push(bVal);
    }
  }

  return { aRet, bRet };
}

// ── Beta Computations ────────────────────────────────────────────────

function computeBeta(assetReturns: number[], benchmarkReturns: number[]): number {
  const bVar = variance(benchmarkReturns);
  if (bVar === 0) return 0;
  return covariance(assetReturns, benchmarkReturns) / bVar;
}

function computeConditionalBeta(
  assetReturns: number[],
  benchmarkReturns: number[],
  condition: (benchmarkReturn: number) => boolean
): number {
  const filteredAsset: number[] = [];
  const filteredBench: number[] = [];

  for (let i = 0; i < benchmarkReturns.length; i++) {
    if (condition(benchmarkReturns[i])) {
      filteredAsset.push(assetReturns[i]);
      filteredBench.push(benchmarkReturns[i]);
    }
  }

  if (filteredBench.length < 5) return NaN; // not enough data points
  return computeBeta(filteredAsset, filteredBench);
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const sa = stddev(a);
  const sb = stddev(b);
  if (sa === 0 || sb === 0) return 0;
  return covariance(a, b) / (sa * sb);
}

// ── Main Entry Point ─────────────────────────────────────────────────

export function computeTickerBeta(
  tickerSymbol: string,
  tickerPrices: DailyPrice[],
  benchmarkPrices: DailyPrice[],
  period: string
): TickerBeta {
  const filteredTicker = filterByPeriod(tickerPrices, period);
  const filteredBench = filterByPeriod(benchmarkPrices, period);

  const tickerReturns = dailyReturns(filteredTicker);
  const benchReturns = dailyReturns(filteredBench);

  const { aRet, bRet } = alignReturns(tickerReturns, benchReturns);

  if (aRet.length < 10) {
    return {
      ticker: tickerSymbol,
      overallBeta: NaN,
      upsideBeta: NaN,
      downsideBeta: NaN,
      correlation: NaN,
      rSquared: NaN,
      annualizedReturn: NaN,
      annualizedVolatility: NaN,
      explanation: `Insufficient overlapping data (${aRet.length} days)`,
    };
  }

  const overallBeta = computeBeta(aRet, bRet);
  const upsideBeta = computeConditionalBeta(aRet, bRet, r => r > 0);
  const downsideBeta = computeConditionalBeta(aRet, bRet, r => r < 0);
  const corr = pearsonCorrelation(aRet, bRet);

  return {
    ticker: tickerSymbol,
    overallBeta: round4(overallBeta),
    upsideBeta: round4(upsideBeta),
    downsideBeta: round4(downsideBeta),
    correlation: round4(corr),
    rSquared: round4(corr * corr),
    annualizedReturn: round4(mean(aRet) * 252),
    annualizedVolatility: round4(stddev(aRet) * Math.sqrt(252)),
    explanation: '', // will be filled by Gemini
  };
}

export function computeBenchmarkStats(
  benchmarkPrices: DailyPrice[],
  period: string
): { annualizedReturn: number; annualizedVolatility: number } {
  const filtered = filterByPeriod(benchmarkPrices, period);
  const returns = dailyReturns(filtered).map(r => r.ret);

  if (returns.length < 10) {
    return { annualizedReturn: NaN, annualizedVolatility: NaN };
  }

  return {
    annualizedReturn: round4(mean(returns) * 252),
    annualizedVolatility: round4(stddev(returns) * Math.sqrt(252)),
  };
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
