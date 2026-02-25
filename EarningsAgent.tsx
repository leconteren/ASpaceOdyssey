
import React, { useState } from 'react';
import {
  EarningsSubView,
  EarningsCompany,
  EarningsResult,
  WeeklyEarnings,
  SectorReport,
  EarningsSeason,
  SECTOR_LABELS,
  Sector,
} from './earningsTypes';
import { EARNINGS_SEASON } from './earningsData';
import {
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  ChevronRight,
  ChevronDown,
  Cpu,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
} from 'lucide-react';

// ===== Main Earnings Agent View =====

export default function EarningsAgentView() {
  const [subView, setSubView] = useState<EarningsSubView>('preview');
  const season = EARNINGS_SEASON;

  const tabs: { key: EarningsSubView; label: string; icon: React.ReactNode }[] = [
    { key: 'preview', label: '业绩预览', icon: <Calendar size={16} /> },
    { key: 'summary', label: '业绩总结', icon: <BarChart3 size={16} /> },
    { key: 'tracker', label: '股价追踪', icon: <TrendingUp size={16} /> },
    { key: 'report', label: '板块报告', icon: <FileText size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <Zap size={24} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Earnings Agent</h2>
            <p className="text-slate-500 text-sm">{season.label}</p>
          </div>
        </div>
      </header>

      {/* Sub-navigation tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubView(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              subView === tab.key
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      {subView === 'preview' && <PreviewView season={season} />}
      {subView === 'summary' && <SummaryView season={season} />}
      {subView === 'tracker' && <TrackerView season={season} />}
      {subView === 'report' && <ReportView season={season} />}
    </div>
  );
}

// ===== 1. Preview: Weekly Earnings Preview =====

function PreviewView({ season }: { season: EarningsSeason }) {
  const [expandedWeek, setExpandedWeek] = useState<number>(0);

  // Find the current/upcoming week
  const now = new Date().toISOString().split('T')[0];
  const currentWeekIdx = season.weeks.findIndex(w => w.weekEnd >= now);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 rounded-2xl border-l-4 border-emerald-500/50">
        <p className="text-sm text-slate-300">
          <span className="text-emerald-400 font-bold">Earnings Calendar</span> — 周度业绩发布预览，关注重点公司的一致预期和关键看点
        </p>
      </div>

      {season.weeks.map((week, idx) => {
        const isExpanded = expandedWeek === idx;
        const isCurrent = idx === (currentWeekIdx >= 0 ? currentWeekIdx : 0);
        const reportedCount = week.companies.filter(c => c.result !== 'pending').length;
        const pendingCount = week.companies.filter(c => c.result === 'pending').length;

        return (
          <div key={idx} className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedWeek(isExpanded ? -1 : idx)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-400 animate-pulse' : reportedCount === week.companies.length ? 'bg-slate-600' : 'bg-amber-400'}`} />
                <div className="text-left">
                  <h3 className="font-bold text-white">{week.weekLabel}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {week.companies.length} 家公司
                    {reportedCount > 0 && <span className="text-emerald-400 ml-2">{reportedCount} 已发布</span>}
                    {pendingCount > 0 && <span className="text-amber-400 ml-2">{pendingCount} 待发布</span>}
                  </p>
                </div>
              </div>
              {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-3 border-t border-white/5">
                {/* Week sentiment */}
                {week.sentimentSummary && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-white/5">
                    <p className="text-xs text-slate-400 mb-1 font-medium">周度情绪</p>
                    <p className="text-sm text-slate-300">{week.sentimentSummary}</p>
                  </div>
                )}

                {/* Companies */}
                {week.companies.map(company => (
                  <CompanyPreviewCard key={company.ticker} company={company} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompanyPreviewCard({ company }: { company: EarningsCompany; key?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = company.result === 'pending';

  return (
    <div className={`mt-3 rounded-xl border transition-all ${
      isPending ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${sectorColor(company.sector)}`}>
            {company.ticker}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{company.name}</p>
            <p className="text-xs text-slate-500">
              {company.reportDate} {company.reportTime} · {SECTOR_LABELS[company.sector]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isPending && <ResultBadge result={company.result!} />}
          {isPending && <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">待发布</span>}
          {!isPending && company.priceChangeOnReport !== undefined && (
            <PriceChangeBadge change={company.priceChangeOnReport} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Estimates vs Actuals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500 mb-1">Revenue</p>
              <p className="text-sm text-slate-300">
                Est: {company.estRevenue}
                {company.actualRevenue && <span className="text-emerald-400 ml-2">Act: {company.actualRevenue}</span>}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-xs text-slate-500 mb-1">EPS</p>
              <p className="text-sm text-slate-300">
                Est: {company.estEPS}
                {company.actualEPS && <span className="text-emerald-400 ml-2">Act: {company.actualEPS}</span>}
              </p>
            </div>
          </div>

          {/* Highlights */}
          {company.highlights && company.highlights.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Key Highlights</p>
              <ul className="space-y-1">
                {company.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-slate-600 mt-1">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Highlights */}
          {company.aiHighlights && company.aiHighlights.length > 0 && (
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-1">
                <Cpu size={12} /> AI 相关
              </p>
              <ul className="space-y-1">
                {company.aiHighlights.map((h, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-purple-500 mt-1">▸</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Guidance */}
          {company.guidanceNote && (
            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <p className="text-xs font-medium text-cyan-400 mb-1">Forward Guidance</p>
              <p className="text-sm text-slate-300">{company.guidanceNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== 2. Summary: Earnings Results Summary =====

function SummaryView({ season }: { season: EarningsSeason }) {
  const allCompanies = season.weeks.flatMap(w => w.companies);
  const reported = allCompanies.filter(c => c.result !== 'pending');
  const pending = allCompanies.filter(c => c.result === 'pending');
  const beats = reported.filter(c => c.result === 'beat');
  const misses = reported.filter(c => c.result === 'miss');
  const inlines = reported.filter(c => c.result === 'inline');

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="已发布" value={reported.length.toString()} sub={`/ ${allCompanies.length} 家`} color="text-white" />
        <StatCard label="Beat" value={beats.length.toString()} sub={`${reported.length ? Math.round((beats.length / reported.length) * 100) : 0}%`} color="text-emerald-400" />
        <StatCard label="Miss" value={misses.length.toString()} sub={`${reported.length ? Math.round((misses.length / reported.length) * 100) : 0}%`} color="text-rose-400" />
        <StatCard label="Inline" value={inlines.length.toString()} sub={`${reported.length ? Math.round((inlines.length / reported.length) * 100) : 0}%`} color="text-amber-400" />
      </div>

      {/* Beat/Miss table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-bold text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-400" />
            业绩结果一览
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/5">
                <th className="text-left p-3 pl-5">公司</th>
                <th className="text-left p-3">板块</th>
                <th className="text-center p-3">结果</th>
                <th className="text-right p-3">Rev Est</th>
                <th className="text-right p-3">Rev Act</th>
                <th className="text-right p-3">EPS Est</th>
                <th className="text-right p-3 pr-5">EPS Act</th>
              </tr>
            </thead>
            <tbody>
              {reported.map(c => (
                <tr key={c.ticker} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="p-3 pl-5">
                    <span className="font-mono font-bold text-sm text-white">{c.ticker}</span>
                    <span className="text-xs text-slate-500 ml-2">{c.name}</span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${sectorColor(c.sector)}`}>
                      {SECTOR_LABELS[c.sector]}
                    </span>
                  </td>
                  <td className="p-3 text-center"><ResultBadge result={c.result!} /></td>
                  <td className="p-3 text-right text-sm text-slate-400">{c.estRevenue}</td>
                  <td className="p-3 text-right text-sm text-white font-medium">{c.actualRevenue}</td>
                  <td className="p-3 text-right text-sm text-slate-400">{c.estEPS}</td>
                  <td className="p-3 text-right text-sm text-white font-medium pr-5">{c.actualEPS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Highlights Aggregation */}
      <div className="glass-card rounded-2xl p-5 border-l-4 border-purple-500/50">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-purple-400" />
          AI 关键信息汇总
        </h3>
        <div className="space-y-4">
          {reported.filter(c => c.aiHighlights && c.aiHighlights.length > 0).map(c => (
            <div key={c.ticker} className="space-y-2">
              <p className="text-sm font-medium text-purple-300">{c.ticker} - {c.name}</p>
              <ul className="space-y-1 ml-4">
                {c.aiHighlights!.map((h, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">▸</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Pending earnings */}
      {pending.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Eye size={18} className="text-amber-400" />
            待发布 ({pending.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {pending.map(c => (
              <div key={c.ticker} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="font-mono font-bold text-sm text-amber-300">{c.ticker}</span>
                <span className="text-xs text-slate-500">{c.reportDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 3. Tracker: Price Reaction & Sentiment =====

function TrackerView({ season }: { season: EarningsSeason }) {
  const allCompanies = season.weeks.flatMap(w => w.companies);
  const reported = allCompanies.filter(c => c.result !== 'pending' && c.priceChangeOnReport !== undefined);

  const positiveReactions = reported.filter(c => (c.priceChangeOnReport || 0) > 0);
  const negativeReactions = reported.filter(c => (c.priceChangeOnReport || 0) < 0);
  const beatButDown = reported.filter(c => c.result === 'beat' && (c.priceChangeOnReport || 0) < 0);
  const missButUp = reported.filter(c => c.result === 'miss' && (c.priceChangeOnReport || 0) > 0);

  const avgDayOf = reported.length > 0
    ? Math.round((reported.reduce((s, c) => s + (c.priceChangeOnReport || 0), 0) / reported.length) * 10) / 10
    : 0;
  const avgSince = reported.filter(c => c.priceChangeSinceReport !== undefined).length > 0
    ? Math.round((reported.filter(c => c.priceChangeSinceReport !== undefined).reduce((s, c) => s + (c.priceChangeSinceReport || 0), 0) / reported.filter(c => c.priceChangeSinceReport !== undefined).length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      {/* Sentiment Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="报告日平均" value={`${avgDayOf > 0 ? '+' : ''}${avgDayOf}%`} sub="股价变动" color={avgDayOf >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
        <StatCard label="至今平均" value={`${avgSince > 0 ? '+' : ''}${avgSince}%`} sub="累计表现" color={avgSince >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
        <StatCard label="上涨" value={`${positiveReactions.length}/${reported.length}`} sub={`${Math.round((positiveReactions.length / (reported.length || 1)) * 100)}% positive`} color="text-emerald-400" />
        <StatCard label="Beat但下跌" value={beatButDown.length.toString()} sub="情绪警示" color="text-amber-400" />
      </div>

      {/* Overall sentiment */}
      <div className="glass-card rounded-2xl p-5 border-l-4 border-amber-500/50">
        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
          <Zap size={18} className="text-amber-400" />
          市场情绪判读
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">{season.overallSentiment}</p>
      </div>

      {/* Price reaction chart (simplified) */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-white mb-4">股价反应分布</h3>
        <div className="space-y-3">
          {reported.sort((a, b) => (b.priceChangeOnReport || 0) - (a.priceChangeOnReport || 0)).map(c => {
            const change = c.priceChangeOnReport || 0;
            const sinceChange = c.priceChangeSinceReport;
            const maxAbs = Math.max(...reported.map(r => Math.abs(r.priceChangeOnReport || 0)), 1);
            const barWidth = Math.abs(change) / maxAbs * 100;

            return (
              <div key={c.ticker} className="flex items-center gap-3">
                <div className="w-16 text-right">
                  <span className="font-mono text-sm font-bold text-white">{c.ticker}</span>
                </div>
                <div className="flex-1 relative h-8 flex items-center">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                  {change >= 0 ? (
                    <div
                      className="absolute left-1/2 h-6 rounded-r bg-emerald-500/40 border-r-2 border-emerald-400"
                      style={{ width: `${barWidth / 2}%` }}
                    />
                  ) : (
                    <div
                      className="absolute h-6 rounded-l bg-rose-500/40 border-l-2 border-rose-400"
                      style={{ width: `${barWidth / 2}%`, right: '50%' }}
                    />
                  )}
                </div>
                <div className="w-24 text-right flex flex-col">
                  <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                  {sinceChange !== undefined && (
                    <span className={`text-xs ${sinceChange >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                      至今 {sinceChange > 0 ? '+' : ''}{sinceChange}%
                    </span>
                  )}
                </div>
                <div className="w-14">
                  <ResultBadge result={c.result!} small />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomaly detection */}
      {(beatButDown.length > 0 || missButUp.length > 0) && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">异常信号</h3>
          <div className="space-y-3">
            {beatButDown.map(c => (
              <div key={c.ticker} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <ArrowDownRight size={16} className="text-rose-400" />
                <div>
                  <p className="text-sm text-white">
                    <span className="font-mono font-bold">{c.ticker}</span> Beat但下跌 {c.priceChangeOnReport}%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.guidanceNote || '市场预期已过高或指引不及预期'}
                  </p>
                </div>
              </div>
            ))}
            {missButUp.map(c => (
              <div key={c.ticker} className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <ArrowUpRight size={16} className="text-emerald-400" />
                <div>
                  <p className="text-sm text-white">
                    <span className="font-mono font-bold">{c.ticker}</span> Miss但上涨 +{c.priceChangeOnReport}%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.guidanceNote || '叙事/展望驱动大于短期业绩'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 4. Report: Sector Summary Reports =====

function ReportView({ season }: { season: EarningsSeason }) {
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const reports = season.sectorReports;

  if (reports.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-slate-400">业绩期进行中，板块报告将在更多公司发布后生成...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall season summary */}
      <div className="glass-card rounded-2xl p-5 border-l-4 border-emerald-500/50">
        <h3 className="font-bold text-white mb-2">业绩季总览</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{season.overallSentiment}</p>
      </div>

      {/* Sector cards */}
      {reports.map(report => {
        const isExpanded = expandedSector === report.sector;
        const total = report.beatCount + report.missCount + report.inlineCount;

        return (
          <div key={report.sector} className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedSector(isExpanded ? null : report.sector)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${sectorBgColor(report.sector)}`}>
                  <SectorIcon sector={report.sector} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white">{SECTOR_LABELS[report.sector]}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {total} 家 · Beat {report.beatCount} · Miss {report.missCount} · Inline {report.inlineCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-bold ${report.avgPriceReaction >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {report.avgPriceReaction > 0 ? '+' : ''}{report.avgPriceReaction}%
                  </p>
                  <p className="text-xs text-slate-500">
                    avg reaction · {report.positiveReactionCount}/{total} 涨
                  </p>
                </div>
                {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
                </div>

                {/* Companies in sector */}
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">个股表现</p>
                  <div className="space-y-2">
                    {report.companies.map(c => (
                      <div key={c.ticker} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-white w-12">{c.ticker}</span>
                          <ResultBadge result={c.result!} small />
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-500">Rev: {c.actualRevenue}</span>
                          <span className="text-slate-500">EPS: {c.actualEPS}</span>
                          <PriceChangeBadge change={c.priceChangeOnReport || 0} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Themes for this sector */}
                {report.aiThemes.length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <p className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-1">
                      <Cpu size={12} /> AI 主题
                    </p>
                    <ul className="space-y-1.5">
                      {report.aiThemes.map((t, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">▸</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== Shared UI Components =====

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="glass-card p-4 rounded-2xl text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function ResultBadge({ result, small }: { result: EarningsResult; small?: boolean }) {
  const styles: Record<string, string> = {
    beat: 'bg-emerald-500/20 text-emerald-400',
    miss: 'bg-rose-500/20 text-rose-400',
    inline: 'bg-amber-500/20 text-amber-400',
    pending: 'bg-slate-500/20 text-slate-400',
  };
  const labels: Record<string, string> = { beat: 'Beat', miss: 'Miss', inline: 'Inline', pending: 'Pending' };

  return (
    <span className={`${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} rounded-lg font-bold ${styles[result] || styles.pending}`}>
      {labels[result] || result}
    </span>
  );
}

function PriceChangeBadge({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="text-xs text-emerald-400 flex items-center gap-0.5">
        <ArrowUpRight size={12} /> +{change}%
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="text-xs text-rose-400 flex items-center gap-0.5">
        <ArrowDownRight size={12} /> {change}%
      </span>
    );
  }
  return (
    <span className="text-xs text-slate-500 flex items-center gap-0.5">
      <Minus size={12} /> 0%
    </span>
  );
}

function sectorColor(sector: Sector): string {
  const map: Record<Sector, string> = {
    internet: 'bg-blue-500/20 text-blue-400',
    software: 'bg-cyan-500/20 text-cyan-400',
    semiconductor: 'bg-violet-500/20 text-violet-400',
    consumer: 'bg-orange-500/20 text-orange-400',
    cloud: 'bg-sky-500/20 text-sky-400',
    other: 'bg-zinc-500/20 text-zinc-400',
  };
  return map[sector];
}

function sectorBgColor(sector: Sector): string {
  const map: Record<Sector, string> = {
    internet: 'bg-blue-500/20',
    software: 'bg-cyan-500/20',
    semiconductor: 'bg-violet-500/20',
    consumer: 'bg-orange-500/20',
    cloud: 'bg-sky-500/20',
    other: 'bg-zinc-500/20',
  };
  return map[sector];
}

function SectorIcon({ sector }: { sector: Sector }) {
  switch (sector) {
    case 'internet': return <TrendingUp size={18} className="text-blue-400" />;
    case 'software': return <FileText size={18} className="text-cyan-400" />;
    case 'semiconductor': return <Cpu size={18} className="text-violet-400" />;
    case 'consumer': return <BarChart3 size={18} className="text-orange-400" />;
    case 'cloud': return <Zap size={18} className="text-sky-400" />;
    default: return <BarChart3 size={18} className="text-zinc-400" />;
  }
}
