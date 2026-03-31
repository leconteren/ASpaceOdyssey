
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

export type ViewType = 'feed' | 'market' | 'profile' | 'dashboard';

export type SignalStatus = 'augmentation' | 'replacement' | 'neutral';

export interface MetricDataPoint {
  date: string;
  value: number;
  value2?: number; // secondary axis (e.g. wage for QCEW)
}

export interface MetricConfig {
  id: string;
  name: string;
  nameCn: string;
  source: string;
  frequency: string;
  unit: string;
  unit2?: string;
  color: string;
  color2?: string;
  augmentationDesc: string;
  replacementDesc: string;
  chartType: 'line' | 'area' | 'bar' | 'dual-line';
}
