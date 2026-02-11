
import React, { useState, useRef, useEffect } from 'react';
import { BetaAnalysisReport, TickerBeta, AgentMessage } from './types';
import { analyzeBeta, chatWithAgent } from './correlationAgent';
import { Send, Loader2, Activity, Sparkles, ArrowRight, RefreshCw, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────

const fmt = (v: number, style: 'pct' | 'dec' = 'dec') => {
  if (style === 'pct') return `${(v * 100).toFixed(1)}%`;
  return v.toFixed(2);
};

const betaColor = (beta: number): string => {
  if (beta >= 1.5) return 'text-rose-400';
  if (beta >= 1.0) return 'text-amber-400';
  if (beta >= 0.5) return 'text-cyan-400';
  return 'text-emerald-400';
};

const betaBarWidth = (beta: number): string => {
  return `${Math.min(Math.abs(beta) / 2.0 * 100, 100)}%`;
};

// ── Presets ───────────────────────────────────────────────────────────

const PRESETS: { label: string; benchmark: string; tickers: string[] }[] = [
  { label: 'FAANG vs QQQ', benchmark: 'QQQ', tickers: ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOG'] },
  { label: '半导体 vs SMH', benchmark: 'SMH', tickers: ['NVDA', 'AMD', 'AVGO', 'TSM', 'INTC'] },
  { label: 'Crypto vs BTC', benchmark: 'BTC-USD', tickers: ['ETH-USD', 'SOL-USD', 'GLD', 'TLT'] },
  { label: '中概 vs KWEB', benchmark: 'KWEB', tickers: ['BABA', 'PDD', 'JD', 'BIDU', 'NIO'] },
];

const PERIODS = ['1M', '3M', '6M', '1Y', '2Y', '5Y'];

// ── Beta Report Table ────────────────────────────────────────────────

const BetaTable = ({ report }: { report: BetaAnalysisReport }) => {
  const [sortKey, setSortKey] = useState<keyof TickerBeta>('overallBeta');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: keyof TickerBeta) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...report.tickers].sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    return sortAsc ? va - vb : vb - va;
  });

  const SortIcon = ({ col }: { col: keyof TickerBeta }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thClass = 'px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300 transition-colors select-none whitespace-nowrap';
  const tdClass = 'px-3 py-3 text-sm font-mono';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10">
            <th className={thClass} onClick={() => handleSort('ticker')}>
              <span className="flex items-center gap-1">Ticker <SortIcon col="ticker" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('overallBeta')}>
              <span className="flex items-center gap-1">Beta (Overall) <SortIcon col="overallBeta" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('upsideBeta')}>
              <span className="flex items-center gap-1 text-emerald-500">
                <TrendingUp size={12} /> Upside β <SortIcon col="upsideBeta" />
              </span>
            </th>
            <th className={thClass} onClick={() => handleSort('downsideBeta')}>
              <span className="flex items-center gap-1 text-rose-500">
                <TrendingDown size={12} /> Downside β <SortIcon col="downsideBeta" />
              </span>
            </th>
            <th className={thClass} onClick={() => handleSort('correlation')}>
              <span className="flex items-center gap-1">Corr <SortIcon col="correlation" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('rSquared')}>
              <span className="flex items-center gap-1">R² <SortIcon col="rSquared" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('annualizedReturn')}>
              <span className="flex items-center gap-1">Ann. Ret <SortIcon col="annualizedReturn" /></span>
            </th>
            <th className={thClass} onClick={() => handleSort('annualizedVolatility')}>
              <span className="flex items-center gap-1">Ann. Vol <SortIcon col="annualizedVolatility" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, idx) => {
            const asymmetry = t.downsideBeta - t.upsideBeta;
            return (
              <React.Fragment key={t.ticker}>
                <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className={`${tdClass} font-bold text-white`}>{t.ticker}</td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${betaColor(t.overallBeta)}`}>{fmt(t.overallBeta)}</span>
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${t.overallBeta >= 1 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                          style={{ width: betaBarWidth(t.overallBeta) }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} text-emerald-400`}>{fmt(t.upsideBeta)}</td>
                  <td className={`${tdClass} text-rose-400`}>{fmt(t.downsideBeta)}</td>
                  <td className={`${tdClass} text-slate-300`}>{fmt(t.correlation)}</td>
                  <td className={`${tdClass} text-slate-400`}>{fmt(t.rSquared)}</td>
                  <td className={`${tdClass} ${t.annualizedReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmt(t.annualizedReturn, 'pct')}
                  </td>
                  <td className={`${tdClass} text-slate-400`}>{fmt(t.annualizedVolatility, 'pct')}</td>
                </tr>
                {/* Explanation row */}
                <tr className={`${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td colSpan={8} className="px-3 pb-3 pt-0">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className={`px-1.5 py-0.5 rounded ${asymmetry > 0.1 ? 'bg-rose-500/10 text-rose-400' : asymmetry < -0.1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        β asymmetry: {asymmetry > 0 ? '+' : ''}{fmt(asymmetry)}
                      </span>
                      <span className="text-slate-500">{t.explanation}</span>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Benchmark stats footer */}
      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-6 text-xs text-slate-500">
        <span>Benchmark: <span className="text-white font-bold">{report.benchmark}</span></span>
        <span>Ann. Return: <span className="text-slate-300">{fmt(report.benchmarkAnnualizedReturn, 'pct')}</span></span>
        <span>Ann. Volatility: <span className="text-slate-300">{fmt(report.benchmarkAnnualizedVolatility, 'pct')}</span></span>
        <span>Period: <span className="text-slate-300">{report.period}</span></span>
      </div>
    </div>
  );
};

// ── Chat Interface ───────────────────────────────────────────────────

const AgentChat = ({
  messages,
  onSend,
  isLoading,
}: {
  messages: AgentMessage[];
  onSend: (msg: string) => void;
  isLoading: boolean;
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
      <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2">
        <Sparkles size={14} className="text-purple-400" />
        <span className="text-xs font-bold text-slate-400">Monolith Alpha Agent</span>
        <span className="text-xs text-slate-700 ml-auto">Powered by Gemini</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-xs py-6">
            分析完成后可以在这里追问，例如：<br />
            "为什么 NVDA 的 downside beta 比 upside beta 高这么多？"
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-cyan-600/20 text-cyan-100 border border-cyan-500/20'
                : 'bg-white/5 text-slate-300 border border-white/5'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-2xl px-4 py-2.5 border border-white/5">
              <Loader2 size={14} className="animate-spin text-purple-400" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="向 Agent 追问..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50 transition-colors text-white placeholder-zinc-600"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white p-2 rounded-xl transition-all"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

// ── Main View ────────────────────────────────────────────────────────

export default function StockCorrelationView() {
  const [benchmarkInput, setBenchmarkInput] = useState('');
  const [tickerInput, setTickerInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [report, setReport] = useState<BetaAnalysisReport | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setBenchmarkInput(preset.benchmark);
    setTickerInput(preset.tickers.join(', '));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const benchmark = benchmarkInput.trim().toUpperCase();
    if (!benchmark) {
      setError('请输入 Benchmark 代码');
      return;
    }

    const tickers = tickerInput
      .split(/[,，\s]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t && t !== benchmark);

    if (tickers.length < 1) {
      setError('请至少输入 1 个分析标的（不同于 Benchmark）');
      return;
    }
    if (tickers.length > 12) {
      setError('最多支持 12 个标的');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeBeta(tickers, benchmark, selectedPeriod);
      setReport(result);
      setMessages([{
        id: `msg_${Date.now()}`,
        role: 'agent',
        content: `已完成以 ${benchmark} 为基准的 Beta 分析 (${selectedPeriod})。\n\n${result.summary}\n\n可以继续向我提问。`,
        report: result,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSend = async (text: string) => {
    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsChatting(true);

    try {
      const response = await chatWithAgent([...messages, userMsg], text);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: response,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: `出错了: ${err instanceof Error ? err.message : '未知错误'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="text-emerald-400" size={28} />
          <h2 className="text-3xl font-bold text-white">Beta Analysis Agent</h2>
        </div>
        <p className="text-slate-500">选择 Benchmark，分析标的在上涨/下跌行情中的 Beta 表现</p>
      </header>

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="glass-card p-6 rounded-3xl space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center mr-1">快捷:</span>
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Benchmark + Tickers */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-40">
            <label className="block text-xs text-slate-500 mb-1.5 font-bold">Benchmark</label>
            <input
              type="text"
              value={benchmarkInput}
              onChange={e => setBenchmarkInput(e.target.value)}
              placeholder="如 QQQ, SPY"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50 transition-colors text-white placeholder-zinc-600 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1.5 font-bold">分析标的</label>
            <input
              type="text"
              value={tickerInput}
              onChange={e => setTickerInput(e.target.value)}
              placeholder="逗号分隔，如 AAPL, MSFT, NVDA, TSLA"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50 transition-colors text-white placeholder-zinc-600 text-sm"
            />
          </div>
        </div>

        {/* Period + Submit */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">周期:</span>
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === p
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-500 border border-white/10 hover:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
          <div className="flex-1" />
          <button
            type="submit"
            disabled={isAnalyzing || !benchmarkInput.trim() || !tickerInput.trim()}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all monolith-glow text-sm"
          >
            {isAnalyzing ? (
              <><Loader2 size={14} className="animate-spin" /> 分析中...</>
            ) : (
              <><ArrowRight size={14} /> 运行分析</>
            )}
          </button>
        </div>

        {error && (
          <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
      </form>

      {/* Report */}
      {report && report.tickers.length > 0 && (
        <div className="space-y-6">
          <section className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Beta Report — vs {report.benchmark}
              </h3>
              <button
                onClick={() => { setReport(null); setMessages([]); }}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={12} /> 重置
              </button>
            </div>
            <BetaTable report={report} />
          </section>

          {/* AI Insights */}
          {(report.summary || report.riskInsights) && (
            <section className="glass-card p-6 rounded-3xl border-l-4 border-purple-500/40">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" /> AI 风险洞察
              </h3>
              {report.summary && (
                <p className="text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{report.summary}</p>
              )}
              {report.riskInsights && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{report.riskInsights}</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Chat */}
      <AgentChat messages={messages} onSend={handleChatSend} isLoading={isChatting} />
    </div>
  );
}
