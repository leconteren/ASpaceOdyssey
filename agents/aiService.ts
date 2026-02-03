
const getApiKey = (): string => {
  return (
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.API_KEY) ||
    ''
  );
};

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function callGemini(
  systemPrompt: string,
  messages: GeminiMessage[],
  onStream?: (chunk: string) => void
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return simulateResponse(systemPrompt, messages);
  }

  const contents = messages.map(msg => ({
    role: msg.role,
    parts: msg.parts,
  }));

  try {
    if (onStream) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                fullText += text;
                onStream(text);
              }
            } catch {
              // skip
            }
          }
        }
      }

      return fullText;
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return simulateResponse(systemPrompt, messages);
  }
}

function simulateResponse(systemPrompt: string, messages: GeminiMessage[]): string {
  const lastMsg = messages[messages.length - 1]?.parts[0]?.text || '';

  if (systemPrompt.includes('基本面')) {
    return `## 基本面分析报告

**关于你提到的: "${lastMsg.slice(0, 50)}..."**

> ⚠️ 当前使用离线模式（未配置API Key），以下为框架性分析模板。配置 GEMINI_API_KEY 后可获得AI驱动的实时分析。

### 分析框架
1. **商业模式**: 需要进一步了解该公司/行业的核心业务逻辑
2. **财务健康度**: 建议关注收入增速、毛利率趋势、FCF转化率
3. **竞争格局**: Porter五力分析框架
4. **估值参考**: 可比公司法 + DCF双重验证
5. **风险因素**: 监管、技术替代、宏观周期

### 下一步行动
- 请提供具体公司名称以获取更深入的分析
- 可以指定分析维度（如仅看估值、仅看竞争格局）`;
  }

  if (systemPrompt.includes('技术分析')) {
    return `## 技术分析报告

**关于: "${lastMsg.slice(0, 50)}..."**

> ⚠️ 离线模式 — 配置 GEMINI_API_KEY 后获得AI驱动分析。

### 技术面框架
1. **趋势判断**: 需要确认所处的大周期阶段（上升/震荡/下行）
2. **关键价位**: 支撑位与阻力位识别
3. **量价关系**: 成交量与价格变动的配合度
4. **技术指标**: MACD、RSI、布林带等多维验证
5. **形态识别**: 头肩顶/底、三角形整理、旗形等

### 建议
- 提供具体标的和时间框架以获取针对性分析
- 可结合基本面Agent做交叉验证`;
  }

  if (systemPrompt.includes('数据追踪') || systemPrompt.includes('Data Tracking')) {
    return `## 数据追踪报告

**追踪请求: "${lastMsg.slice(0, 50)}..."**

> ⚠️ 离线模式 — 配置 GEMINI_API_KEY 后获得AI驱动分析。

### 追踪框架
1. **核心指标**: 待确认需追踪的关键KPI/指标
2. **数据频率**: 日/周/月度数据更新节奏
3. **异常检测**: 超出历史均值±2σ的变动
4. **趋势判断**: 环比/同比变化方向
5. **关联分析**: 与其他指标的联动关系

### 可追踪维度
- 宏观数据: GDP、CPI、PMI、利率
- 行业数据: 出货量、ASP、库存周转
- 公司数据: 月度运营、用户增长、留存`;
  }

  if (systemPrompt.includes('新闻') || systemPrompt.includes('News')) {
    return `## 新闻与信息摘要

**关于: "${lastMsg.slice(0, 50)}..."**

> ⚠️ 离线模式 — 配置 GEMINI_API_KEY 后获得AI驱动分析。

### 信息分析框架
1. **信息源分级**: 一手（公告/财报）vs 二手（媒体/分析师）
2. **时效性**: 信息发布时间与市场反应窗口
3. **影响评估**: 对公司/行业的短期和长期影响
4. **情绪分析**: 市场整体情绪偏向（恐慌/乐观/中性）
5. **交叉验证**: 多信息源一致性检验

### 建议关注
- 请提供具体行业或公司以定向追踪
- 可设置关键词告警`;
  }

  return `## 投资委员会综合评估

**议题: "${lastMsg.slice(0, 50)}..."**

> ⚠️ 离线模式 — 配置 GEMINI_API_KEY 后获得AI驱动分析。

### 评估框架
1. **多维度汇总**: 综合基本面、技术面、数据与新闻分析
2. **风险收益比**: 预期收益 vs 下行风险评估
3. **仓位建议**: 基于凯利公式的最优配置
4. **时间框架**: 短期交易 vs 中长期持有建议
5. **关键催化剂**: 推动股价变动的核心事件

### 决策流程
- 先让各个专项Agent完成分析
- 投委会Agent汇总各方观点并生成建议
- 最终决策权在你手中`;
}
