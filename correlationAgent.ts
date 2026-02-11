
import { CorrelationAnalysis, AgentMessage } from './types';

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
        temperature: 0.7,
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
  // Strip markdown code fences if present
  const cleaned = text.replace(/```(?:json)?\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function analyzeCorrelation(
  tickers: string[],
  period: string,
  additionalContext?: string
): Promise<CorrelationAnalysis> {
  const tickerList = tickers.join(', ');
  const n = tickers.length;

  const prompt = `You are a professional stock market correlation analysis agent. Analyze the historical price correlation between these stocks: ${tickerList}, over the time period: ${period}.
${additionalContext ? `\nAdditional context from user: ${additionalContext}` : ''}

Respond with ONLY valid JSON (no markdown, no code blocks, no extra text). Use this exact structure:

{
  "tickers": [${tickers.map(t => `"${t}"`).join(', ')}],
  "matrix": [/* ${n}x${n} correlation matrix, symmetric, diagonal = 1.0, values between -1 and 1 */],
  "pairs": [
    {
      "ticker1": "XXX",
      "ticker2": "YYY",
      "correlation": 0.85,
      "explanation": "Brief explanation of why these stocks are correlated at this level"
    }
  ],
  "summary": "2-3 sentence overall summary of the correlation landscape",
  "marketInsights": "2-3 actionable investment insights based on these correlations"
}

Requirements:
- Correlation values must be realistic based on actual historical market data
- Include ALL unique pairs (n*(n-1)/2 pairs, no self-correlations)
- Matrix must be symmetric with 1.0 on the diagonal
- Write summary and marketInsights in Chinese (简体中文)
- Write pair explanations in English`;

  const rawText = await callGemini(prompt);

  try {
    const parsed = parseJsonFromText(rawText) as CorrelationAnalysis;
    // Validate basic structure
    if (!parsed.tickers || !parsed.matrix || !parsed.pairs) {
      throw new Error('Missing required fields');
    }
    return parsed;
  } catch {
    // Fallback: return a skeleton with the raw text as summary
    return {
      tickers,
      matrix: tickers.map((_, i) => tickers.map((_, j) => (i === j ? 1.0 : 0))),
      pairs: [],
      summary: rawText || '分析失败，请重试。',
      marketInsights: '',
    };
  }
}

export async function chatWithAgent(
  history: AgentMessage[],
  newMessage: string
): Promise<string> {
  const conversationCtx = history
    .slice(-10) // keep last 10 messages for context window
    .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a professional stock market correlation analysis agent called "Monolith Alpha". You help users understand how different stocks move in relation to each other and provide investment insights. You respond in the same language the user uses (Chinese or English).

Previous conversation:
${conversationCtx}

User: ${newMessage}

Respond naturally and helpfully. If the user asks about specific stocks or correlations, provide detailed analysis with numbers. Keep your response concise but informative. Use markdown formatting for readability.`;

  return callGemini(prompt, 2048);
}
