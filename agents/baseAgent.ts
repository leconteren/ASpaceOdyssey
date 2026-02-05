
import { AgentConfig, AgentMessage } from './types';
import { callGemini, GeminiMessage } from './aiService';
import { getFullCompanyData, formatCompanyDataForAI, getCompanyNews } from '../services/financeAPI';
import alphaVantage from '../services/alphaVantage';

// 检测消息中的股票 Ticker（美股格式：1-5个大写字母）
function extractTickers(text: string): string[] {
  const tickerPattern = /\b([A-Z]{1,5})\b/g;
  const matches = text.match(tickerPattern) || [];

  const excludeWords = new Set([
    'I', 'A', 'THE', 'AND', 'OR', 'FOR', 'TO', 'IN', 'ON', 'AT', 'BY',
    'CEO', 'CFO', 'COO', 'CTO', 'IPO', 'SEC', 'FDA', 'FTC', 'API', 'AI',
    'PE', 'PS', 'PB', 'EPS', 'ROE', 'ROA', 'FCF', 'DCF', 'TAM', 'CAGR',
    'US', 'USA', 'UK', 'EU', 'GDP', 'CPI', 'PMI', 'ETF', 'NYSE', 'NASDAQ',
    'Q1', 'Q2', 'Q3', 'Q4', 'YOY', 'QOQ', 'MOM', 'YTD', 'TTM',
    'BUY', 'SELL', 'HOLD', 'LONG', 'SHORT', 'CALL', 'PUT',
    'RDDT', // 用户可能直接说 RDDT 但我们要检测
  ]);

  // 特殊处理：如果有明确的 ticker 格式（如 $RDDT 或 分析RDDT）则提取
  const explicitTicker = text.match(/[$\s]([A-Z]{1,5})(?:\s|$|[,，。])/g);
  if (explicitTicker) {
    const explicit = explicitTicker.map(t => t.replace(/[$\s,，。]/g, '').trim()).filter(Boolean);
    if (explicit.length > 0) return [...new Set(explicit)];
  }

  return [...new Set(matches.filter(t => !excludeWords.has(t) && t.length >= 2))];
}

// 获取基本面数据
async function getFundamentalData(ticker: string): Promise<string | null> {
  try {
    const data = await getFullCompanyData(ticker);
    if (data.profile) {
      return formatCompanyDataForAI(data);
    }
    return null;
  } catch (err) {
    console.warn(`FMP data fetch failed for ${ticker}:`, err);
    return null;
  }
}

// 获取技术分析数据
async function getTechnicalData(ticker: string): Promise<string | null> {
  try {
    const [quote, rsi, macd] = await Promise.all([
      alphaVantage.getQuote(ticker),
      alphaVantage.getRSI(ticker),
      alphaVantage.getMACD(ticker),
    ]);

    if (!quote) return null;

    let text = `## ${ticker} 技术分析数据\n\n`;
    text += `### 实时行情\n`;
    text += `- 当前价格: $${quote.price}\n`;
    text += `- 涨跌: ${quote.change} (${quote.changePercent})\n`;
    text += `- 成交量: ${quote.volume?.toLocaleString()}\n`;
    text += `- 最新交易日: ${quote.latestTradingDay}\n\n`;

    if (rsi && rsi['Technical Analysis: RSI']) {
      const rsiData = Object.entries(rsi['Technical Analysis: RSI']).slice(0, 5);
      text += `### RSI (14日)\n`;
      rsiData.forEach(([date, val]: [string, any]) => {
        text += `- ${date}: ${parseFloat(val.RSI).toFixed(2)}\n`;
      });
      text += '\n';
    }

    if (macd && macd['Technical Analysis: MACD']) {
      const macdData = Object.entries(macd['Technical Analysis: MACD']).slice(0, 3);
      text += `### MACD\n`;
      macdData.forEach(([date, val]: [string, any]) => {
        text += `- ${date}: MACD=${parseFloat(val.MACD).toFixed(4)}, Signal=${parseFloat(val.MACD_Signal).toFixed(4)}, Hist=${parseFloat(val.MACD_Hist).toFixed(4)}\n`;
      });
    }

    return text;
  } catch (err) {
    console.warn(`Alpha Vantage data fetch failed for ${ticker}:`, err);
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

  const ticker = tickers[0]; // 主要处理第一个 ticker
  const dataParts: string[] = [];

  // 根据不同的 Agent 获取不同的数据
  if (['fundamental', 'committee', 'dataTracking'].includes(agentId)) {
    const fundamental = await getFundamentalData(ticker);
    if (fundamental) dataParts.push(fundamental);
  }

  if (['technical', 'committee'].includes(agentId)) {
    const technical = await getTechnicalData(ticker);
    if (technical) dataParts.push(technical);
  }

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
请基于以上实时数据进行分析。`;
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
