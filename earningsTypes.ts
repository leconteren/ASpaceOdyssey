
// ===== Earnings Call Agent Types =====

export type Sector = 'internet' | 'software' | 'semiconductor' | 'consumer' | 'cloud' | 'other';

export const SECTOR_LABELS: Record<Sector, string> = {
  internet: '互联网',
  software: '软件',
  semiconductor: '半导体',
  consumer: '消费',
  cloud: '云计算',
  other: '其他',
};

export type EarningsResult = 'beat' | 'miss' | 'inline' | 'pending';
export type StockReaction = 'up' | 'down' | 'flat';
export type EarningsSeasonPhase = 'preview' | 'active' | 'review';

export interface EarningsCompany {
  ticker: string;
  name: string;
  sector: Sector;
  reportDate: string;           // YYYY-MM-DD
  reportTime: 'BMO' | 'AMC';   // Before Market Open / After Market Close
  // Consensus estimates
  estRevenue: string;           // e.g. "$96.5B"
  estEPS: string;               // e.g. "$2.35"
  // Actual results (filled after report)
  actualRevenue?: string;
  actualEPS?: string;
  result?: EarningsResult;
  // Key highlights from earnings call
  highlights?: string[];
  aiHighlights?: string[];       // AI-specific mentions
  guidanceNote?: string;         // Forward guidance summary
  // Stock reaction
  priceChangeOnReport?: number;  // % change day of / day after report
  priceChangeSinceReport?: number; // cumulative % since report
  stockReaction?: StockReaction;
}

export interface WeeklyEarnings {
  weekLabel: string;            // e.g. "2025-W5 (Jan 27 - Jan 31)"
  weekStart: string;
  weekEnd: string;
  companies: EarningsCompany[];
  sentimentSummary?: string;    // Overall weekly sentiment
}

export interface SectorReport {
  sector: Sector;
  companies: EarningsCompany[];
  beatCount: number;
  missCount: number;
  inlineCount: number;
  avgPriceReaction: number;
  positiveReactionCount: number;
  summary: string;
  aiThemes: string[];
}

export interface EarningsSeason {
  label: string;               // e.g. "Q4 2024 Earnings Season"
  phase: EarningsSeasonPhase;
  weeks: WeeklyEarnings[];
  sectorReports: SectorReport[];
  overallSentiment: string;
}

export type EarningsSubView = 'preview' | 'summary' | 'tracker' | 'report';
