
export interface User {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  points: number;
}

export type PromptCategory =
  | 'coding'
  | 'writing'
  | 'analysis'
  | 'creative'
  | 'business'
  | 'education'
  | 'productivity'
  | 'other';

export interface Prompt {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  description: string;
  category: PromptCategory;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  likes: string[]; // user IDs who liked
  forks: number;
  usageCount: number;
}

export type ViewType = 'notebook' | 'marketplace' | 'profile';

export type SortOption = 'newest' | 'popular' | 'most_used';
