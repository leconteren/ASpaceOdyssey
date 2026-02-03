
import { AgentId, AgentConfig, ResearchTask } from './types';
import { BaseAgent } from './baseAgent';
import { createFundamentalAgent, fundamentalConfig } from './fundamentalAgent';
import { createTechnicalAgent, technicalConfig } from './technicalAgent';
import { createDataTrackingAgent, dataTrackingConfig } from './dataTrackingAgent';
import { createNewsAgent, newsConfig } from './newsAgent';
import { createCommitteeAgent, committeeConfig } from './committeeAgent';
import { callGemini } from './aiService';

export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  fundamental: fundamentalConfig,
  technical: technicalConfig,
  dataTracking: dataTrackingConfig,
  news: newsConfig,
  committee: committeeConfig,
};

export const ALL_AGENT_IDS: AgentId[] = ['fundamental', 'technical', 'dataTracking', 'news', 'committee'];

export class Orchestrator {
  private agents: Map<AgentId, BaseAgent>;
  private tasks: ResearchTask[];

  constructor() {
    this.agents = new Map();
    this.agents.set('fundamental', createFundamentalAgent());
    this.agents.set('technical', createTechnicalAgent());
    this.agents.set('dataTracking', createDataTrackingAgent());
    this.agents.set('news', createNewsAgent());
    this.agents.set('committee', createCommitteeAgent());
    this.tasks = [];
  }

  getAgent(id: AgentId): BaseAgent {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent ${id} not found`);
    return agent;
  }

  getAgentConfig(id: AgentId): AgentConfig {
    return AGENT_CONFIGS[id];
  }

  async chatWithAgent(
    agentId: AgentId,
    message: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const agent = this.getAgent(agentId);
    return agent.chat(message, onStream);
  }

  async routeQuery(query: string): Promise<AgentId[]> {
    const routingPrompt = `你是一个投研中台的任务路由器。根据用户的问题，判断应该分配给哪些Agent来处理。

可用的Agent:
- fundamental: 基本面研究（公司分析、财务、估值、商业模式、竞争格局）
- technical: 技术分析（价格走势、技术指标、图表形态、支撑阻力）
- dataTracking: 数据追踪（宏观数据、行业数据、运营指标、另类数据）
- news: 新闻与信息（新闻分析、事件影响、情绪分析、信息源评估）
- committee: 投委会（综合评估、投资决策、风险管理、仓位建议）

请只返回需要调用的Agent ID列表，用逗号分隔。如果需要综合分析，可以返回多个。
例如: fundamental,technical
例如: news
例如: fundamental,technical,dataTracking,news,committee

只返回ID列表，不要其他文字。`;

    try {
      const response = await callGemini(routingPrompt, [
        { role: 'user', parts: [{ text: query }] },
      ]);

      const ids = response
        .trim()
        .split(',')
        .map(s => s.trim())
        .filter(s => ALL_AGENT_IDS.includes(s as AgentId)) as AgentId[];

      return ids.length > 0 ? ids : ['committee'];
    } catch {
      return this.fallbackRouting(query);
    }
  }

  private fallbackRouting(query: string): AgentId[] {
    const lower = query.toLowerCase();
    const agents: AgentId[] = [];

    if (/基本面|财务|估值|商业模式|护城河|revenue|earnings|valuation|dcf|pe|pb/.test(lower)) {
      agents.push('fundamental');
    }
    if (/技术|k线|macd|rsi|支撑|阻力|趋势|形态|均线|布林/.test(lower)) {
      agents.push('technical');
    }
    if (/数据|追踪|track|指标|pmi|cpi|gdp|出货量|库存|增速/.test(lower)) {
      agents.push('dataTracking');
    }
    if (/新闻|消息|事件|舆情|情绪|sentiment|公告|announcement/.test(lower)) {
      agents.push('news');
    }
    if (/投委|决策|建议|买入|卖出|仓位|风险|组合|portfolio/.test(lower)) {
      agents.push('committee');
    }

    if (agents.length === 0) agents.push('committee');
    return agents;
  }

  async runMultiAgentTask(
    query: string,
    targetAgents: AgentId[],
    onAgentStart?: (agentId: AgentId) => void,
    onAgentComplete?: (agentId: AgentId, result: string) => void
  ): Promise<ResearchTask> {
    const task: ResearchTask = {
      id: `task_${Date.now()}`,
      query,
      targetAgents,
      status: 'running',
      results: {},
      createdAt: Date.now(),
    };
    this.tasks.push(task);

    const promises = targetAgents
      .filter(id => id !== 'committee')
      .map(async (agentId) => {
        onAgentStart?.(agentId);
        try {
          const result = await this.chatWithAgent(agentId, query);
          task.results[agentId] = result;
          onAgentComplete?.(agentId, result);
        } catch (error) {
          task.results[agentId] = `分析失败: ${error instanceof Error ? error.message : '未知错误'}`;
          onAgentComplete?.(agentId, task.results[agentId]);
        }
      });

    await Promise.all(promises);

    if (targetAgents.includes('committee') && Object.keys(task.results).length > 0) {
      onAgentStart?.('committee');
      const synthesisPrompt = this.buildSynthesisPrompt(query, task.results);
      try {
        const result = await this.chatWithAgent('committee', synthesisPrompt);
        task.results['committee'] = result;
        onAgentComplete?.('committee', result);
      } catch (error) {
        task.results['committee'] = `综合分析失败: ${error instanceof Error ? error.message : '未知错误'}`;
        onAgentComplete?.('committee', task.results['committee']);
      }
    }

    task.status = 'completed';
    task.completedAt = Date.now();
    return task;
  }

  private buildSynthesisPrompt(query: string, results: Record<string, string>): string {
    let prompt = `请作为投委会主席，综合以下各Agent的分析结果，给出最终的投资建议。

## 原始问题
${query}

## 各Agent分析结果
`;
    for (const [agentId, result] of Object.entries(results)) {
      const config = AGENT_CONFIGS[agentId as AgentId];
      if (config) {
        prompt += `\n### ${config.nameZh} (${config.name})\n${result}\n`;
      }
    }

    prompt += `\n## 请综合以上分析，输出投资委员会评估报告（包含评分卡、核心逻辑、风险、建议）。`;
    return prompt;
  }

  clearAgentHistory(agentId: AgentId) {
    this.getAgent(agentId).clearHistory();
  }

  clearAllHistory() {
    for (const agent of this.agents.values()) {
      agent.clearHistory();
    }
  }
}
