
import { BetaAnalysisReport, AgentMessage } from './types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey(): string {
  const key = (process.env as Record<string, string>).GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY 未配置。请在 .env.local 中设置 GEMINI_API_KEY。');
  }
  return key;
}

async function callGemini(prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJsonFromText(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function analyzeBeta(
  tickers: string[],
  benchmark: string,
  period: string
): Promise<BetaAnalysisReport> {
  const tickerList = tickers.join(', ');

  const prompt = `You are a quantitative finance analyst. Compute the beta analysis of these assets against a benchmark.

Assets to analyze: ${tickerList}
Benchmark: ${benchmark}
Period: ${period}

For each asset, calculate:
1. Overall Beta = Cov(asset, benchmark) / Var(benchmark) over the full period
2. Upside Beta = Beta computed only on days when benchmark daily return > 0
3. Downside Beta = Beta computed only on days when benchmark daily return < 0
4. Pearson correlation with benchmark
5. R-squared (correlation^2)
6. Annualized return and annualized volatility

Respond with ONLY valid JSON (no markdown, no code blocks). Use this exact structure:

{
  "benchmark": "${benchmark}",
  "benchmarkAnnualizedReturn": 0.12,
  "benchmarkAnnualizedVolatility": 0.18,
  "period": "${period}",
  "tickers": [
    {
      "ticker": "XXX",
      "overallBeta": 1.15,
      "upsideBeta": 1.05,
      "downsideBeta": 1.25,
      "correlation": 0.85,
      "rSquared": 0.72,
      "annualizedReturn": 0.15,
      "annualizedVolatility": 0.22,
      "explanation": "1-2 sentence explanation of the beta profile, e.g. higher downside beta means this stock amplifies losses more than gains"
    }
  ],
  "summary": "2-3 sentence quantitative summary in Chinese (简体中文)",
  "riskInsights": "2-3 actionable risk management insights in Chinese (简体中文)"
}

Requirements:
- ALL values must be realistic based on actual historical market data
- Use realistic annualized return and volatility figures
- Upside/downside beta asymmetry should reflect real market behavior (most equities have higher downside beta)
- Explanations in English, summary and riskInsights in Chinese (简体中文)`;

  const rawText = await callGemini(prompt);

  try {
    const parsed = parseJsonFromText(rawText) as BetaAnalysisReport;
    if (!parsed.tickers || !parsed.benchmark) {
      throw new Error('Missing required fields');
    }
    return parsed;
  } catch {
    return {
      benchmark,
      benchmarkAnnualizedReturn: 0,
      benchmarkAnnualizedVolatility: 0,
      period,
      tickers: [],
      summary: rawText || '分析失败，请重试。',
      riskInsights: '',
    };
  }
}

export async function chatWithAgent(
  history: AgentMessage[],
  newMessage: string
): Promise<string> {
  const conversationCtx = history
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
    .join('\n');

  const prompt = `You are "Monolith Alpha", a quantitative finance agent specializing in beta analysis and portfolio risk. You help users understand how assets move relative to benchmarks, interpret upside/downside beta asymmetry, and provide risk management insights. Respond in the same language the user uses.

Previous conversation:
${conversationCtx}

User: ${newMessage}

Respond concisely with data-driven insights. Use numbers where possible.`;

  return callGemini(prompt, 2048);
}
