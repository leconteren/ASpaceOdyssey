
import React, { useState, useRef, useEffect } from 'react';
import { CorrelationAnalysis, AgentMessage } from './types';
import { analyzeCorrelation, chatWithAgent } from './correlationAgent';
import { Send, Loader2, Activity, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

// ── Color utilities for heatmap ──────────────────────────────────────

function correlationColor(value: number): string {
  // -1 → rose/red, 0 → slate, +1 → cyan
  if (value >= 0) {
    const intensity = Math.round(value * 255);
    return `rgba(6, 182, 212, ${(intensity / 255) * 0.85 + 0.15})`; // cyan-500
  } else {
    const intensity = Math.round(Math.abs(value) * 255);
    return `rgba(244, 63, 94, ${(intensity / 255) * 0.85 + 0.15})`; // rose-500
  }
}

function correlationTextColor(value: number): string {
  return Math.abs(value) > 0.6 ? '#fff' : '#94a3b8';
}

// ── Preset ticker groups ─────────────────────────────────────────────

const PRESETS: { label: string; tickers: string[] }[] = [
  { label: 'FAANG', tickers: ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOG'] },
  { label: '半导体', tickers: ['NVDA', 'AMD', 'AVGO', 'TSM', 'INTC'] },
  { label: '电动车', tickers: ['TSLA', 'NIO', 'XPEV', 'LI', 'RIVN'] },
  { label: '中概股', tickers: ['BABA', 'PDD', 'JD', 'BIDU', 'NIO'] },
];

const PERIODS = ['1M', '3M', '6M', '1Y', '2Y', '5Y'];

// ── Heatmap Component ────────────────────────────────────────────────

const CorrelationHeatmap = ({ analysis }: { analysis: CorrelationAnalysis }) => {
  const { tickers, matrix } = analysis;
  const n = tickers.length;

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-1 min-w-fit"
        style={{
          gridTemplateColumns: `80px repeat(${n}, 72px)`,
          gridTemplateRows: `36px repeat(${n}, 72px)`,
        }}
      >
        {/* Top-left empty cell */}
        <div />

        {/* Column headers */}
        {tickers.map(t => (
          <div
            key={`col-${t}`}
            className="flex items-end justify-center text-xs font-bold text-slate-300 pb-1"
          >
            {t}
          </div>
        ))}

        {/* Rows */}
        {tickers.map((rowTicker, i) => (
          <React.Fragment key={`row-${rowTicker}`}>
            {/* Row header */}
            <div className="flex items-center justify-end pr-3 text-xs font-bold text-slate-300">
              {rowTicker}
            </div>

            {/* Cells */}
            {matrix[i]?.map((val, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="rounded-lg flex items-center justify-center text-sm font-mono font-bold transition-all hover:scale-110 cursor-default"
                style={{
                  backgroundColor: correlationColor(val),
                  color: correlationTextColor(val),
                }}
                title={`${rowTicker} × ${tickers[j]}: ${val.toFixed(3)}`}
              >
                {val.toFixed(2)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
        <span className="text-rose-400">-1.0 负相关</span>
        <div className="w-32 h-2 rounded-full bg-gradient-to-r from-rose-500 via-slate-700 to-cyan-500" />
        <span className="text-cyan-400">+1.0 正相关</span>
      </div>
    </div>
  );
};

// ── Pair Cards Component ─────────────────────────────────────────────

const PairCards = ({ analysis }: { analysis: CorrelationAnalysis }) => {
  const sorted = [...analysis.pairs].sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((pair, idx) => {
        const isPositive = pair.correlation >= 0;
        const absVal = Math.abs(pair.correlation);
        const barColor = isPositive ? 'bg-cyan-500' : 'bg-rose-500';
        const borderColor = isPositive ? 'border-cyan-500/30' : 'border-rose-500/30';

        return (
          <div
            key={idx}
            className={`glass-card p-4 rounded-2xl border-l-4 ${borderColor}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-200 text-sm">
                {pair.ticker1} × {pair.ticker2}
              </span>
              <span
                className={`text-lg font-mono font-black ${isPositive ? 'text-cyan-400' : 'text-rose-400'}`}
              >
                {pair.correlation > 0 ? '+' : ''}
                {pair.correlation.toFixed(3)}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-700`}
                style={{ width: `${absVal * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{pair.explanation}</p>
          </div>
        );
      })}
    </div>
  );
};

// ── Chat Interface Component ─────────────────────────────────────────

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
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col" style={{ maxHeight: '480px' }}>
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
        <Sparkles size={16} className="text-purple-400" />
        <span className="text-sm font-bold text-slate-300">Monolith Alpha Agent</span>
        <span className="text-xs text-slate-600 ml-auto">Powered by Gemini</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-8">
            <Sparkles size={24} className="mx-auto mb-3 text-purple-500/50" />
            试着问一些问题，例如：<br />
            "NVDA 和 AMD 的相关性为什么这么高？"<br />
            "哪些股票可以用来对冲科技股风险？"
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/20'
                  : 'bg-white/5 text-slate-300 border border-white/5'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
              <Loader2 size={16} className="animate-spin text-purple-400" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="向 Agent 提问..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500/50 transition-colors text-white placeholder-zinc-600"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white p-2.5 rounded-xl transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

// ── Main View Component ──────────────────────────────────────────────

export default function StockCorrelationView() {
  const [tickerInput, setTickerInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [analysis, setAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (tickers: string[]) => {
    setTickerInput(tickers.join(', '));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tickers = tickerInput
      .split(/[,，\s]+/)
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);

    if (tickers.length < 2) {
      setError('请至少输入 2 个股票代码');
      return;
    }

    if (tickers.length > 10) {
      setError('最多支持 10 个股票代码');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeCorrelation(tickers, selectedPeriod);
      setAnalysis(result);

      // Add a system message summarizing the analysis
      setMessages([
        {
          id: `msg_${Date.now()}`,
          role: 'agent',
          content: `已完成 ${tickers.join(', ')} 在 ${selectedPeriod} 周期内的相关性分析。\n\n${result.summary}\n\n你可以继续向我提问关于这些股票的更多问题。`,
          analysis: result,
          timestamp: Date.now(),
        },
      ]);
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
      const agentMsg: AgentMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      const errorMsg: AgentMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: `抱歉，出现了错误: ${err instanceof Error ? err.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="text-cyan-400" size={32} />
          <h2 className="text-3xl font-bold text-white">Stock Correlation Agent</h2>
        </div>
        <p className="text-slate-500">AI 驱动的多股票价格相关性分析</p>
      </header>

      {/* Input Section */}
      <form onSubmit={handleAnalyze} className="glass-card p-6 rounded-3xl space-y-4">
        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center mr-1">快捷选择:</span>
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.tickers)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Ticker Input */}
        <div>
          <input
            type="text"
            value={tickerInput}
            onChange={e => setTickerInput(e.target.value)}
            placeholder="输入股票代码，逗号或空格分隔 (如: AAPL, MSFT, GOOG)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50 transition-colors text-white placeholder-zinc-600"
          />
        </div>

        {/* Period Selection & Submit */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-slate-500">分析周期:</span>
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === p
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-slate-500 border border-white/10 hover:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}

          <div className="flex-1" />

          <button
            type="submit"
            disabled={isAnalyzing || !tickerInput.trim()}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all monolith-glow"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 分析中...
              </>
            ) : (
              <>
                <ArrowRight size={16} /> 开始分析
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
      </form>

      {/* Results Section */}
      {analysis && analysis.matrix.some(row => row.some(v => v !== 0 || row.indexOf(v) === analysis.matrix.indexOf(row))) && (
        <div className="space-y-8">
          {/* Correlation Matrix Heatmap */}
          <section className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                相关性矩阵
              </h3>
              <button
                onClick={() => {
                  setAnalysis(null);
                  setMessages([]);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={12} /> 重置
              </button>
            </div>
            <CorrelationHeatmap analysis={analysis} />
          </section>

          {/* Pair Details */}
          {analysis.pairs.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                配对分析
              </h3>
              <PairCards analysis={analysis} />
            </section>
          )}

          {/* AI Insights */}
          {(analysis.summary || analysis.marketInsights) && (
            <section className="glass-card p-6 rounded-3xl border-l-4 border-purple-500/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                AI 洞察
              </h3>
              {analysis.summary && (
                <p className="text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                  {analysis.summary}
                </p>
              )}
              {analysis.marketInsights && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-purple-400 font-bold mb-2 uppercase tracking-wider">
                    投资建议
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.marketInsights}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Chat Section */}
      <section>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          与 Agent 对话
        </h3>
        <AgentChat messages={messages} onSend={handleChatSend} isLoading={isChatting} />
      </section>
    </div>
  );
}
