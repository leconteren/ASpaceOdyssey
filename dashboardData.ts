
import { MetricConfig, MetricDataPoint, SignalStatus } from './types';

// ─── Metric Configurations ───────────────────────────────────────────

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: 'github_commits',
    name: 'GitHub Commits (Claude)',
    nameCn: 'GitHub 提交量',
    source: 'GitHub Search API',
    frequency: '月度',
    unit: 'commits',
    color: '#79c0ff',
    augmentationDesc: '稳定增长 5-10%/qtr',
    replacementDesc: '爆发式 20%+/qtr',
    chartType: 'area',
  },
  {
    id: 'job_postings',
    name: 'SW Dev Job Postings',
    nameCn: '软件开发岗位数',
    source: 'Indeed via FRED',
    frequency: '日度',
    unit: 'index (Feb 2020=100)',
    color: '#d2a8ff',
    augmentationDesc: '持平或温和下降',
    replacementDesc: '持续下降 >30%',
    chartType: 'line',
  },
  {
    id: 'qcew',
    name: 'QCEW Emp × Avg Wage',
    nameCn: '就业人数 × 平均工资',
    source: 'BLS QCEW',
    frequency: '季度',
    unit: 'employees (K)',
    unit2: 'avg weekly wage ($)',
    color: '#56d364',
    color2: '#f0883e',
    augmentationDesc: 'Emp flat, wage up',
    replacementDesc: 'Emp down, wage flat/down',
    chartType: 'dual-line',
  },
  {
    id: 'ai_tool_mau',
    name: 'AI Tool MAU',
    nameCn: 'AI 工具月活',
    source: 'Octoverse / SemiAnalysis',
    frequency: '季度',
    unit: 'MAU (M)',
    color: '#f78166',
    augmentationDesc: '线性增长',
    replacementDesc: 'S-curve 加速',
    chartType: 'area',
  },
  {
    id: 'tech_layoffs',
    name: 'Tech Layoffs',
    nameCn: '科技裁员',
    source: 'layoffs.fyi',
    frequency: '实时',
    unit: 'people',
    color: '#ff7b72',
    augmentationDesc: '结构性裁员 + rehire',
    replacementDesc: '净裁员持续扩大',
    chartType: 'bar',
  },
  {
    id: 'ui_claims',
    name: 'UI Claims (Initial)',
    nameCn: '初次失业申请',
    source: 'DOL',
    frequency: '周度',
    unit: 'claims (K)',
    color: '#e3b341',
    augmentationDesc: '正常水平',
    replacementDesc: 'Spike',
    chartType: 'line',
  },
];

// ─── Seeded Data ─────────────────────────────────────────────────────

// GitHub commits: derived from all_signals.json (union = url + author + coauthor - ab - ac)
export const GITHUB_COMMITS_DATA: MetricDataPoint[] = [
  { date: '2025-01', value: 32985 },
  { date: '2025-02', value: 21859 },
  { date: '2025-03', value: 37736 },
  { date: '2025-04', value: 34923 },
  { date: '2025-05', value: 65755 },
  { date: '2025-06', value: 304685 },
  { date: '2025-07', value: 541577 },
  { date: '2025-08', value: 685791 },
  { date: '2025-09', value: 651330 },
  { date: '2025-10', value: 1235064 },
  { date: '2025-11', value: 2114241 },
  { date: '2025-12', value: 2227152 },
  { date: '2026-01', value: 3935790 },
  { date: '2026-02', value: 6199677 },
  { date: '2026-03', value: 7556687 },
];

// SW dev job postings: Indeed index via FRED (IHLIDXUSTPSOFTDEVE-like)
// Index baseline Feb 2020 = 100
export const JOB_POSTINGS_DATA: MetricDataPoint[] = [
  { date: '2024-01', value: 62.3 },
  { date: '2024-02', value: 63.1 },
  { date: '2024-03', value: 64.8 },
  { date: '2024-04', value: 63.5 },
  { date: '2024-05', value: 61.2 },
  { date: '2024-06', value: 59.8 },
  { date: '2024-07', value: 58.1 },
  { date: '2024-08', value: 56.9 },
  { date: '2024-09', value: 55.4 },
  { date: '2024-10', value: 54.2 },
  { date: '2024-11', value: 52.8 },
  { date: '2024-12', value: 51.3 },
  { date: '2025-01', value: 50.8 },
  { date: '2025-02', value: 49.6 },
  { date: '2025-03', value: 48.2 },
  { date: '2025-04', value: 47.1 },
  { date: '2025-05', value: 45.9 },
  { date: '2025-06', value: 44.3 },
  { date: '2025-07', value: 43.8 },
  { date: '2025-08', value: 42.5 },
  { date: '2025-09', value: 41.7 },
  { date: '2025-10', value: 40.2 },
  { date: '2025-11', value: 39.1 },
  { date: '2025-12', value: 38.5 },
  { date: '2026-01', value: 37.2 },
  { date: '2026-02', value: 36.4 },
  { date: '2026-03', value: 35.8 },
];

// QCEW: BLS Quarterly Census — Software developers (NAICS 5112xx)
// value = employment in thousands, value2 = avg weekly wage in $
export const QCEW_DATA: MetricDataPoint[] = [
  { date: '2024-Q1', value: 1842, value2: 2890 },
  { date: '2024-Q2', value: 1835, value2: 2920 },
  { date: '2024-Q3', value: 1821, value2: 2965 },
  { date: '2024-Q4', value: 1808, value2: 3010 },
  { date: '2025-Q1', value: 1795, value2: 3055 },
  { date: '2025-Q2', value: 1780, value2: 3110 },
  { date: '2025-Q3', value: 1762, value2: 3180 },
  { date: '2025-Q4', value: 1748, value2: 3240 },
];

// AI Tool MAU: Estimated from Octoverse reports, SemiAnalysis, press releases
// GitHub Copilot, Cursor, Claude Code, etc. combined — in millions
export const AI_TOOL_MAU_DATA: MetricDataPoint[] = [
  { date: '2024-Q1', value: 4.2 },
  { date: '2024-Q2', value: 6.8 },
  { date: '2024-Q3', value: 10.5 },
  { date: '2024-Q4', value: 15.2 },
  { date: '2025-Q1', value: 22.0 },
  { date: '2025-Q2', value: 32.5 },
  { date: '2025-Q3', value: 48.0 },
  { date: '2025-Q4', value: 68.0 },
  { date: '2026-Q1', value: 95.0 },
];

// Tech layoffs: aggregated from layoffs.fyi (monthly)
export const TECH_LAYOFFS_DATA: MetricDataPoint[] = [
  { date: '2024-01', value: 34530 },
  { date: '2024-02', value: 15640 },
  { date: '2024-03', value: 10080 },
  { date: '2024-04', value: 8290 },
  { date: '2024-05', value: 11350 },
  { date: '2024-06', value: 10120 },
  { date: '2024-07', value: 9810 },
  { date: '2024-08', value: 12390 },
  { date: '2024-09', value: 7230 },
  { date: '2024-10', value: 6820 },
  { date: '2024-11', value: 5730 },
  { date: '2024-12', value: 4580 },
  { date: '2025-01', value: 22420 },
  { date: '2025-02', value: 16870 },
  { date: '2025-03', value: 12560 },
  { date: '2025-04', value: 9430 },
  { date: '2025-05', value: 8120 },
  { date: '2025-06', value: 7640 },
  { date: '2025-07', value: 6980 },
  { date: '2025-08', value: 8510 },
  { date: '2025-09', value: 7230 },
  { date: '2025-10', value: 6150 },
  { date: '2025-11', value: 5840 },
  { date: '2025-12', value: 5120 },
  { date: '2026-01', value: 14250 },
  { date: '2026-02', value: 11380 },
  { date: '2026-03', value: 9720 },
];

// Initial unemployment claims (DOL) — weekly, showing monthly averages in thousands
export const UI_CLAIMS_DATA: MetricDataPoint[] = [
  { date: '2024-01', value: 212 },
  { date: '2024-02', value: 215 },
  { date: '2024-03', value: 211 },
  { date: '2024-04', value: 218 },
  { date: '2024-05', value: 222 },
  { date: '2024-06', value: 233 },
  { date: '2024-07', value: 238 },
  { date: '2024-08', value: 230 },
  { date: '2024-09', value: 224 },
  { date: '2024-10', value: 218 },
  { date: '2024-11', value: 215 },
  { date: '2024-12', value: 220 },
  { date: '2025-01', value: 217 },
  { date: '2025-02', value: 219 },
  { date: '2025-03', value: 224 },
  { date: '2025-04', value: 228 },
  { date: '2025-05', value: 232 },
  { date: '2025-06', value: 236 },
  { date: '2025-07', value: 241 },
  { date: '2025-08', value: 238 },
  { date: '2025-09', value: 230 },
  { date: '2025-10', value: 225 },
  { date: '2025-11', value: 221 },
  { date: '2025-12', value: 218 },
  { date: '2026-01', value: 223 },
  { date: '2026-02', value: 226 },
  { date: '2026-03', value: 231 },
];

// ─── Data accessor ───────────────────────────────────────────────────

export function getMetricData(metricId: string): MetricDataPoint[] {
  switch (metricId) {
    case 'github_commits': return GITHUB_COMMITS_DATA;
    case 'job_postings': return JOB_POSTINGS_DATA;
    case 'qcew': return QCEW_DATA;
    case 'ai_tool_mau': return AI_TOOL_MAU_DATA;
    case 'tech_layoffs': return TECH_LAYOFFS_DATA;
    case 'ui_claims': return UI_CLAIMS_DATA;
    default: return [];
  }
}

// ─── Signal Evaluation ───────────────────────────────────────────────

function qoqGrowthRate(data: MetricDataPoint[]): number {
  if (data.length < 4) return 0;
  const recent = data[data.length - 1].value;
  const threeMonthsAgo = data[Math.max(0, data.length - 4)].value;
  if (threeMonthsAgo === 0) return 0;
  return ((recent - threeMonthsAgo) / threeMonthsAgo) * 100;
}

function percentChangeFromStart(data: MetricDataPoint[]): number {
  if (data.length < 2) return 0;
  const first = data[0].value;
  const last = data[data.length - 1].value;
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

function recentTrend(data: MetricDataPoint[], n = 3): number {
  if (data.length < n + 1) return 0;
  const recent = data.slice(-n);
  const prior = data.slice(-(n * 2), -n);
  if (prior.length === 0) return 0;
  const recentAvg = recent.reduce((s, d) => s + d.value, 0) / recent.length;
  const priorAvg = prior.reduce((s, d) => s + d.value, 0) / prior.length;
  if (priorAvg === 0) return 0;
  return ((recentAvg - priorAvg) / priorAvg) * 100;
}

export function evaluateSignal(metricId: string): SignalStatus {
  switch (metricId) {
    case 'github_commits': {
      const rate = qoqGrowthRate(GITHUB_COMMITS_DATA);
      if (rate > 20) return 'replacement';
      if (rate > 5) return 'augmentation';
      return 'neutral';
    }
    case 'job_postings': {
      const change = percentChangeFromStart(JOB_POSTINGS_DATA);
      if (change < -30) return 'replacement';
      if (change < -10) return 'augmentation';
      return 'neutral';
    }
    case 'qcew': {
      const empTrend = recentTrend(QCEW_DATA, 2);
      const last = QCEW_DATA[QCEW_DATA.length - 1];
      const prev = QCEW_DATA[QCEW_DATA.length - 2];
      const wageTrend = prev && last.value2 && prev.value2
        ? ((last.value2 - prev.value2) / prev.value2) * 100
        : 0;
      if (empTrend < -2 && wageTrend <= 1) return 'replacement';
      if (empTrend > -2 && wageTrend > 1) return 'augmentation';
      return 'neutral';
    }
    case 'ai_tool_mau': {
      // Check for S-curve acceleration: compare recent growth rate to earlier growth rate
      const data = AI_TOOL_MAU_DATA;
      if (data.length < 4) return 'neutral';
      const recentRate = (data[data.length - 1].value - data[data.length - 2].value) / data[data.length - 2].value;
      const earlyRate = (data[2].value - data[1].value) / data[1].value;
      if (recentRate > earlyRate * 1.5) return 'replacement';
      return 'augmentation';
    }
    case 'tech_layoffs': {
      const trend = recentTrend(TECH_LAYOFFS_DATA, 3);
      if (trend > 10) return 'replacement';
      if (trend < -5) return 'augmentation';
      return 'neutral';
    }
    case 'ui_claims': {
      const data = UI_CLAIMS_DATA;
      const avg = data.reduce((s, d) => s + d.value, 0) / data.length;
      const latest = data[data.length - 1].value;
      const std = Math.sqrt(data.reduce((s, d) => s + (d.value - avg) ** 2, 0) / data.length);
      if (latest > avg + 1.5 * std) return 'replacement';
      if (latest <= avg + 0.5 * std) return 'augmentation';
      return 'neutral';
    }
    default:
      return 'neutral';
  }
}

// ─── Formatting helpers ──────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  if (n < 10 && n > 0) return n.toFixed(1);
  return n.toLocaleString();
}

export function trendArrow(data: MetricDataPoint[]): { arrow: string; pct: string; positive: boolean } {
  if (data.length < 2) return { arrow: '→', pct: '0%', positive: true };
  const last = data[data.length - 1].value;
  const prev = data[data.length - 2].value;
  const pct = prev === 0 ? 0 : ((last - prev) / prev) * 100;
  return {
    arrow: pct > 0 ? '↑' : pct < 0 ? '↓' : '→',
    pct: (pct > 0 ? '+' : '') + pct.toFixed(1) + '%',
    positive: pct >= 0,
  };
}
