
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

export type ViewType = 'feed' | 'market' | 'chart' | 'profile';
