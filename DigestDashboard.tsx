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
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Star,
  Download,
  Copy,
  Check,
  Sparkles,
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

const categoryIcons: Record<DigestCategory, React.ReactNode> = {
  builder_insights: <Users size={20} />,
  product_updates: <Rocket size={20} />,
  blog_articles: <FileText size={20} />,
  podcast_interviews: <Mic size={20} />,
  news: <Newspaper size={20} />,
  research: <BookOpen size={20} />,
};

const categoryColors: Record<DigestCategory, { bg: string; border: string; text: string }> = {
  builder_insights: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  product_updates: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  blog_articles: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  podcast_interviews: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
  news: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  research: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
};

const categoryOrder: DigestCategory[] = [
  'product_updates',
  'builder_insights',
  'news',
  'blog_articles',
  'podcast_interviews',
  'research',
];

export const DigestDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [currentDailyDigest, setCurrentDailyDigest] = useState<DailyDigest | null>(null);
  const [currentWeeklyDigest, setCurrentWeeklyDigest] = useState<WeeklyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categoryOrder));
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        const { daily, weekly } = initializeDigestData();
        setCurrentDailyDigest(daily);
        setCurrentWeeklyDigest(weekly);
      } catch (error) {
        console.error('Error loading digest data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  // Group items by category
  const itemsByCategory = useMemo(() => {
    if (!currentDailyDigest) return {};
    return currentDailyDigest.items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<DigestCategory, DigestItem[]>);
  }, [currentDailyDigest]);

  // Generate report text
  const generateReportText = (type: 'daily' | 'weekly'): string => {
    if (type === 'daily' && currentDailyDigest) {
      const d = currentDailyDigest;
      let report = `# AI Digest 日报 - ${formatDate(d.date)}\n\n`;
      report += `## 今日概览\n${d.summary}\n\n`;

      categoryOrder.forEach((cat) => {
        const items = itemsByCategory[cat];
        if (items && items.length > 0) {
          report += `---\n\n## ${categoryInfo[cat].nameZh}\n\n`;
          items.forEach((item, i) => {
            report += `### ${i + 1}. ${item.sourceName}\n`;
            report += `${item.content}\n\n`;
          });
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
        report += `## 本周重点\n`;
        w.topHighlights.forEach((item, i) => {
          report += `### ${i + 1}. [${categoryInfo[item.category].nameZh}] ${item.sourceName}\n`;
          report += `${item.content}\n\n`;
        });
      }

      return report;
    }

    return '';
  };

  const copyReport = (type: 'daily' | 'weekly') => {
    const report = generateReportText(type);
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

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

  // Render a single digest item with full content
  const renderDigestItem = (item: DigestItem, index: number) => {
    const colors = categoryColors[item.category];

    return (
      <div
        key={item.id}
        className={`p-4 rounded-xl ${colors.bg} border ${colors.border} mb-3`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-semibold ${colors.text}`}>{item.sourceName}</span>
              {item.isHighlight && (
                <Star size={14} className="text-amber-400 fill-amber-400" />
              )}
              <span className="text-xs text-zinc-500">
                {formatRelativeTime(item.timestamp)}
              </span>
            </div>

            {/* Main content - full display */}
            <p className="text-zinc-200 leading-relaxed mb-3">
              {item.content}
            </p>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-zinc-800/50 rounded-full text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement metrics */}
            {item.engagement && (
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Heart size={12} /> {(item.engagement.likes || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 size={12} /> {(item.engagement.retweets || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {(item.engagement.views || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${colors.text}`}
            title="查看原文"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    );
  };

  // Render category section
  const renderCategorySection = (category: DigestCategory) => {
    const items = itemsByCategory[category];
    if (!items || items.length === 0) return null;

    const colors = categoryColors[category];
    const isExpanded = expandedCategories.has(category);
    const info = categoryInfo[category];

    return (
      <div key={category} className="mb-6">
        <button
          onClick={() => toggleCategory(category)}
          className={`w-full flex items-center justify-between p-4 rounded-xl ${colors.bg} border ${colors.border} hover:bg-opacity-20 transition-all`}
        >
          <div className="flex items-center gap-3">
            <span className={colors.text}>{categoryIcons[category]}</span>
            <div className="text-left">
              <h3 className={`text-lg font-bold ${colors.text}`}>{info.nameZh}</h3>
              <p className="text-sm text-zinc-500">{items.length} 条更新</p>
            </div>
          </div>
          <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            <ChevronRight size={20} className={colors.text} />
          </div>
        </button>

        {isExpanded && (
          <div className="mt-3 pl-2">
            {items.map((item, index) => renderDigestItem(item, index))}
          </div>
        )}
      </div>
    );
  };

  // Render daily view - organized by category
  const renderDailyView = () => {
    if (!currentDailyDigest) return null;

    return (
      <div>
        {/* Header Summary Card */}
        <div className="glass-card p-6 mb-6 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-amber-400" size={24} />
                <h2 className="text-2xl font-bold text-zinc-100">
                  {formatDate(currentDailyDigest.date)}
                </h2>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                {currentDailyDigest.summary}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 pt-4 border-t border-zinc-700/50">
            {categoryOrder.map((cat) => {
              const count = currentDailyDigest.categoryBreakdown[cat] || 0;
              const colors = categoryColors[cat];
              return (
                <div
                  key={cat}
                  className={`text-center p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                >
                  <div className={`text-xl font-bold ${colors.text}`}>{count}</div>
                  <div className="text-xs text-zinc-500">{categoryInfo[cat].nameZh}</div>
                </div>
              );
            })}
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
            <button
              onClick={() => copyReport('daily')}
              className="px-4 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              {copiedReport ? <Check size={16} /> : <Copy size={16} />}
              {copiedReport ? '已复制' : '复制日报'}
            </button>
            <button
              onClick={() => downloadReport('daily')}
              className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              下载 Markdown
            </button>
          </div>
        </div>

        {/* Content by Category */}
        <div>
          {categoryOrder.map((category) => renderCategorySection(category))}
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
        <div className="glass-card p-6 mb-6 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="text-purple-400" size={24} />
                <h2 className="text-2xl font-bold text-zinc-100">
                  本周总结
                </h2>
              </div>
              <p className="text-sm text-zinc-500 mb-3">
                {formatDate(currentWeeklyDigest.weekStart)} - {formatDate(currentWeeklyDigest.weekEnd)}
              </p>
              <p className="text-zinc-400 leading-relaxed">
                {currentWeeklyDigest.weekSummary}
              </p>
            </div>
          </div>

          {/* Trends */}
          {currentWeeklyDigest.trends.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-700/50">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" />
                本周趋势洞察
              </h3>
              <div className="space-y-2">
                {currentWeeklyDigest.trends.map((trend, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                  >
                    <span className="text-green-400 font-bold">{i + 1}.</span>
                    <span className="text-zinc-300">{trend}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
            <button
              onClick={() => copyReport('weekly')}
              className="px-4 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              {copiedReport ? <Check size={16} /> : <Copy size={16} />}
              {copiedReport ? '已复制' : '复制周报'}
            </button>
            <button
              onClick={() => downloadReport('weekly')}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              下载 Markdown
            </button>
          </div>
        </div>

        {/* Top Highlights */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-zinc-200 mb-4 flex items-center gap-2">
            <Star className="text-amber-400" size={22} />
            本周精选内容
          </h3>
          <div className="space-y-3">
            {currentWeeklyDigest.topHighlights.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl ${categoryColors[item.category].bg} border ${categoryColors[item.category].border}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[item.category].bg} ${categoryColors[item.category].text} border ${categoryColors[item.category].border}`}>
                    {categoryInfo[item.category].nameZh}
                  </span>
                  <span className={`font-semibold ${categoryColors[item.category].text}`}>
                    {item.sourceName}
                  </span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Breakdown */}
        <div>
          <h3 className="text-xl font-bold text-zinc-200 mb-4 flex items-center gap-2">
            <Calendar size={22} className="text-cyan-400" />
            每日回顾
          </h3>
          <div className="space-y-3">
            {currentWeeklyDigest.dailyDigests.map((daily) => (
              <details key={daily.id} className="glass-card rounded-xl overflow-hidden group">
                <summary className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-zinc-200">{formatDate(daily.date)}</span>
                    <span className="text-sm text-zinc-500">
                      {daily.items.length} 条更新
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
                    {categoryOrder.map((cat) => {
                      const count = daily.categoryBreakdown[cat] || 0;
                      if (count === 0) return null;
                      const colors = categoryColors[cat];
                      return (
                        <span
                          key={cat}
                          className={`px-2 py-1 rounded text-xs border ${colors.bg} ${colors.border} ${colors.text}`}
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
        <div className="glass-card p-5 mb-6 rounded-2xl">
          <h2 className="text-xl font-bold text-zinc-100 mb-2">信息源管理</h2>
          <p className="text-sm text-zinc-400">
            共 {allSources.length} 个信息源，涵盖 AI 行业核心人物、公司和媒体
          </p>
        </div>

        {categoryOrder.map((cat) => {
          const sources = groupedSources[cat];
          if (!sources || sources.length === 0) return null;
          const colors = categoryColors[cat];

          return (
            <div key={cat} className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${colors.text}`}>
                {categoryIcons[cat]}
                {categoryInfo[cat]?.nameZh || cat}
                <span className="text-sm text-zinc-500 font-normal">
                  ({sources.length})
                </span>
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl ${colors.bg} border ${colors.border} hover:bg-opacity-20 transition-colors group`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${colors.bg} ${colors.text} border ${colors.border}`}
                      >
                        {source.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate group-hover:${colors.text} transition-colors text-zinc-200`}>
                          {source.nameZh || source.name}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {source.descriptionZh || source.description}
                        </div>
                      </div>
                      <ExternalLink
                        size={16}
                        className={`${colors.text} opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0`}
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">AI Digest</h1>
          <p className="text-sm text-zinc-500">追踪 AI 行业动态，每日自动更新</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('daily')}
          className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium ${
            viewMode === 'daily'
              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <Calendar size={18} />
          今日日报
        </button>
        <button
          onClick={() => setViewMode('weekly')}
          className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium ${
            viewMode === 'weekly'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <CalendarDays size={18} />
          本周周报
        </button>
        <button
          onClick={() => setViewMode('sources')}
          className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium ${
            viewMode === 'sources'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border border-transparent'
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
