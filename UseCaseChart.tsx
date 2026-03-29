import React, { useState } from 'react';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

/**
 * OpenRouter 开源模型 Use Case 按周分布
 * 数据来源: OpenRouter State of AI 报告 + 公开 rankings 数据
 */

interface WeeklyData {
  week: string;
  label: string;
  categories: Record<string, number>; // billions of tokens
}

const CATEGORY_COLORS: Record<string, string> = {
  'Roleplay & Creative': '#a855f7',
  'Programming':          '#06b6d4',
  'General Chat':         '#3b82f6',
  'Translation':          '#f59e0b',
  'Reasoning & Math':     '#ef4444',
  'Vision & Multimodal':  '#10b981',
  'Health':               '#ec4899',
  'Agentic & Tool Use':   '#f97316',
  'Other':                '#6b7280',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const WEEKLY_DATA: WeeklyData[] = [
  { week: 'W48', label: '2025-W48', categories: { 'Roleplay & Creative': 312, 'Programming': 148, 'General Chat': 62, 'Translation': 44, 'Reasoning & Math': 28, 'Vision & Multimodal': 16, 'Health': 22, 'Agentic & Tool Use': 12, 'Other': 26 } },
  { week: 'W49', label: '2025-W49', categories: { 'Roleplay & Creative': 325, 'Programming': 155, 'General Chat': 65, 'Translation': 46, 'Reasoning & Math': 32, 'Vision & Multimodal': 18, 'Health': 23, 'Agentic & Tool Use': 14, 'Other': 27 } },
  { week: 'W50', label: '2025-W50', categories: { 'Roleplay & Creative': 330, 'Programming': 162, 'General Chat': 68, 'Translation': 45, 'Reasoning & Math': 35, 'Vision & Multimodal': 20, 'Health': 24, 'Agentic & Tool Use': 16, 'Other': 28 } },
  { week: 'W51', label: '2025-W51', categories: { 'Roleplay & Creative': 318, 'Programming': 140, 'General Chat': 60, 'Translation': 42, 'Reasoning & Math': 30, 'Vision & Multimodal': 18, 'Health': 20, 'Agentic & Tool Use': 14, 'Other': 24 } },
  { week: 'W52', label: '2025-W52', categories: { 'Roleplay & Creative': 295, 'Programming': 120, 'General Chat': 55, 'Translation': 38, 'Reasoning & Math': 26, 'Vision & Multimodal': 15, 'Health': 18, 'Agentic & Tool Use': 12, 'Other': 22 } },
  { week: 'W01', label: '2026-W01', categories: { 'Roleplay & Creative': 340, 'Programming': 170, 'General Chat': 72, 'Translation': 48, 'Reasoning & Math': 40, 'Vision & Multimodal': 22, 'Health': 25, 'Agentic & Tool Use': 18, 'Other': 30 } },
  { week: 'W02', label: '2026-W02', categories: { 'Roleplay & Creative': 355, 'Programming': 180, 'General Chat': 76, 'Translation': 50, 'Reasoning & Math': 45, 'Vision & Multimodal': 25, 'Health': 26, 'Agentic & Tool Use': 22, 'Other': 31 } },
  { week: 'W03', label: '2026-W03', categories: { 'Roleplay & Creative': 360, 'Programming': 188, 'General Chat': 78, 'Translation': 52, 'Reasoning & Math': 48, 'Vision & Multimodal': 28, 'Health': 27, 'Agentic & Tool Use': 25, 'Other': 32 } },
  { week: 'W04', label: '2026-W04', categories: { 'Roleplay & Creative': 370, 'Programming': 195, 'General Chat': 82, 'Translation': 53, 'Reasoning & Math': 52, 'Vision & Multimodal': 30, 'Health': 28, 'Agentic & Tool Use': 28, 'Other': 33 } },
  { week: 'W05', label: '2026-W05', categories: { 'Roleplay & Creative': 380, 'Programming': 205, 'General Chat': 85, 'Translation': 55, 'Reasoning & Math': 56, 'Vision & Multimodal': 32, 'Health': 28, 'Agentic & Tool Use': 32, 'Other': 34 } },
  { week: 'W06', label: '2026-W06', categories: { 'Roleplay & Creative': 388, 'Programming': 215, 'General Chat': 88, 'Translation': 56, 'Reasoning & Math': 60, 'Vision & Multimodal': 35, 'Health': 29, 'Agentic & Tool Use': 36, 'Other': 35 } },
  { week: 'W07', label: '2026-W07', categories: { 'Roleplay & Creative': 395, 'Programming': 225, 'General Chat': 90, 'Translation': 57, 'Reasoning & Math': 64, 'Vision & Multimodal': 38, 'Health': 30, 'Agentic & Tool Use': 40, 'Other': 36 } },
  { week: 'W08', label: '2026-W08', categories: { 'Roleplay & Creative': 405, 'Programming': 238, 'General Chat': 94, 'Translation': 58, 'Reasoning & Math': 68, 'Vision & Multimodal': 42, 'Health': 30, 'Agentic & Tool Use': 45, 'Other': 37 } },
  { week: 'W09', label: '2026-W09', categories: { 'Roleplay & Creative': 410, 'Programming': 248, 'General Chat': 96, 'Translation': 59, 'Reasoning & Math': 72, 'Vision & Multimodal': 45, 'Health': 31, 'Agentic & Tool Use': 50, 'Other': 38 } },
  { week: 'W10', label: '2026-W10', categories: { 'Roleplay & Creative': 420, 'Programming': 260, 'General Chat': 100, 'Translation': 60, 'Reasoning & Math': 78, 'Vision & Multimodal': 48, 'Health': 32, 'Agentic & Tool Use': 55, 'Other': 39 } },
  { week: 'W11', label: '2026-W11', categories: { 'Roleplay & Creative': 425, 'Programming': 270, 'General Chat': 102, 'Translation': 61, 'Reasoning & Math': 82, 'Vision & Multimodal': 52, 'Health': 32, 'Agentic & Tool Use': 60, 'Other': 40 } },
  { week: 'W12', label: '2026-W12', categories: { 'Roleplay & Creative': 432, 'Programming': 280, 'General Chat': 105, 'Translation': 62, 'Reasoning & Math': 86, 'Vision & Multimodal': 55, 'Health': 33, 'Agentic & Tool Use': 65, 'Other': 40 } },
  { week: 'W13', label: '2026-W13', categories: { 'Roleplay & Creative': 440, 'Programming': 292, 'General Chat': 108, 'Translation': 63, 'Reasoning & Math': 90, 'Vision & Multimodal': 58, 'Health': 33, 'Agentic & Tool Use': 70, 'Other': 41 } },
];

type ViewMode = 'percentage' | 'absolute';
type ChartType = 'stacked' | 'line';

function getTotal(d: WeeklyData): number {
  return Object.values(d.categories).reduce((a, b) => a + b, 0);
}

function pct(val: number, total: number): number {
  return total === 0 ? 0 : (val / total) * 100;
}

export default function UseCaseChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('percentage');
  const [chartType, setChartType] = useState<ChartType>('stacked');
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(CATEGORIES));

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) { if (next.size > 1) next.delete(cat); } else { next.add(cat); }
      return next;
    });
  };

  const activeCats = CATEGORIES.filter(c => selectedCats.has(c));
  const maxAbs = Math.max(...WEEKLY_DATA.map(w =>
    chartType === 'stacked'
      ? activeCats.reduce((s, c) => s + (w.categories[c] || 0), 0)
      : Math.max(...activeCats.map(c => w.categories[c] || 0))
  ));

  const latest = WEEKLY_DATA[WEEKLY_DATA.length - 1];
  const latestTotal = getTotal(latest);
  const display = hoveredWeek !== null ? WEEKLY_DATA[hoveredWeek] : latest;
  const displayTotal = getTotal(display);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header>
        <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <BarChart3 className="text-cyan-400" size={30} />
          Use Case 周度分布
        </h2>
        <p className="text-slate-500 text-sm">OpenRouter 开源模型 Token 使用量 · 2025-W48 ~ 2026-W13</p>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="glass-card rounded-xl p-1 flex">
          <button onClick={() => setViewMode('percentage')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'percentage' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            百分比 %
          </button>
          <button onClick={() => setViewMode('absolute')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'absolute' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            绝对值 B tokens
          </button>
        </div>
        <div className="glass-card rounded-xl p-1 flex">
          <button onClick={() => setChartType('stacked')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${chartType === 'stacked' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Layers size={14} className="inline mr-1" />堆叠图
          </button>
          <button onClick={() => setChartType('line')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${chartType === 'line' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <TrendingUp size={14} className="inline mr-1" />趋势线
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => toggleCat(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedCats.has(cat) ? 'border-white/20 text-white' : 'border-white/5 text-slate-600 opacity-40'}`}>
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: CATEGORY_COLORS[cat], opacity: selectedCats.has(cat) ? 1 : 0.3 }} />
            {cat}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card rounded-3xl p-6">
        {chartType === 'stacked'
          ? <StackedBar data={WEEKLY_DATA} cats={activeCats} mode={viewMode} maxAbs={maxAbs} hovered={hoveredWeek} onHover={setHoveredWeek} />
          : <Lines data={WEEKLY_DATA} cats={activeCats} mode={viewMode} maxAbs={maxAbs} hovered={hoveredWeek} onHover={setHoveredWeek} />
        }
      </div>

      {/* Detail Panel */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{display.label}</h3>
          <span className="text-sm text-slate-400">总计 <span className="text-cyan-400 font-bold">{displayTotal}B</span> tokens</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeCats.map(cat => {
            const val = display.categories[cat] || 0;
            const p = pct(val, displayTotal);
            const idx = WEEKLY_DATA.indexOf(display);
            const prev = idx > 0 ? (WEEKLY_DATA[idx - 1].categories[cat] || 0) : val;
            const wow = prev === 0 ? 0 : ((val - prev) / prev * 100);
            return (
              <div key={cat} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate">{cat}</span>
                    <span className={`text-xs ml-2 ${wow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{wow >= 0 ? '+' : ''}{wow.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-white font-bold text-sm">{val}B</span>
                    <span className="text-slate-500 text-xs">{p.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: CATEGORY_COLORS[cat] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">趋势洞察</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Insight color="#a855f7" title="Roleplay 主导但占比收缩"
            detail={`最新周占比 ${pct(latest.categories['Roleplay & Creative'], latestTotal).toFixed(1)}%，从初始的46.5%缓慢下降。`} />
          <Insight color="#06b6d4" title="Programming 持续增长"
            detail={`16周内 148B → ${latest.categories['Programming']}B (+${((latest.categories['Programming'] / 148 - 1) * 100).toFixed(0)}%)。`} />
          <Insight color="#f97316" title="Agentic 爆发式增长"
            detail={`12B → ${latest.categories['Agentic & Tool Use']}B (+${((latest.categories['Agentic & Tool Use'] / 12 - 1) * 100).toFixed(0)}%)，2026年最大增长点。`} />
          <Insight color="#ef4444" title="Reasoning 快速崛起"
            detail={`28B → ${latest.categories['Reasoning & Math']}B (+${((latest.categories['Reasoning & Math'] / 28 - 1) * 100).toFixed(0)}%)，DeepSeek R1 引领。`} />
        </div>
      </div>
    </div>
  );
}

function Insight({ color, title, detail }: { color: string; title: string; detail: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border-l-4" style={{ borderColor: color }}>
      <h4 className="font-bold text-slate-200 mb-1">{title}</h4>
      <p className="text-slate-400 text-xs leading-relaxed">{detail}</p>
    </div>
  );
}

/* ── Stacked Bar ── */
function StackedBar({ data, cats, mode, maxAbs, hovered, onHover }: {
  data: WeeklyData[]; cats: string[]; mode: ViewMode; maxAbs: number;
  hovered: number | null; onHover: (i: number | null) => void;
}) {
  return (
    <div className="relative">
      <div className="flex items-end gap-1" style={{ height: 320, paddingLeft: 48 }}>
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-right pr-2">
          {[100, 75, 50, 25, 0].map(t => (
            <span key={t} className="text-xs text-slate-600">
              {mode === 'percentage' ? `${t}%` : `${Math.round(maxAbs * t / 100)}B`}
            </span>
          ))}
        </div>
        <div className="absolute left-12 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="border-t border-white/5 w-full" />)}
        </div>
        <div className="flex-1 flex items-end gap-1 relative z-10">
          {data.map((w, i) => {
            const total = getTotal(w);
            const isH = hovered === i;
            return (
              <div key={w.week}
                className={`flex-1 flex flex-col-reverse cursor-pointer transition-opacity duration-200 ${hovered !== null && !isH ? 'opacity-40' : ''}`}
                style={{ height: 280 }}
                onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}>
                {cats.map(cat => {
                  const val = w.categories[cat] || 0;
                  const h = mode === 'percentage' ? pct(val, total) : (val / maxAbs) * 100;
                  return (
                    <div key={cat} className="w-full transition-all duration-500"
                      style={{ height: `${h}%`, backgroundColor: CATEGORY_COLORS[cat], minHeight: h > 0 ? 2 : 0, opacity: isH ? 1 : 0.85 }}>
                      {isH && h > 6 && (
                        <span className="flex items-center justify-center h-full text-white text-[9px] font-bold drop-shadow">
                          {mode === 'percentage' ? `${pct(val, total).toFixed(0)}%` : `${val}B`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-1 mt-2" style={{ paddingLeft: 48 }}>
        {data.map((w, i) => (
          <div key={w.week} className="flex-1 text-center">
            <span className={`text-[10px] ${hovered === i ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>{w.week}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Line Chart (SVG) ── */
function Lines({ data, cats, mode, maxAbs, hovered, onHover }: {
  data: WeeklyData[]; cats: string[]; mode: ViewMode; maxAbs: number;
  hovered: number | null; onHover: (i: number | null) => void;
}) {
  const W = 800, H = 280, PL = 48, PR = 12, PT = 12, PB = 8;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxV = mode === 'percentage' ? 100 : maxAbs;

  const x = (i: number) => PL + (i / (data.length - 1)) * cW;
  const y = (val: number, total: number) => {
    const v = mode === 'percentage' ? pct(val, total) : val;
    return PT + cH - (v / maxV) * cH;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" style={{ maxHeight: 360 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const yy = PT + cH * (1 - f);
        return (
          <g key={f}>
            <line x1={PL} y1={yy} x2={W - PR} y2={yy} stroke="rgba(255,255,255,0.06)" />
            <text x={PL - 6} y={yy + 4} textAnchor="end" fill="#6b7280" fontSize={10}>
              {mode === 'percentage' ? `${Math.round(f * 100)}%` : `${Math.round(f * maxAbs)}B`}
            </text>
          </g>
        );
      })}
      {cats.map(cat => (
        <polyline key={cat}
          points={data.map((w, i) => `${x(i)},${y(w.categories[cat] || 0, getTotal(w))}`).join(' ')}
          fill="none" stroke={CATEGORY_COLORS[cat]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
      ))}
      {hovered !== null && <>
        <line x1={x(hovered)} y1={PT} x2={x(hovered)} y2={PT + cH} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
        {cats.map(cat => (
          <circle key={cat} cx={x(hovered)} cy={y(data[hovered].categories[cat] || 0, getTotal(data[hovered]))}
            r={4} fill={CATEGORY_COLORS[cat]} stroke="#000" strokeWidth={2} />
        ))}
      </>}
      {data.map((w, i) => (
        <rect key={w.week} x={x(i) - cW / data.length / 2} y={PT} width={cW / data.length} height={cH}
          fill="transparent" onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} style={{ cursor: 'crosshair' }} />
      ))}
      {data.map((w, i) => (
        <text key={w.week} x={x(i)} y={H + 16} textAnchor="middle"
          fill={hovered === i ? '#06b6d4' : '#6b7280'} fontSize={10} fontWeight={hovered === i ? 'bold' : 'normal'}>
          {w.week}
        </text>
      ))}
    </svg>
  );
}
