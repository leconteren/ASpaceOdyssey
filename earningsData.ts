
import { EarningsSeason, EarningsCompany, SectorReport, WeeklyEarnings } from './earningsTypes';

// ===== Q4 2024 Earnings Season Sample Data =====

const WEEK1_COMPANIES: EarningsCompany[] = [
  {
    ticker: 'MSFT',
    name: 'Microsoft',
    sector: 'software',
    reportDate: '2025-01-29',
    reportTime: 'AMC',
    estRevenue: '$68.8B',
    estEPS: '$3.11',
    actualRevenue: '$69.6B',
    actualEPS: '$3.23',
    result: 'beat',
    highlights: [
      '智能云收入$25.5B，同比+19%',
      'Azure收入增长31%，其中AI贡献13个百分点',
      'Copilot商业客户数同比翻倍',
    ],
    aiHighlights: [
      'Azure AI收入run rate突破$13B annualized',
      'AI需求超出供给，正在加速数据中心扩建',
      'Copilot付费用户增长非常强劲，企业adoption加速',
      'Nadella: "We are transitioning from talk of AI to scaling of AI"',
    ],
    guidanceNote: 'Q3指引Azure增速31-32%，高于一致预期30%，CapEx继续上升',
    priceChangeOnReport: -6.2,
    priceChangeSinceReport: -3.8,
    stockReaction: 'down',
  },
  {
    ticker: 'META',
    name: 'Meta Platforms',
    sector: 'internet',
    reportDate: '2025-01-29',
    reportTime: 'AMC',
    estRevenue: '$47.0B',
    estEPS: '$6.73',
    actualRevenue: '$48.4B',
    actualEPS: '$8.02',
    result: 'beat',
    highlights: [
      '广告收入$46.8B，同比+21%',
      'DAP(Daily Active People) 33.5亿',
      'Reality Labs亏损收窄至$4.97B',
    ],
    aiHighlights: [
      '2025年CapEx指引$60-65B，大幅高于预期$51B',
      'Llama 4模型将于2025年发布',
      'AI推荐引擎驱动Instagram Reels用户时长+8%',
      'Zuckerberg: "2025 will be a defining year for AI at Meta"',
    ],
    guidanceNote: 'Q1收入指引$39.5-41.8B，mid高于预期；全年CapEx $60-65B吓到市场',
    priceChangeOnReport: -1.2,
    priceChangeSinceReport: +4.5,
    stockReaction: 'down',
  },
  {
    ticker: 'TSLA',
    name: 'Tesla',
    sector: 'consumer',
    reportDate: '2025-01-29',
    reportTime: 'AMC',
    estRevenue: '$27.2B',
    estEPS: '$0.76',
    actualRevenue: '$25.7B',
    actualEPS: '$0.73',
    result: 'miss',
    highlights: [
      '汽车交付量1.79M，略低于预期',
      '汽车毛利率16.3%，环比改善',
      '能源存储业务收入创新高',
    ],
    aiHighlights: [
      'FSD v13进展顺利，计划2025年推出unsupervised FSD',
      'Robotaxi计划2025年6月在Austin启动',
      'Optimus人形机器人开始内部工厂部署',
      'Musk: "Autonomy is going to be the biggest asset value increase in history"',
    ],
    guidanceNote: '预计2025年交付量增长20-30%，主要靠affordable model',
    priceChangeOnReport: +2.1,
    priceChangeSinceReport: +8.3,
    stockReaction: 'up',
  },
  {
    ticker: 'AAPL',
    name: 'Apple',
    sector: 'consumer',
    reportDate: '2025-01-30',
    reportTime: 'AMC',
    estRevenue: '$124.1B',
    estEPS: '$2.35',
    actualRevenue: '$124.3B',
    actualEPS: '$2.40',
    result: 'beat',
    highlights: [
      'iPhone收入$69.1B，同比+1%',
      'Services收入$26.3B，新高，同比+14%',
      '大中华区收入$18.5B，同比-11%仍承压',
    ],
    aiHighlights: [
      'Apple Intelligence已在主要市场推出',
      'Siri升级版搭载LLM，用户engagement提升显著',
      'AI功能驱动iPhone升级周期开启',
      'Tim Cook: "Apple Intelligence is the most significant evolution of our platforms"',
    ],
    guidanceNote: 'Q2指引mid single digit growth，Services继续高增',
    priceChangeOnReport: -3.4,
    priceChangeSinceReport: -5.2,
    stockReaction: 'down',
  },
];

const WEEK2_COMPANIES: EarningsCompany[] = [
  {
    ticker: 'GOOGL',
    name: 'Alphabet',
    sector: 'internet',
    reportDate: '2025-02-04',
    reportTime: 'AMC',
    estRevenue: '$96.6B',
    estEPS: '$2.12',
    actualRevenue: '$96.5B',
    actualEPS: '$2.15',
    result: 'inline',
    highlights: [
      'Search广告收入$54B，同比+12%',
      'YouTube广告收入$10.5B，同比+13%',
      'Google Cloud收入$12.0B，同比+30%',
    ],
    aiHighlights: [
      'Gemini 2.0系列模型推出，性能超GPT-4',
      'Google Cloud AI收入run rate超$10B',
      'AI Overview覆盖所有Search用户，CTR提升',
      'Pichai: "AI is the most profound technology shift of our lifetimes, and we are well positioned"',
    ],
    guidanceNote: 'Cloud增速略低于预期引发担忧，但AI势头强劲',
    priceChangeOnReport: -7.5,
    priceChangeSinceReport: -9.1,
    stockReaction: 'down',
  },
  {
    ticker: 'AMZN',
    name: 'Amazon',
    sector: 'internet',
    reportDate: '2025-02-06',
    reportTime: 'AMC',
    estRevenue: '$187.3B',
    estEPS: '$1.49',
    actualRevenue: '$187.8B',
    actualEPS: '$1.86',
    result: 'beat',
    highlights: [
      'AWS收入$28.8B，同比+19%',
      'North America operating margin 7.4%，持续改善',
      '广告业务$17.3B，同比+18%',
    ],
    aiHighlights: [
      'AWS AI服务ARR超过百亿美元',
      'Custom chip Trainium2开始量产',
      'Bedrock模型调用量同比5x增长',
      'Jassy: "AI is going to be the largest technology shift of our era, maybe ever"',
    ],
    guidanceNote: 'Q1 operating income指引$14-18B vs 预期$18.2B，略低',
    priceChangeOnReport: -4.1,
    priceChangeSinceReport: -2.3,
    stockReaction: 'down',
  },
  {
    ticker: 'ARM',
    name: 'Arm Holdings',
    sector: 'semiconductor',
    reportDate: '2025-02-05',
    reportTime: 'AMC',
    estRevenue: '$0.95B',
    estEPS: '$0.34',
    actualRevenue: '$0.98B',
    actualEPS: '$0.39',
    result: 'beat',
    highlights: [
      '许可证收入$0.53B，同比+53%',
      '版税收入$0.55B，同比+14%',
      'v9架构adoption加速',
    ],
    aiHighlights: [
      'AI服务器CPU采用率提升，几乎所有AI芯片基于ARM架构',
      'CSS (Compute Subsystem) for AI在数据中心traction强劲',
      'Rene Haas: "ARM is the compute platform for the age of AI"',
    ],
    guidanceNote: 'Q4指引收入$1.18-1.28B，大幅高于预期$1.03B',
    priceChangeOnReport: +8.5,
    priceChangeSinceReport: +12.3,
    stockReaction: 'up',
  },
];

const WEEK3_COMPANIES: EarningsCompany[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    sector: 'semiconductor',
    reportDate: '2025-02-26',
    reportTime: 'AMC',
    estRevenue: '$38.0B',
    estEPS: '$0.84',
    result: 'pending',
    highlights: [],
    aiHighlights: [],
    guidanceNote: '',
    stockReaction: undefined,
  },
  {
    ticker: 'CRM',
    name: 'Salesforce',
    sector: 'software',
    reportDate: '2025-02-26',
    reportTime: 'AMC',
    estRevenue: '$10.0B',
    estEPS: '$2.61',
    result: 'pending',
    highlights: [],
    aiHighlights: [],
  },
  {
    ticker: 'SNOW',
    name: 'Snowflake',
    sector: 'software',
    reportDate: '2025-02-26',
    reportTime: 'AMC',
    estRevenue: '$0.92B',
    estEPS: '$0.18',
    result: 'pending',
    highlights: [],
    aiHighlights: [],
  },
];

const WEEK4_COMPANIES: EarningsCompany[] = [
  {
    ticker: 'AVGO',
    name: 'Broadcom',
    sector: 'semiconductor',
    reportDate: '2025-03-06',
    reportTime: 'AMC',
    estRevenue: '$14.6B',
    estEPS: '$1.49',
    result: 'pending',
    highlights: [],
    aiHighlights: [],
  },
  {
    ticker: 'MRVL',
    name: 'Marvell Technology',
    sector: 'semiconductor',
    reportDate: '2025-03-06',
    reportTime: 'AMC',
    estRevenue: '$1.85B',
    estEPS: '$0.59',
    result: 'pending',
    highlights: [],
    aiHighlights: [],
  },
];

// ===== Build Weeks =====

const WEEKS: WeeklyEarnings[] = [
  {
    weekLabel: 'W5 (Jan 27 - Jan 31)',
    weekStart: '2025-01-27',
    weekEnd: '2025-01-31',
    companies: WEEK1_COMPANIES,
    sentimentSummary: '4家报告，3 beat 1 miss；但仅TSLA上涨，整体情绪偏谨慎。市场对AI CapEx大幅上升产生担忧（META $60-65B指引），虽然AI业务增速亮眼，投资者更关注短期盈利压力。',
  },
  {
    weekLabel: 'W6 (Feb 3 - Feb 7)',
    weekStart: '2025-02-03',
    weekEnd: '2025-02-07',
    companies: WEEK2_COMPANIES,
    sentimentSummary: '3家报告，2 beat 1 inline；但仅ARM大涨，GOOGL和AMZN均下跌。Cloud增速不及预期成为核心担忧。ARM作为AI算力基础设施的角色获得市场认可。',
  },
  {
    weekLabel: 'W9 (Feb 24 - Feb 28)',
    weekStart: '2025-02-24',
    weekEnd: '2025-02-28',
    companies: WEEK3_COMPANIES,
    sentimentSummary: '本周重磅：NVDA业绩，市场最关注Blackwell出货节奏和下季度指引。',
  },
  {
    weekLabel: 'W10 (Mar 3 - Mar 7)',
    weekStart: '2025-03-03',
    weekEnd: '2025-03-07',
    companies: WEEK4_COMPANIES,
    sentimentSummary: '半导体ASIC双雄AVGO和MRVL同周发布，关注AI custom silicon需求趋势。',
  },
];

// ===== Build Sector Reports =====

function buildSectorReport(companies: EarningsCompany[]): SectorReport[] {
  const sectorMap = new Map<string, EarningsCompany[]>();
  companies.forEach(c => {
    if (c.result === 'pending') return;
    const arr = sectorMap.get(c.sector) || [];
    arr.push(c);
    sectorMap.set(c.sector, arr);
  });

  const reports: SectorReport[] = [];

  // Internet
  const internetCos = sectorMap.get('internet') || [];
  if (internetCos.length) {
    reports.push({
      sector: 'internet',
      companies: internetCos,
      beatCount: internetCos.filter(c => c.result === 'beat').length,
      missCount: internetCos.filter(c => c.result === 'miss').length,
      inlineCount: internetCos.filter(c => c.result === 'inline').length,
      avgPriceReaction: avg(internetCos.map(c => c.priceChangeOnReport || 0)),
      positiveReactionCount: internetCos.filter(c => (c.priceChangeOnReport || 0) > 0).length,
      summary: '互联网板块整体业绩超预期，但stock performance疲弱。核心矛盾在于AI CapEx大幅上升（META $60-65B, GOOGL持续加大投入）对近期利润率的压制。广告业务依然健康增长，但市场更关注AI投入的回报周期。',
      aiThemes: [
        'AI CapEx军备竞赛全面升级，META/GOOGL/AMZN累计CapEx指引超$200B',
        'AI推荐引擎显著提升用户engagement和广告效率',
        'Cloud AI服务增速强劲但市场期望更高',
        '生成式AI产品（Copilot, Gemini, Meta AI）开始货币化',
      ],
    });
  }

  // Software
  const softwareCos = sectorMap.get('software') || [];
  if (softwareCos.length) {
    reports.push({
      sector: 'software',
      companies: softwareCos,
      beatCount: softwareCos.filter(c => c.result === 'beat').length,
      missCount: softwareCos.filter(c => c.result === 'miss').length,
      inlineCount: softwareCos.filter(c => c.result === 'inline').length,
      avgPriceReaction: avg(softwareCos.map(c => c.priceChangeOnReport || 0)),
      positiveReactionCount: softwareCos.filter(c => (c.priceChangeOnReport || 0) > 0).length,
      summary: '软件板块以MSFT为代表，Azure AI增长亮眼（AI贡献13ppts），Copilot付费用户翻倍。但高额CapEx指引让市场担忧利润率扩张放缓，股价承压。',
      aiThemes: [
        'Copilot/AI assistant产品开始大规模企业部署',
        'AI native SaaS公司增速显著快于传统SaaS',
        'AI agent概念成为下一波软件创新方向',
      ],
    });
  }

  // Semiconductor
  const semiCos = sectorMap.get('semiconductor') || [];
  if (semiCos.length) {
    reports.push({
      sector: 'semiconductor',
      companies: semiCos,
      beatCount: semiCos.filter(c => c.result === 'beat').length,
      missCount: semiCos.filter(c => c.result === 'miss').length,
      inlineCount: semiCos.filter(c => c.result === 'inline').length,
      avgPriceReaction: avg(semiCos.map(c => c.priceChangeOnReport || 0)),
      positiveReactionCount: semiCos.filter(c => (c.priceChangeOnReport || 0) > 0).length,
      summary: '半导体板块受益于AI算力需求，ARM指引大超预期。AI芯片需求远超供给，ARM架构在AI领域的统治地位进一步巩固。NVDA和AVGO的业绩将是后续关键催化剂。',
      aiThemes: [
        'AI算力需求持续供不应求',
        'Custom ASIC (TPU, Trainium, etc.) 成为GPU之外的重要增长引擎',
        'ARM架构在AI服务器CPU领域渗透率快速提升',
        'HBM和先进封装成为半导体产业链关键瓶颈',
      ],
    });
  }

  // Consumer
  const consumerCos = sectorMap.get('consumer') || [];
  if (consumerCos.length) {
    reports.push({
      sector: 'consumer',
      companies: consumerCos,
      beatCount: consumerCos.filter(c => c.result === 'beat').length,
      missCount: consumerCos.filter(c => c.result === 'miss').length,
      inlineCount: consumerCos.filter(c => c.result === 'inline').length,
      avgPriceReaction: avg(consumerCos.map(c => c.priceChangeOnReport || 0)),
      positiveReactionCount: consumerCos.filter(c => (c.priceChangeOnReport || 0) > 0).length,
      summary: 'TSLA miss但靠FSD/Robotaxi叙事股价逆势上涨；AAPL beat但中国区持续承压导致股价下跌。消费板块分化明显：AI叙事驱动 > 短期业绩表现。',
      aiThemes: [
        'FSD/Robotaxi叙事成为TSLA估值核心驱动',
        'Apple Intelligence推动iPhone换机周期',
        '端侧AI成为消费电子核心卖点',
        'AI对消费行为的影响开始显现',
      ],
    });
  }

  return reports;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// ===== Export Season Data =====

const allReportedCompanies = [...WEEK1_COMPANIES, ...WEEK2_COMPANIES].filter(c => c.result !== 'pending');

export const EARNINGS_SEASON: EarningsSeason = {
  label: 'Q4 2024 Earnings Season (Jan-Mar 2025)',
  phase: 'active',
  weeks: WEEKS,
  sectorReports: buildSectorReport(allReportedCompanies),
  overallSentiment: '整体情绪：谨慎偏空。已报告7家公司中5家beat/inline，但仅2家股价上涨（TSLA +2.1%, ARM +8.5%）。Beat ratio 71%，但positive reaction ratio仅29%，说明市场已经price in了较高预期。核心矛盾：AI增长确定性高 vs AI CapEx压制短期利润率。',
};
