
export interface User {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  points: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  dateStr: string;
}

export type PredictionChoice = 0 | 1; // 0: No/Loss, 1: Yes/Win

export interface Vote {
  userId: string;
  choice: PredictionChoice;
}

export interface PredictionEvent {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  createdAt: number;
  solveDate: number;
  status: 'active' | 'solved';
  finalResult?: PredictionChoice;
  votes: Vote[];
}

export type ViewType = 'feed' | 'market' | 'correlation' | 'profile';

// Stock Correlation Agent Types
export interface CorrelationPair {
  ticker1: string;
  ticker2: string;
  correlation: number;
  explanation: string;
}

export interface CorrelationAnalysis {
  tickers: string[];
  matrix: number[][];
  pairs: CorrelationPair[];
  summary: string;
  marketInsights: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  analysis?: CorrelationAnalysis;
  timestamp: number;
}
