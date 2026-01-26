import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Users,
  Rocket,
  FileText,
  Mic,
  BookOpen,
  Calendar,
  CalendarDays,
  TrendingUp,
  ExternalLink,
  Clock,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { DigestItem, DailyDigest, WeeklyDigest, DigestCategory } from './types';
import { categoryInfo, allSources } from './digestSources';
import {
  initializeDigestData,
  loadDailyDigests,
  loadWeeklyDigests,
  formatDate,
  formatRelativeTime,
  generateDailyDigest,
  generateWeeklyDigest,
} from './digestData';

type ViewMode = 'daily' | 'weekly' | 'sources';
type CategoryFilter = DigestCategory | 'all';

const categoryIcons: Record<DigestCategory, React.ReactNode> = {
  builder_insights: <Users size={18} />,
  product_updates: <Rocket size={18} />,
  blog_articles: <FileText size={18} />,
  podcast_interviews: <Mic size={18} />,
  news: <Newspaper size={18} />,
  research: <BookOpen size={18} />,
};

const categoryColors: Record<DigestCategory, string> = {
  builder_insights: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  product_updates: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  blog_articles: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  podcast_interviews: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
  news: 'text-green-400 bg-green-400/10 border-green-400/30',
  research: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
};

export const DigestDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyDigests, setDailyDigests] = useState<DailyDigest[]>([]);
  const [weeklyDigests, setWeeklyDigests] = useState<WeeklyDigest[]>([]);
  const [currentDailyDigest, setCurrentDailyDigest] = useState<DailyDigest | null>(null);
  const [currentWeeklyDigest, setCurrentWeeklyDigest] = useState<WeeklyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedReport, setCopiedReport] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        // Initialize or load existing data
        const { daily, weekly } = initializeDigestData();
        setCurrentDailyDigest(daily);
        setCurrentWeeklyDigest(weekly);
        setDailyDigests(loadDailyDigests());
        setWeeklyDigests(loadWeeklyDigests());
      } catch (error) {
        console.error('Error loading digest data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Refresh data
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const today = new Date();
      const daily = generateDailyDigest(today);
      const weekly = generateWeeklyDigest(today);
      setCurrentDailyDigest(daily);
      setCurrentWeeklyDigest(weekly);
      setIsLoading(false);
    }, 500);
  };

  // Filter items based on category and search
  const filteredItems = useMemo(() => {
    if (!currentDailyDigest) return [];
    let items = currentDailyDigest.items;

    if (categoryFilter !== 'all') {
      items = items.filter((item) => item.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.sourceName.toLowerCase().includes(query)
      );
    }

    return items;
  }, [currentDailyDigest, categoryFilter, searchQuery]);

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Generate report text
  const generateReportText = (type: 'daily' | 'weekly'): string => {
    if (type === 'daily' && currentDailyDigest) {
      const d = currentDailyDigest;
      let report = `# AI Digest 日报 - ${formatDate(d.date)}\n\n`;
      report += `## 概览\n${d.summary}\n\n`;

      if (d.highlights.length > 0) {
        report += `## 今日亮点\n`;
        d.highlights.forEach((item, i) => {
          report += `${i + 1}. **[${item.sourceName}]** ${item.content}\n`;
        });
        report += '\n';
      }

      const categories = Object.keys(categoryInfo) as DigestCategory[];
      categories.forEach((cat) => {
        const catItems = d.items.filter((item) => item.category === cat);
        if (catItems.length > 0) {
          report += `## ${categoryInfo[cat].nameZh}\n`;
          catItems.slice(0, 5).forEach((item) => {
            report += `- **[${item.sourceName}]** ${item.content}\n`;
          });
          report += '\n';
        }
      });

      return report;
    }

    if (type === 'weekly' && currentWeeklyDigest) {
      const w = currentWeeklyDigest;
      let report = `# AI Digest 周报 - ${formatDate(w.weekStart)} 至 ${formatDate(w.weekEnd)}\n\n`;
      report += `## 本周概览\n${w.weekSummary}\n\n`;

      if (w.trends.length > 0) {
        report += `## 本周趋势\n`;
        w.trends.forEach((trend, i) => {
          report += `${i + 1}. ${trend}\n`;
        });
        report += '\n';
      }

      if (w.topHighlights.length > 0) {
        report += `## 本周亮点\n`;
        w.topHighlights.slice(0, 10).forEach((item, i) => {
          report += `${i + 1}. **[${item.sourceName}]** ${item.content}\n`;
        });
      }

      return report;
    }

    return '';
  };

  // Copy report to clipboard
  const copyReport = (type: 'daily' | 'weekly') => {
    const report = generateReportText(type);
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Download report as markdown
  const downloadReport = (type: 'daily' | 'weekly') => {
    const report = generateReportText(type);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-digest-${type}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render category stats
  const renderCategoryStats = () => {
    if (!currentDailyDigest) return null;
    const breakdown = currentDailyDigest.categoryBreakdown;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(Object.keys(categoryInfo) as DigestCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            className={`p-3 rounded-lg border transition-all ${
              categoryFilter === cat
                ? categoryColors[cat] + ' border-opacity-100'
                : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={categoryFilter === cat ? '' : 'text-zinc-400'}>
                {categoryIcons[cat]}
              </span>
              <span className="text-2xl font-bold">{breakdown[cat] || 0}</span>
            </div>
            <div className="text-xs text-zinc-400">{categoryInfo[cat].nameZh}</div>
          </button>
        ))}
      </div>
    );
  };

  // Render digest item
  const renderDigestItem = (item: DigestItem) => {
    const isExpanded = expandedItems.has(item.id);
    const colorClass = categoryColors[item.category];

    return (
      <div
        key={item.id}
        className={`glass-card p-4 mb-3 border-l-2 ${colorClass.split(' ')[2]} transition-all hover:bg-zinc-800/30`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs border ${colorClass}`}>
                {categoryInfo[item.category]?.nameZh}
              </span>
              <span className="text-sm text-zinc-400">{item.sourceName}</span>
              {item.isHighlight && (
                <Star size={14} className="text-amber-400 fill-amber-400" />
              )}
              <span className="text-xs text-zinc-500">
                <Clock size={12} className="inline mr-1" />
                {formatRelativeTime(item.timestamp)}
              </span>
            </div>
            <p
              className={`text-zinc-200 ${isExpanded ? '' : 'line-clamp-2'}`}
              onClick={() => toggleExpand(item.id)}
            >
              {item.content}
            </p>
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-zinc-700/50 rounded-full text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {item.engagement && (
              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Heart size={12} /> {(item.engagement.likes || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 size={12} /> {(item.engagement.retweets || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {(item.engagement.views || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={12} /> {(item.engagement.comments || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>
        {item.content.length > 100 && (
          <button
            onClick={() => toggleExpand(item.id)}
            className="text-xs text-cyan-400 mt-2 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                收起 <ChevronUp size={12} />
              </>
            ) : (
              <>
                展开 <ChevronDown size={12} />
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  // Render daily view
  const renderDailyView = () => {
    if (!currentDailyDigest) return null;

    return (
      <div>
        {/* Summary Card */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">
                {formatDate(currentDailyDigest.date)}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">{currentDailyDigest.summary}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyReport('daily')}
                className="px-3 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                {copiedReport ? <Check size={16} /> : <Copy size={16} />}
                {copiedReport ? '已复制' : '复制日报'}
              </button>
              <button
                onClick={() => downloadReport('daily')}
                className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Download size={16} />
                下载
              </button>
            </div>
          </div>

          {/* Category Stats */}
          {renderCategoryStats()}
        </div>

        {/* Highlights Section */}
        {currentDailyDigest.highlights.length > 0 && categoryFilter === 'all' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <Star className="text-amber-400" size={20} />
              今日亮点
            </h3>
            <div className="grid gap-3">
              {currentDailyDigest.highlights.slice(0, 5).map(renderDigestItem)}
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="搜索内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="px-3 py-2 bg-zinc-700/50 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map(renderDigestItem)
          ) : (
            <div className="text-center py-10 text-zinc-500">暂无符合条件的内容</div>
          )}
        </div>
      </div>
    );
  };

  // Render weekly view
  const renderWeeklyView = () => {
    if (!currentWeeklyDigest) return null;

    return (
      <div>
        {/* Weekly Summary Card */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">
                周报: {formatDate(currentWeeklyDigest.weekStart)} -{' '}
                {formatDate(currentWeeklyDigest.weekEnd)}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">{currentWeeklyDigest.weekSummary}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyReport('weekly')}
                className="px-3 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                {copiedReport ? <Check size={16} /> : <Copy size={16} />}
                {copiedReport ? '已复制' : '复制周报'}
              </button>
              <button
                onClick={() => downloadReport('weekly')}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Download size={16} />
                下载
              </button>
            </div>
          </div>

          {/* Trends */}
          {currentWeeklyDigest.trends.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" />
                本周趋势
              </h3>
              <ul className="space-y-1">
                {currentWeeklyDigest.trends.map((trend, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                    <span className="text-cyan-400">{i + 1}.</span>
                    {trend}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top Highlights */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <Star className="text-amber-400" size={20} />
            本周精选 Top 10
          </h3>
          <div className="space-y-1">
            {currentWeeklyDigest.topHighlights.map(renderDigestItem)}
          </div>
        </div>

        {/* Daily Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <CalendarDays size={20} className="text-cyan-400" />
            每日回顾
          </h3>
          <div className="space-y-4">
            {currentWeeklyDigest.dailyDigests.map((daily) => (
              <details key={daily.id} className="glass-card overflow-hidden group">
                <summary className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors flex items-center justify-between">
                  <div>
                    <span className="font-medium text-zinc-200">{formatDate(daily.date)}</span>
                    <span className="text-sm text-zinc-500 ml-3">
                      {daily.items.length} 条资讯
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    className="text-zinc-500 group-open:rotate-180 transition-transform"
                  />
                </summary>
                <div className="p-4 pt-0 border-t border-zinc-700/50">
                  <p className="text-sm text-zinc-400 mb-3">{daily.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(categoryInfo) as DigestCategory[]).map((cat) => {
                      const count = daily.categoryBreakdown[cat] || 0;
                      if (count === 0) return null;
                      return (
                        <span
                          key={cat}
                          className={`px-2 py-1 rounded text-xs border ${categoryColors[cat]}`}
                        >
                          {categoryInfo[cat].nameZh}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render sources view
  const renderSourcesView = () => {
    const groupedSources = allSources.reduce((acc, source) => {
      const cat = source.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(source);
      return acc;
    }, {} as Record<string, typeof allSources>);

    return (
      <div>
        <div className="glass-card p-5 mb-6">
          <h2 className="text-xl font-bold text-zinc-100 mb-2">信息源管理</h2>
          <p className="text-sm text-zinc-400">
            共 {allSources.length} 个信息源，涵盖 AI 行业核心人物、公司和媒体
          </p>
        </div>

        {(Object.keys(groupedSources) as DigestCategory[]).map((cat) => (
          <div key={cat} className="mb-6">
            <h3 className="text-lg font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <span className={categoryColors[cat].split(' ')[0]}>{categoryIcons[cat]}</span>
              {categoryInfo[cat]?.nameZh || cat}
              <span className="text-sm text-zinc-500 font-normal">
                ({groupedSources[cat].length})
              </span>
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedSources[cat].map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-3 hover:bg-zinc-800/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${categoryColors[source.category]}`}
                    >
                      {source.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-zinc-200 truncate group-hover:text-cyan-400 transition-colors">
                        {source.nameZh || source.name}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {source.descriptionZh || source.description}
                      </div>
                    </div>
                    <ExternalLink
                      size={16}
                      className="text-zinc-500 group-hover:text-cyan-400 transition-colors flex-shrink-0"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-zinc-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">AI Digest Dashboard</h1>
          <p className="text-sm text-zinc-500">追踪 AI 行业动态，每日自动更新</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          刷新数据
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('daily')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            viewMode === 'daily'
              ? 'bg-cyan-600/20 text-cyan-400'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar size={18} />
          日报
        </button>
        <button
          onClick={() => setViewMode('weekly')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            viewMode === 'weekly'
              ? 'bg-purple-600/20 text-purple-400'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CalendarDays size={18} />
          周报
        </button>
        <button
          onClick={() => setViewMode('sources')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            viewMode === 'sources'
              ? 'bg-amber-600/20 text-amber-400'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users size={18} />
          信息源
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'daily' && renderDailyView()}
      {viewMode === 'weekly' && renderWeeklyView()}
      {viewMode === 'sources' && renderSourcesView()}
    </div>
  );
};

export default DigestDashboard;
