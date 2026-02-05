
import { AgentConfig, AgentMessage } from './types';
import { callGemini, GeminiMessage } from './aiService';
import { getFullCompanyData, formatCompanyDataForAI } from '../services/financeAPI';

// 检测消息中的股票 Ticker（美股格式：1-5个大写字母）
function extractTickers(text: string): string[] {
  // 常见的股票 ticker 模式
  const tickerPattern = /\b([A-Z]{1,5})\b/g;
  const matches = text.match(tickerPattern) || [];

  // 过滤掉常见的非 ticker 词汇
  const excludeWords = new Set([
    'I', 'A', 'THE', 'AND', 'OR', 'FOR', 'TO', 'IN', 'ON', 'AT', 'BY',
    'CEO', 'CFO', 'COO', 'CTO', 'IPO', 'SEC', 'FDA', 'FTC', 'API', 'AI',
    'PE', 'PS', 'PB', 'EPS', 'ROE', 'ROA', 'FCF', 'DCF', 'TAM', 'CAGR',
    'US', 'USA', 'UK', 'EU', 'GDP', 'CPI', 'PMI', 'ETF', 'NYSE', 'NASDAQ',
    'Q1', 'Q2', 'Q3', 'Q4', 'YOY', 'QOQ', 'MOM', 'YTD', 'TTM',
    'BUY', 'SELL', 'HOLD', 'LONG', 'SHORT', 'CALL', 'PUT',
  ]);

  return [...new Set(matches.filter(t => !excludeWords.has(t)))];
}

// 获取财务数据并格式化
async function enrichWithFinancialData(message: string): Promise<string> {
  const tickers = extractTickers(message);

  if (tickers.length === 0) {
    return message;
  }

  // 最多处理2个 ticker 避免 API 调用过多
  const tickersToFetch = tickers.slice(0, 2);
  const dataPromises = tickersToFetch.map(async (ticker) => {
    try {
      const data = await getFullCompanyData(ticker);
      if (data.profile) {
        return formatCompanyDataForAI(data);
      }
      return null;
    } catch (err) {
      console.warn(`Failed to fetch data for ${ticker}:`, err);
      return null;
    }
  });

  const results = await Promise.all(dataPromises);
  const validData = results.filter(Boolean);

  if (validData.length === 0) {
    return message;
  }

  // 将数据注入到消息中
  return `${message}

---
**[系统自动获取的实时财务数据]**
${validData.join('\n\n')}
---

请基于以上数据进行分析。`;
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
    // 对于基本面和数据追踪 Agent，自动获取财务数据
    let enrichedMessage = userMessage;
    if (['fundamental', 'dataTracking', 'committee'].includes(this.config.id)) {
      try {
        enrichedMessage = await enrichWithFinancialData(userMessage);
      } catch (err) {
        console.warn('Failed to enrich message with financial data:', err);
      }
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
