
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

// Stock Beta Analysis Agent Types
export interface TickerBeta {
  ticker: string;
  overallBeta: number;
  upsideBeta: number;
  downsideBeta: number;
  correlation: number;
  rSquared: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  explanation: string;
}

export interface BetaAnalysisReport {
  benchmark: string;
  benchmarkAnnualizedReturn: number;
  benchmarkAnnualizedVolatility: number;
  period: string;
  tickers: TickerBeta[];
  summary: string;
  riskInsights: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  report?: BetaAnalysisReport;
  timestamp: number;
}
