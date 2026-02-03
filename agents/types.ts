
export type AgentId = 'fundamental' | 'technical' | 'dataTracking' | 'news' | 'committee';

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
