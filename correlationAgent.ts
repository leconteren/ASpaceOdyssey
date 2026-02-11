
import { BetaAnalysisReport, TickerBeta, AgentMessage } from './types';
import { fetchMultipleDailyPrices } from './stockDataService';
import { computeTickerBeta, computeBenchmarkStats } from './betaCalculator';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

function getAnthropicKey(): string | null {
  return (process.env as Record<string, string>).ANTHROPIC_API_KEY || null;
}

async function callClaude(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = getAnthropicKey();
  if (!apiKey) return '';

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) return '';
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// ── Real-data Beta Analysis ──────────────────────────────────────────

export async function analyzeBetaWithRealData(
  tickers: string[],
  benchmark: string,
  period: string,
  alphaVantageKey: string,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<BetaAnalysisReport> {
  // 1. Fetch all price data (benchmark + tickers)
  const allSymbols = [benchmark, ...tickers];
  const priceMap = await fetchMultipleDailyPrices(allSymbols, alphaVantageKey, onProgress);

  const benchmarkPrices = priceMap.get(benchmark);
  if (!benchmarkPrices || benchmarkPrices.length === 0) {
    throw new Error(`无法获取 Benchmark (${benchmark}) 的价格数据`);
  }

  // 2. Compute beta metrics for each ticker
  const tickerResults: TickerBeta[] = [];
  for (const sym of tickers) {
    const prices = priceMap.get(sym);
    if (!prices || prices.length === 0) {
      tickerResults.push({
        ticker: sym,
        overallBeta: NaN,
        upsideBeta: NaN,
        downsideBeta: NaN,
        correlation: NaN,
        rSquared: NaN,
        annualizedReturn: NaN,
        annualizedVolatility: NaN,
        explanation: `无法获取 ${sym} 的价格数据`,
      });
      continue;
    }
    tickerResults.push(computeTickerBeta(sym, prices, benchmarkPrices, period));
  }

  const benchStats = computeBenchmarkStats(benchmarkPrices, period);

  // 3. Ask Claude for qualitative insights (best-effort)
  const { summary, riskInsights, explanations } = await generateInsights(
    benchmark,
    benchStats,
    tickerResults,
    period
  );

  // Merge explanations into ticker results
  for (const t of tickerResults) {
    if (!t.explanation && explanations[t.ticker]) {
      t.explanation = explanations[t.ticker];
    }
  }

  return {
    benchmark,
    benchmarkAnnualizedReturn: benchStats.annualizedReturn,
    benchmarkAnnualizedVolatility: benchStats.annualizedVolatility,
    period,
    tickers: tickerResults,
    summary,
    riskInsights,
  };
}

// ── Claude Insights Generation ───────────────────────────────────────

async function generateInsights(
  benchmark: string,
  benchStats: { annualizedReturn: number; annualizedVolatility: number },
  tickers: TickerBeta[],
  period: string
): Promise<{ summary: string; riskInsights: string; explanations: Record<string, string> }> {
  const apiKey = getAnthropicKey();
  if (!apiKey) {
    return { summary: '', riskInsights: '', explanations: {} };
  }

  const dataTable = tickers
    .map(
      t =>
        `${t.ticker}: β=${t.overallBeta}, upβ=${t.upsideBeta}, downβ=${t.downsideBeta}, corr=${t.correlation}, R²=${t.rSquared}, annRet=${t.annualizedReturn}, annVol=${t.annualizedVolatility}`
    )
    .join('\n');

  const prompt = `You are a quantitative finance analyst. Given the following computed beta analysis results, provide qualitative insights.

Benchmark: ${benchmark} (Ann. Return: ${benchStats.annualizedReturn}, Ann. Vol: ${benchStats.annualizedVolatility})
Period: ${period}

Computed metrics:
${dataTable}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 sentence quantitative summary in Chinese (简体中文)",
  "riskInsights": "2-3 actionable risk/portfolio insights in Chinese (简体中文)",
  "explanations": {
    "TICKER1": "1 sentence explanation of its beta profile in English",
    "TICKER2": "..."
  }
}`;

  try {
    const raw = await callClaude(prompt);
    const cleaned = raw.replace(/```(?:json)?\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || '',
      riskInsights: parsed.riskInsights || '',
      explanations: parsed.explanations || {},
    };
  } catch {
    return { summary: '', riskInsights: '', explanations: {} };
  }
}

// ── Chat ─────────────────────────────────────────────────────────────

export async function chatWithAgent(
  history: AgentMessage[],
  newMessage: string
): Promise<string> {
  const apiKey = getAnthropicKey();
  if (!apiKey) {
    return '需要配置 ANTHROPIC_API_KEY 才能使用对话功能。请在 .env.local 中设置。';
  }

  const systemPrompt = `You are "Monolith Alpha", a quantitative finance agent specializing in beta analysis and portfolio risk. You help users interpret upside/downside beta asymmetry and provide risk management insights. Respond in the same language the user uses. Respond concisely with data-driven insights. Use numbers where possible.`;

  const messages = [
    ...history.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
    { role: 'user' as const, content: newMessage },
  ];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API 请求失败 (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No response from agent.';
}
