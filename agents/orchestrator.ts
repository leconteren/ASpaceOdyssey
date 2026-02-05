
import { AgentId, AgentConfig, ResearchTask } from './types';
import { BaseAgent } from './baseAgent';
import { createIdeaSourcingAgent, ideaSourcingConfig } from './ideaSourcingAgent';
import { createFundamentalAgent, fundamentalConfig } from './fundamentalAgent';
import { createTechnicalAgent, technicalConfig } from './technicalAgent';
import { createDataTrackingAgent, dataTrackingConfig } from './dataTrackingAgent';
import { createRiskControlAgent, riskControlConfig } from './riskControlAgent';
import { createCommitteeAgent, committeeConfig } from './committeeAgent';
import { callGemini } from './aiService';

export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  ideaSourcing: ideaSourcingConfig,
  fundamental: fundamentalConfig,
  technical: technicalConfig,
  dataTracking: dataTrackingConfig,
  riskControl: riskControlConfig,
  committee: committeeConfig,
};

export const ALL_AGENT_IDS: AgentId[] = [
  'ideaSourcing',
  'fundamental',
  'technical',
  'dataTracking',
  'riskControl',
  'committee',
];

export class Orchestrator {
  private agents: Map<AgentId, BaseAgent>;
  private tasks: ResearchTask[];

  constructor() {
    this.agents = new Map();
    this.agents.set('ideaSourcing', createIdeaSourcingAgent());
    this.agents.set('fundamental', createFundamentalAgent());
    this.agents.set('technical', createTechnicalAgent());
    this.agents.set('dataTracking', createDataTrackingAgent());
    this.agents.set('riskControl', createRiskControlAgent());
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
    const routingPrompt = `你是投研中台的任务路由器。根据用户的问题，判断应该分配给哪些Agent来处理。

可用的Agent:
- ideaSourcing: Idea挖掘（寻找投资机会、非共识观点、另类信号、市场扫描）
- fundamental: 基本面研究（公司分析、商业模式、财务、估值、产业趋势）
- technical: 技术与择时（价格走势、支撑阻力、入场时机、赔率评估）
- dataTracking: 数据追踪（追踪指标、数据更新、Dashboard设计）
- riskControl: 风控与纪律（仓位管理、风险评估、情绪检测、交易检查）
- committee: 投委会（综合评估、投资决策、观点challenge、最终建议）

请只返回需要调用的Agent ID列表，用逗号分隔。
- 如果是找投资机会：ideaSourcing
- 如果是研究一个公司：fundamental
- 如果是问入场时机：technical
- 如果是设计追踪体系：dataTracking
- 如果是风控/仓位问题：riskControl
- 如果需要综合判断：committee
- 如果需要全面分析：fundamental,technical,dataTracking,riskControl,committee

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

    if (/idea|机会|推荐|找|挖掘|非共识|另类|冷门/.test(lower)) {
      agents.push('ideaSourcing');
    }
    if (/分析|基本面|财务|估值|商业模式|护城河|revenue|earnings|valuation|dcf|pe|pb|公司/.test(lower)) {
      agents.push('fundamental');
    }
    if (/技术|k线|macd|rsi|支撑|阻力|趋势|形态|均线|入场|时机|价格/.test(lower)) {
      agents.push('technical');
    }
    if (/数据|追踪|track|指标|dashboard|监控/.test(lower)) {
      agents.push('dataTracking');
    }
    if (/风控|风险|仓位|止损|情绪|纪律|检查|回撤/.test(lower)) {
      agents.push('riskControl');
    }
    if (/投委|决策|建议|买入|卖出|challenge|评估|综合/.test(lower)) {
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

    // Run non-committee agents first (in parallel)
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

    // Run committee last with synthesis
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
    let prompt = `作为投委会，请综合以下各Agent的分析结果，给出最终的投资委员会评估。

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

    prompt += `
## 请输出投委会评估报告

1. 综合各方观点
2. 指出潜在的盲点和风险
3. 给出投委会评分卡
4. 最终投资建议`;

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
