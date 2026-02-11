
import { BetaAnalysisReport, TickerBeta, AgentMessage } from './types';
import { fetchMultipleDailyPrices } from './stockDataService';
import { computeTickerBeta, computeBenchmarkStats } from './betaCalculator';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getGeminiKey(): string | null {
  return (process.env as Record<string, string>).GEMINI_API_KEY || null;
}

async function callGemini(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) return '';

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
    }),
  });

  if (!response.ok) return '';
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

  // 3. Ask Gemini for qualitative insights (non-blocking, best-effort)
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

// ── Gemini Insights Generation ───────────────────────────────────────

async function generateInsights(
  benchmark: string,
  benchStats: { annualizedReturn: number; annualizedVolatility: number },
  tickers: TickerBeta[],
  period: string
): Promise<{ summary: string; riskInsights: string; explanations: Record<string, string> }> {
  const geminiKey = getGeminiKey();
  if (!geminiKey) {
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
    const raw = await callGemini(prompt);
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
  const geminiKey = getGeminiKey();
  if (!geminiKey) {
    return '需要配置 GEMINI_API_KEY 才能使用对话功能。';
  }

  const conversationCtx = history
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
    .join('\n');

  const prompt = `You are "Monolith Alpha", a quantitative finance agent specializing in beta analysis and portfolio risk. You help users interpret upside/downside beta asymmetry and provide risk management insights. Respond in the same language the user uses.

Previous conversation:
${conversationCtx}

User: ${newMessage}

Respond concisely with data-driven insights. Use numbers where possible.`;

  return callGemini(prompt);
}
