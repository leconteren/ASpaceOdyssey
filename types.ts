
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

export type ViewType = 'feed' | 'market' | 'profile' | 'digest';

// ============ AI Digest Dashboard Types ============

export type DigestCategory =
  | 'builder_insights'      // AI大V核心发言和观点
  | 'product_updates'       // AI公司产品/功能迭代
  | 'blog_articles'         // 博客类内容
  | 'podcast_interviews'    // 访谈类播客
  | 'news'                  // 新闻资讯
  | 'research';             // 研究和技术文章

export type SourceType =
  | 'twitter'
  | 'youtube'
  | 'blog'
  | 'website'
  | 'podcast';

export interface DigestSource {
  id: string;
  name: string;
  nameZh: string;           // 中文名称
  url: string;
  type: SourceType;
  category: DigestCategory;
  avatar?: string;
  description?: string;
  descriptionZh?: string;   // 中文描述
}

export interface DigestItem {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  category: DigestCategory;
  title: string;
  content: string;
  summary?: string;         // AI生成的摘要
  url: string;
  timestamp: number;
  dateStr: string;
  tags?: string[];
  engagement?: {
    likes?: number;
    retweets?: number;
    views?: number;
    comments?: number;
  };
  isHighlight?: boolean;    // 是否为重要内容
}

export interface DailyDigest {
  id: string;
  date: string;             // YYYY-MM-DD
  items: DigestItem[];
  highlights: DigestItem[]; // 当日亮点
  summary: string;          // AI生成的日报摘要
  categoryBreakdown: Record<DigestCategory, number>;
  generatedAt: number;
}

export interface WeeklyDigest {
  id: string;
  weekStart: string;        // YYYY-MM-DD
  weekEnd: string;          // YYYY-MM-DD
  dailyDigests: DailyDigest[];
  topHighlights: DigestItem[];
  weekSummary: string;      // AI生成的周报摘要
  trends: string[];         // 本周趋势
  generatedAt: number;
}

export interface DigestFilter {
  categories: DigestCategory[];
  sources: string[];
  dateRange: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}
