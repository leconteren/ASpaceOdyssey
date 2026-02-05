
export type AgentId = 'ideaSourcing' | 'fundamental' | 'technical' | 'dataTracking' | 'riskControl' | 'committee';

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  agentId?: AgentId;
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  nameZh: string;
  description: string;
  systemPrompt: string;
  icon: string;
  color: string;
  capabilities: string[];
}

export interface AgentState {
  id: AgentId;
  isLoading: boolean;
  messages: AgentMessage[];
  lastActive: number | null;
}

export interface ResearchTask {
  id: string;
  query: string;
  targetAgents: AgentId[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Record<string, string>;
  createdAt: number;
  completedAt?: number;
}

// 用户Profile - 所有Agent共享的背景信息
export const USER_PROFILE = `
## 用户背景 Profile

**身份**: 从互联网大厂战略投资(一级市场)转二级市场的投资人，目前正在尝试主动管理Book，处于从PA到基金管理人的角色转变期。

**擅长领域**:
- 互联网行业（核心能力圈）
- 半导体、周期（正在学习，还是小白）
- 宏观经济（基本不懂）

**投资风格**:
- 喜欢深度研究、重仓，每年1-2次conviction bet
- 持有周期根据赔率决定，喜欢看长但灵活
- 下注规则：赔率5:1时开始重仓，下跌则加注，极限情况可double down
- 喜欢找另类input建立有意思的insight
- 投资理念："首先要有趣，然后才是赚钱"

**性格特点**:
- 喜欢非共识观点，对另类数据源有兴趣
- 有时情绪化：上头追高，或低点时恐惧
- 角色转变期，下注时容易"手抖"
- 不太懂风控，book波动较大

**需要AI帮助的地方**:
1. 克服情绪化交易
2. 建立风控体系
3. 在关键时刻执行投资纪律
4. source另类/非共识的投资idea
5. 自动化日常追踪工作
`;
