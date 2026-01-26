import { DigestItem, DailyDigest, WeeklyDigest, DigestCategory } from './types';
import { allSources, getSourceById } from './digestSources';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to get date string
const getDateStr = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper to get a random item from array
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Sample content templates for different categories
const sampleContent: Record<DigestCategory, string[]> = {
  builder_insights: [
    "We're seeing incredible progress in agent capabilities. The key is not just making them smarter, but making them more reliable and predictable.",
    "Just shipped a major update to our reasoning pipeline. The improvement in code generation is substantial - about 40% fewer errors on complex tasks.",
    "The future of AI isn't about replacing humans, it's about augmenting human capabilities in ways we haven't imagined yet.",
    "Hot take: The best AI products will be invisible. Users shouldn't need to think about the AI - it should just work.",
    "Spent the weekend testing the new multimodal capabilities. The gap between vision and language understanding is closing rapidly.",
    "Building AI products taught me: ship fast, iterate faster. User feedback is worth more than any benchmark.",
    "The most underrated aspect of LLMs: they're becoming excellent at understanding intent, not just following instructions.",
    "We're entering an era where AI can genuinely collaborate with humans on creative tasks. This changes everything for knowledge work.",
    "Interesting insight: smaller, specialized models often outperform larger general models for specific tasks. Context matters.",
    "The real breakthrough in AI safety isn't just alignment - it's building systems that know when to ask for help.",
  ],
  product_updates: [
    "Announcing GPT-5 Turbo with 2x faster inference and improved reasoning capabilities. Available now in API.",
    "Claude 4 is here! Featuring enhanced coding abilities, longer context windows, and better instruction following.",
    "Gemini 2.0 Flash now supports real-time multimodal interactions. Try it in Google AI Studio today.",
    "Introducing Llama 4: Our most capable open-source model yet. 400B parameters, available for download.",
    "New feature: Memory across conversations. Your AI assistant now remembers context from previous chats.",
    "Qwen-Max update: Now supporting 100+ languages with improved cultural context understanding.",
    "Kimi's new long-context model handles 2M tokens. Perfect for analyzing entire codebases.",
    "Launching MiniMax-VL: State-of-the-art vision-language model for video understanding.",
    "Claude Computer Use is now generally available. Build agents that can interact with any desktop application.",
    "OpenAI Operator: AI agents that can browse the web and complete tasks autonomously. Limited beta starting today.",
  ],
  blog_articles: [
    "Deep dive: How attention mechanisms evolved from Transformers to modern architectures. The journey to sparse attention.",
    "The state of AI in 2026: A comprehensive overview of progress, challenges, and what's next.",
    "Understanding chain-of-thought prompting: Why making AI 'think out loud' improves performance.",
    "Scaling laws revisited: What we've learned about model size, data, and compute in the past year.",
    "Building production-ready AI applications: Lessons from deploying to millions of users.",
    "The economics of AI: How falling inference costs are reshaping the technology landscape.",
    "Retrieval-Augmented Generation 2.0: New techniques for grounding AI in factual information.",
    "AI safety in practice: Real-world approaches to building trustworthy systems.",
    "The role of synthetic data in training next-generation models: Opportunities and pitfalls.",
    "From chatbots to agents: The evolution of AI application architectures.",
  ],
  podcast_interviews: [
    "New episode: Interview with the team behind Claude's personality. How do you make AI feel human?",
    "Deep dive with Google's AI safety team on the challenges of deploying powerful models responsibly.",
    "Exclusive: Former OpenAI researcher discusses the future of AI governance and regulation.",
    "This week: How startups are leveraging AI to disrupt traditional industries. 5 founders share their stories.",
    "Live from NeurIPS: Key takeaways and breakthrough papers you need to know about.",
    "The AI investment landscape: VCs discuss where the money is flowing and why.",
    "Building AI products that users love: A conversation with leading product managers in the space.",
    "The technical challenges of scaling AI infrastructure: Lessons from hyperscalers.",
    "AI in healthcare: Promising applications and the regulatory hurdles ahead.",
    "The open-source AI movement: Why some companies are betting big on transparency.",
  ],
  news: [
    "Breaking: OpenAI announces $10B funding round, valued at $300B.",
    "Anthropic expands to Europe with new research lab in London.",
    "Google DeepMind achieves breakthrough in protein folding prediction accuracy.",
    "EU AI Act enters full enforcement phase, affecting all major AI companies.",
    "China releases new guidelines for generative AI development and deployment.",
    "Meta open-sources new foundation model, challenges closed-source competitors.",
    "NVIDIA announces next-gen AI chips with 3x performance improvement.",
    "Microsoft integrates Copilot across entire Office 365 suite globally.",
    "Apple's AI push: New on-device models coming to all devices this fall.",
    "Startup raises $500M to build AI-powered coding assistant for enterprises.",
  ],
  research: [
    "New paper: Mixture-of-Experts at scale - Training trillion-parameter models efficiently.",
    "Research breakthrough: Self-improving AI systems that learn from their own mistakes.",
    "Stanford HAI releases comprehensive study on AI's economic impact across industries.",
    "Novel approach to AI alignment using Constitutional AI principles shows promising results.",
    "Breakthrough in few-shot learning: New technique achieves human-level performance with 10x less data.",
    "DeepMind publishes research on emergent capabilities in large language models.",
    "MIT researchers develop new framework for interpretable AI decision-making.",
    "Paper: The scaling hypothesis revisited - Evidence from frontier model development.",
    "New benchmark reveals gaps in AI systems' ability to handle real-world complexity.",
    "Research on AI-human collaboration shows optimal strategies for knowledge work.",
  ],
};

// Generate sample engagement metrics
const generateEngagement = () => ({
  likes: Math.floor(Math.random() * 50000) + 100,
  retweets: Math.floor(Math.random() * 10000) + 50,
  views: Math.floor(Math.random() * 500000) + 1000,
  comments: Math.floor(Math.random() * 1000) + 10,
});

// Generate a single digest item
export const generateDigestItem = (
  date: Date,
  category?: DigestCategory
): DigestItem => {
  const categoryToUse = category || (randomItem(Object.keys(sampleContent)) as DigestCategory);
  const sourcesForCategory = allSources.filter((s) => s.category === categoryToUse);
  const source = sourcesForCategory.length > 0
    ? randomItem(sourcesForCategory)
    : randomItem(allSources);

  const content = randomItem(sampleContent[categoryToUse]);
  const timestamp = date.getTime() - Math.floor(Math.random() * 86400000); // Random time within the day

  return {
    id: generateId(),
    sourceId: source.id,
    sourceName: source.nameZh || source.name,
    sourceType: source.type,
    category: categoryToUse,
    title: content.substring(0, 60) + (content.length > 60 ? '...' : ''),
    content,
    summary: content.length > 100 ? content.substring(0, 100) + '...' : content,
    url: source.url,
    timestamp,
    dateStr: getDateStr(new Date(timestamp)),
    tags: generateTags(categoryToUse),
    engagement: source.type === 'twitter' ? generateEngagement() : undefined,
    isHighlight: Math.random() > 0.7,
  };
};

// Generate tags based on category
const generateTags = (category: DigestCategory): string[] => {
  const tagPool: Record<DigestCategory, string[]> = {
    builder_insights: ['AI', 'LLM', 'Product', 'Startup', 'Engineering'],
    product_updates: ['Release', 'Update', 'Feature', 'API', 'Model'],
    blog_articles: ['Tutorial', 'Analysis', 'DeepDive', 'Technical', 'Opinion'],
    podcast_interviews: ['Interview', 'Discussion', 'Insights', 'Founders', 'Research'],
    news: ['Breaking', 'Funding', 'Regulation', 'Industry', 'Market'],
    research: ['Paper', 'Study', 'Benchmark', 'Breakthrough', 'Academic'],
  };

  const pool = tagPool[category];
  const numTags = Math.floor(Math.random() * 3) + 1;
  const tags: string[] = [];
  for (let i = 0; i < numTags; i++) {
    const tag = randomItem(pool);
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
};

// Generate items for a specific date
export const generateDailyItems = (date: Date, count: number = 20): DigestItem[] => {
  const items: DigestItem[] = [];
  const categories = Object.keys(sampleContent) as DigestCategory[];

  // Ensure at least some items from each category
  categories.forEach((category) => {
    const itemsPerCategory = Math.max(2, Math.floor(count / categories.length));
    for (let i = 0; i < itemsPerCategory; i++) {
      items.push(generateDigestItem(date, category));
    }
  });

  // Sort by timestamp descending
  return items.sort((a, b) => b.timestamp - a.timestamp);
};

// Generate a daily digest
export const generateDailyDigest = (date: Date): DailyDigest => {
  const items = generateDailyItems(date);
  const highlights = items.filter((item) => item.isHighlight);

  const categoryBreakdown = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<DigestCategory, number>);

  const summaryParts = [
    `今日共收录 ${items.length} 条AI资讯。`,
    highlights.length > 0 ? `重点关注 ${highlights.length} 条亮点内容。` : '',
    `产品更新 ${categoryBreakdown.product_updates || 0} 条，`,
    `大V观点 ${categoryBreakdown.builder_insights || 0} 条，`,
    `行业新闻 ${categoryBreakdown.news || 0} 条。`,
  ];

  return {
    id: generateId(),
    date: getDateStr(date),
    items,
    highlights,
    summary: summaryParts.join(''),
    categoryBreakdown,
    generatedAt: Date.now(),
  };
};

// Generate a weekly digest
export const generateWeeklyDigest = (weekEndDate: Date): WeeklyDigest => {
  const dailyDigests: DailyDigest[] = [];
  const weekStart = new Date(weekEndDate);
  weekStart.setDate(weekStart.getDate() - 6);

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dailyDigests.push(generateDailyDigest(date));
  }

  const allItems = dailyDigests.flatMap((d) => d.items);
  const topHighlights = allItems
    .filter((item) => item.isHighlight)
    .sort((a, b) => (b.engagement?.likes || 0) - (a.engagement?.likes || 0))
    .slice(0, 10);

  const totalItems = allItems.length;
  const categoryTotals = allItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trends = [
    '多模态AI能力持续提升，各大厂商竞相发布新功能',
    'AI Agent成为行业热点，自动化能力边界不断扩展',
    '开源模型性能逐渐逼近闭源模型，生态竞争加剧',
    'AI安全与监管话题热度上升，各国政策陆续出台',
    '企业级AI应用落地加速，B2B市场增长显著',
  ];

  return {
    id: generateId(),
    weekStart: getDateStr(weekStart),
    weekEnd: getDateStr(weekEndDate),
    dailyDigests,
    topHighlights,
    weekSummary: `本周共收录 ${totalItems} 条AI资讯。产品更新 ${categoryTotals.product_updates || 0} 条，大V观点 ${categoryTotals.builder_insights || 0} 条，博客文章 ${categoryTotals.blog_articles || 0} 条，播客访谈 ${categoryTotals.podcast_interviews || 0} 条，行业新闻 ${categoryTotals.news || 0} 条。`,
    trends: trends.slice(0, 3 + Math.floor(Math.random() * 3)),
    generatedAt: Date.now(),
  };
};

// Storage keys
const STORAGE_KEYS = {
  dailyDigests: 'ai_digest_daily',
  weeklyDigests: 'ai_digest_weekly',
  lastUpdate: 'ai_digest_last_update',
};

// Load digests from localStorage
export const loadDailyDigests = (): DailyDigest[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.dailyDigests);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const loadWeeklyDigests = (): WeeklyDigest[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.weeklyDigests);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save digests to localStorage
export const saveDailyDigests = (digests: DailyDigest[]): void => {
  localStorage.setItem(STORAGE_KEYS.dailyDigests, JSON.stringify(digests));
};

export const saveWeeklyDigests = (digests: WeeklyDigest[]): void => {
  localStorage.setItem(STORAGE_KEYS.weeklyDigests, JSON.stringify(digests));
};

// Check if we need to update (daily check)
export const needsUpdate = (): boolean => {
  const lastUpdate = localStorage.getItem(STORAGE_KEYS.lastUpdate);
  if (!lastUpdate) return true;

  const today = getDateStr(new Date());
  return lastUpdate !== today;
};

// Mark as updated
export const markUpdated = (): void => {
  localStorage.setItem(STORAGE_KEYS.lastUpdate, getDateStr(new Date()));
};

// Initialize or refresh digest data
export const initializeDigestData = (): { daily: DailyDigest; weekly: WeeklyDigest } => {
  const today = new Date();
  const daily = generateDailyDigest(today);
  const weekly = generateWeeklyDigest(today);

  // Load existing and add new
  const existingDaily = loadDailyDigests();
  const existingWeekly = loadWeeklyDigests();

  // Keep only last 30 days of daily digests
  const updatedDaily = [daily, ...existingDaily.filter((d) => d.date !== daily.date)].slice(0, 30);

  // Keep only last 4 weeks
  const updatedWeekly = [weekly, ...existingWeekly.filter((w) => w.weekEnd !== weekly.weekEnd)].slice(0, 4);

  saveDailyDigests(updatedDaily);
  saveWeeklyDigests(updatedWeekly);
  markUpdated();

  return { daily, weekly };
};

// Get digest for a specific date
export const getDigestForDate = (dateStr: string): DailyDigest | null => {
  const digests = loadDailyDigests();
  return digests.find((d) => d.date === dateStr) || null;
};

// Get current week's digest
export const getCurrentWeekDigest = (): WeeklyDigest | null => {
  const digests = loadWeeklyDigests();
  return digests[0] || null;
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  return date.toLocaleDateString('zh-CN', options);
};

// Format relative time
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(new Date(timestamp).toISOString().split('T')[0]);
};
