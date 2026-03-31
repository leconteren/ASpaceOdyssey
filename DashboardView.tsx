
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MetricConfig, MetricDataPoint, SignalStatus } from './types';
import {
  METRIC_CONFIGS,
  getMetricData,
  evaluateSignal,
  formatNumber,
  trendArrow,
} from './dashboardData';

// ─── Signal Badge ────────────────────────────────────────────────────

function SignalBadge({ status }: { status: SignalStatus }) {
  const cfg = {
    augmentation: { label: 'Augmentation', bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' },
    replacement: { label: 'Replacement', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
    neutral: { label: 'Neutral', bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', dot: 'bg-zinc-400' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
}

// ─── Canvas Chart Component ──────────────────────────────────────────

function MetricChart({ config, data }: { config: MetricConfig; data: MetricDataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  const PAD = { left: 68, right: 48, top: 16, bottom: 36 };
  const HEIGHT = 220;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    canvas.width = w * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = HEIGHT + 'px';

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, HEIGHT);

    const n = data.length;
    const chartW = w - PAD.left - PAD.right;
    const chartH = HEIGHT - PAD.top - PAD.bottom;

    const vals = data.map(d => d.value);
    const maxVal = Math.max(...vals) * 1.1;
    const minVal = Math.min(0, Math.min(...vals) * 0.9);

    const xPos = (i: number) => PAD.left + (i / Math.max(1, n - 1)) * chartW;
    const yPos = (v: number) => PAD.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    // Grid lines
    const gridCount = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridCount; i++) {
      const y = PAD.top + (i / gridCount) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(w - PAD.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = maxVal - (i / gridCount) * (maxVal - minVal);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(formatNumber(val), PAD.left - 8, y + 4);
    }

    // X-axis labels
    const labelStep = n > 12 ? 3 : n > 6 ? 2 : 1;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i += labelStep) {
      ctx.fillText(data[i].date, xPos(i), HEIGHT - 6);
    }

    const color = config.color;
    const fillColor = color + '33'; // ~20% opacity

    if (config.chartType === 'bar') {
      // Bar chart
      const barW = Math.max(4, chartW / n * 0.6);
      for (let i = 0; i < n; i++) {
        const x = xPos(i) - barW / 2;
        const y = yPos(vals[i]);
        const h = yPos(minVal) - y;
        ctx.fillStyle = hoverIdx === i ? color : fillColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Rounded top corners
        const r = Math.min(3, barW / 2);
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
        ctx.stroke();
      }
    } else if (config.chartType === 'area') {
      // Area chart
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(vals[0]));
      for (let i = 1; i < n; i++) ctx.lineTo(xPos(i), yPos(vals[i]));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill
      ctx.lineTo(xPos(n - 1), yPos(minVal));
      ctx.lineTo(xPos(0), yPos(minVal));
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Dots
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(xPos(i), yPos(vals[i]), hoverIdx === i ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    } else if (config.chartType === 'dual-line') {
      // Primary line (employment)
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xPos(i), y = yPos(vals[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(xPos(i), yPos(vals[i]), hoverIdx === i ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Secondary line (wage) — own scale
      const vals2 = data.map(d => d.value2 || 0);
      const max2 = Math.max(...vals2) * 1.05;
      const min2 = Math.min(...vals2) * 0.95;
      const yPos2 = (v: number) => PAD.top + chartH - ((v - min2) / (max2 - min2)) * chartH;

      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xPos(i), y = yPos2(vals2[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = config.color2 || '#f0883e';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(xPos(i), yPos2(vals2[i]), hoverIdx === i ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = config.color2 || '#f0883e';
        ctx.fill();
      }

      // Right Y-axis labels for wage
      for (let i = 0; i <= gridCount; i++) {
        const y = PAD.top + (i / gridCount) * chartH;
        const val = max2 - (i / gridCount) * (max2 - min2);
        ctx.fillStyle = (config.color2 || '#f0883e') + '88';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('$' + formatNumber(val), w - PAD.right + 6, y + 4);
      }
    } else {
      // Line chart
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xPos(i), y = yPos(vals[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(xPos(i), yPos(vals[i]), hoverIdx === i ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // Hover vertical line
    if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < n) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xPos(hoverIdx), PAD.top);
      ctx.lineTo(xPos(hoverIdx), PAD.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [data, config, hoverIdx]);

  useEffect(() => {
    draw();
    const handler = () => draw();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = container.clientWidth;
    const chartW = w - PAD.left - PAD.right;
    const n = data.length;

    if (x < PAD.left || x > w - PAD.right) {
      setHoverIdx(null);
      setTooltip(null);
      return;
    }

    const idx = Math.round(((x - PAD.left) / chartW) * (n - 1));
    const clampedIdx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(clampedIdx);
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [data]);

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
    setTooltip(null);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoverIdx !== null && tooltip && data[hoverIdx] && (
        <div
          className="absolute pointer-events-none z-10 glass-card rounded-lg px-3 py-2 text-xs border border-white/20"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 300) - 160),
            top: Math.max(0, tooltip.y - 50),
          }}
        >
          <div className="text-zinc-400 mb-1">{data[hoverIdx].date}</div>
          <div style={{ color: config.color }} className="font-bold">
            {config.unit}: {formatNumber(data[hoverIdx].value)}
          </div>
          {data[hoverIdx].value2 !== undefined && (
            <div style={{ color: config.color2 }} className="font-bold">
              {config.unit2}: {formatNumber(data[hoverIdx].value2!)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Metric Summary Card ─────────────────────────────────────────────

function MetricCard({ config }: { config: MetricConfig }) {
  const data = getMetricData(config.id);
  const signal = evaluateSignal(config.id);
  const trend = trendArrow(data);
  const latest = data[data.length - 1];

  return (
    <div className="glass-card p-5 rounded-2xl hover:bg-white/5 transition-all group border-t-2" style={{ borderTopColor: config.color + '66' }}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-300">{config.name}</h4>
          <p className="text-xs text-zinc-500">{config.source} · {config.frequency}</p>
        </div>
        <SignalBadge status={signal} />
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-black text-white">{formatNumber(latest?.value || 0)}</span>
        <span className={`text-sm font-bold ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
          {trend.arrow} {trend.pct}
        </span>
      </div>
      <p className="text-xs text-zinc-600 mt-2">{config.unit}</p>
    </div>
  );
}

// ─── Chart Panel ─────────────────────────────────────────────────────

function ChartPanel({ config }: { config: MetricConfig }) {
  const [collapsed, setCollapsed] = useState(false);
  const data = getMetricData(config.id);
  const signal = evaluateSignal(config.id);

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
          <div>
            <h3 className="text-lg font-bold text-white">{config.name}</h3>
            <p className="text-xs text-zinc-500">{config.nameCn} · {config.source}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SignalBadge status={signal} />
          <span className="text-zinc-500 text-lg">{collapsed ? '▸' : '▾'}</span>
        </div>
      </button>
      {!collapsed && (
        <div className="px-5 pb-5">
          <MetricChart config={config} data={data} />
          <div className="mt-3 flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-zinc-500">Augmentation: {config.augmentationDesc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-zinc-500">Replacement: {config.replacementDesc}</span>
            </div>
          </div>
          {config.chartType === 'dual-line' && (
            <div className="mt-2 flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded" style={{ backgroundColor: config.color }} />
                <span className="text-zinc-500">{config.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded border-t border-dashed" style={{ borderColor: config.color2 }} />
                <span className="text-zinc-500">{config.unit2}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Composite Score ─────────────────────────────────────────────────

function CompositeScore() {
  const signals = METRIC_CONFIGS.map(c => evaluateSignal(c.id));
  const augCount = signals.filter(s => s === 'augmentation').length;
  const repCount = signals.filter(s => s === 'replacement').length;
  const total = signals.length;

  const score = Math.round(((augCount - repCount) / total + 1) * 50); // 0-100 scale
  const overall: SignalStatus = score > 60 ? 'augmentation' : score < 40 ? 'replacement' : 'neutral';

  const barColor = overall === 'augmentation'
    ? 'from-green-500 to-cyan-500'
    : overall === 'replacement'
      ? 'from-red-500 to-orange-500'
      : 'from-zinc-500 to-zinc-400';

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/10 monolith-glow">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Composite Signal</h3>
          <p className="text-sm text-zinc-500">综合判断: AI 对软件开发工作的影响</p>
        </div>
        <SignalBadge status={overall} />
      </div>
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>Replacement ({repCount})</span>
        <span className="font-bold text-white">{score}/100</span>
        <span>Augmentation ({augCount})</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard View ─────────────────────────────────────────────

export default function DashboardView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">
          AI × Software Jobs Dashboard
        </h2>
        <p className="text-slate-500">
          综合信号面板 — AI 对软件开发就业市场的增强 vs 替代信号追踪
        </p>
      </header>

      <CompositeScore />

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRIC_CONFIGS.map(config => (
          <MetricCard key={config.id} config={config} />
        ))}
      </div>

      {/* Chart panels */}
      <div className="space-y-4">
        {METRIC_CONFIGS.map(config => (
          <ChartPanel key={config.id} config={config} />
        ))}
      </div>

      <footer className="text-center text-xs text-zinc-600 py-8 border-t border-white/5">
        <p>数据来源: GitHub Search API, FRED, BLS QCEW, Octoverse, layoffs.fyi, DOL</p>
        <p className="mt-1">Last updated: {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}
