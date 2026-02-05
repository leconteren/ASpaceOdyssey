
import { AgentConfig, AgentMessage } from './types';
import { callGemini, GeminiMessage } from './aiService';
import { getCompanyNews } from '../services/financeAPI';
import yahooFinance from '../services/yahooFinance';

// 检测消息中的股票 Ticker
function extractTickers(text: string): string[] {
  // 明确的 ticker 格式：$RDDT, 分析 AAPL, 研究TSLA
  const explicitPattern = /(?:\$|分析|研究|看看|查一下)\s*([A-Z]{1,5})\b/gi;
  const explicitMatches = [...text.matchAll(explicitPattern)].map(m => m[1].toUpperCase());
  if (explicitMatches.length > 0) return [...new Set(explicitMatches)];

  // 通用模式
  const tickerPattern = /\b([A-Z]{2,5})\b/g;
  const matches = text.match(tickerPattern) || [];

  const excludeWords = new Set([
    'THE', 'AND', 'FOR', 'CEO', 'CFO', 'COO', 'CTO', 'IPO', 'SEC', 'FDA', 'API', 'AI',
    'PE', 'PS', 'PB', 'EPS', 'ROE', 'ROA', 'FCF', 'DCF', 'TAM', 'CAGR',
    'US', 'USA', 'UK', 'EU', 'GDP', 'CPI', 'PMI', 'ETF', 'NYSE', 'NASDAQ',
    'YOY', 'QOQ', 'MOM', 'YTD', 'TTM', 'BUY', 'SELL', 'HOLD', 'LONG', 'SHORT',
  ]);

  return [...new Set(matches.filter(t => !excludeWords.has(t)))];
}

// 获取 Yahoo Finance 实时数据
async function getYahooData(ticker: string): Promise<string | null> {
  try {
    const quote = await yahooFinance.getQuote(ticker);
    if (quote) {
      return yahooFinance.formatQuoteForAI(quote);
    }
    return null;
  } catch (err) {
    console.warn(`Yahoo Finance data fetch failed for ${ticker}:`, err);
    return null;
  }
}

// 获取 Yahoo Finance 历史数据
async function getHistoricalData(ticker: string): Promise<string | null> {
  try {
    const data = await yahooFinance.getHistoricalData(ticker, '3y', '1d');
    if (data) {
      return yahooFinance.formatHistoricalDataForAI(data);
    }
    return null;
  } catch (err) {
    console.warn(`Yahoo Finance historical data fetch failed for ${ticker}:`, err);
    return null;
  }
}

// 获取技术指标数据 (布林带、多周期涨跌幅)
async function getTechnicalData(ticker: string): Promise<string | null> {
  try {
    const data = await yahooFinance.getTechnicalData(ticker);
    if (data) {
      return yahooFinance.formatTechnicalDataForAI(data);
    }
    return null;
  } catch (err) {
    console.warn(`Technical data fetch failed for ${ticker}:`, err);
    return null;
  }
}

// 获取新闻数据
async function getNewsData(ticker: string): Promise<string | null> {
  try {
    const news = await getCompanyNews(ticker, 5);
    if (!news || news.length === 0) return null;

    let text = `## ${ticker} 最新新闻\n\n`;
    news.forEach((item: any, i: number) => {
      text += `${i + 1}. **${item.title}**\n`;
      text += `   - 来源: ${item.site} | ${item.publishedDate}\n`;
      if (item.text) text += `   - 摘要: ${item.text.slice(0, 150)}...\n`;
      text += '\n';
    });
    return text;
  } catch (err) {
    console.warn(`News fetch failed for ${ticker}:`, err);
    return null;
  }
}

// 根据 Agent 类型获取相应数据
async function enrichMessage(message: string, agentId: string): Promise<string> {
  const tickers = extractTickers(message);
  if (tickers.length === 0) return message;

  const ticker = tickers[0];
  const dataParts: string[] = [];

  // 技术分析 Agent 专用数据 (布林带、多周期涨跌幅)
  if (agentId === 'technical') {
    const technicalData = await getTechnicalData(ticker);
    if (technicalData) dataParts.push(technicalData);
  }

  // 基本面相关 Agent 获取 Yahoo Finance 实时数据和历史数据
  if (['fundamental', 'committee', 'dataTracking'].includes(agentId)) {
    const yahooData = await getYahooData(ticker);
    if (yahooData) dataParts.push(yahooData);

    // 获取3年历史数据
    const historicalData = await getHistoricalData(ticker);
    if (historicalData) dataParts.push(historicalData);
  }

  // 新闻数据
  if (['ideaSourcing', 'committee', 'fundamental'].includes(agentId)) {
    const news = await getNewsData(ticker);
    if (news) dataParts.push(news);
  }

  if (dataParts.length === 0) return message;

  return `${message}

---
**[系统自动获取的实时数据 - ${ticker}]**

${dataParts.join('\n\n')}

---
请基于以上实时数据进行深度分析。`;
}

export class BaseAgent {
  config: AgentConfig;
  messages: AgentMessage[];

  constructor(config: AgentConfig) {
    this.config = config;
    this.messages = [];
  }

  async chat(
    userMessage: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    // 自动获取相关数据（根据 Agent 类型）
    let enrichedMessage = userMessage;
    try {
      enrichedMessage = await enrichMessage(userMessage, this.config.id);
    } catch (err) {
      console.warn('Failed to enrich message with data:', err);
    }

    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: enrichedMessage,
      timestamp: Date.now(),
    };
    this.messages.push(userMsg);

    const geminiMessages: GeminiMessage[] = this.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.content }],
      }));

    const response = await callGemini(
      this.config.systemPrompt,
      geminiMessages,
      onStream
    );

    const agentMsg: AgentMessage = {
      id: `msg_${Date.now()}_a`,
      role: 'agent',
      content: response,
      timestamp: Date.now(),
      agentId: this.config.id,
    };
    this.messages.push(agentMsg);

    return response;
  }

  clearHistory() {
    this.messages = [];
  }

  getHistory(): AgentMessage[] {
    return [...this.messages];
  }
}
