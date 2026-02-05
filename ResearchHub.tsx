
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Building2, LineChart, Database, Users, Lightbulb, Shield,
  Send, Trash2, Zap, Bot, ChevronRight, Loader2,
  Sparkles, ArrowLeft, CheckCircle2, AlertCircle,
  TrendingUp, X, Search, BarChart3
} from 'lucide-react';
import { Orchestrator, AGENT_CONFIGS, ALL_AGENT_IDS } from './agents/index';
import { AgentId, AgentMessage } from './agents/types';
import { TradingViewChart, TradingViewMiniChart, TradingViewTechnicalAnalysis } from './components/TradingViewChart';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Building2, LineChart, Database, Users, Lightbulb, Shield,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string }> = {
  cyan: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', light: 'bg-blue-50' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500', light: 'bg-purple-50' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', light: 'bg-emerald-50' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', light: 'bg-amber-50' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-500', light: 'bg-rose-50' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500', light: 'bg-orange-50' },
  red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', light: 'bg-red-50' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-500', light: 'bg-indigo-50' },
};

type Mode = 'select' | 'chat' | 'multi';

interface MultiAgentStatus {
  agentId: AgentId;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

const orchestrator = new Orchestrator();

export default function ResearchHub() {
  const [mode, setMode] = useState<Mode>('select');
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [messages, setMessages] = useState<Record<AgentId, AgentMessage[]>>({
    ideaSourcing: [], fundamental: [], technical: [], dataTracking: [], riskControl: [], committee: [],
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Multi-agent mode state
  const [multiQuery, setMultiQuery] = useState('');
  const [multiAgents, setMultiAgents] = useState<AgentId[]>([]);
  const [multiStatus, setMultiStatus] = useState<MultiAgentStatus[]>([]);
  const [multiRunning, setMultiRunning] = useState(false);

  // Chart panel state
  const [showChart, setShowChart] = useState(false);
  const [chartSymbol, setChartSymbol] = useState('NVDA');
  const [chartInput, setChartInput] = useState('');
  const [chartView, setChartView] = useState<'chart' | 'technical'>('chart');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    if (mode === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, activeAgent]);

  const selectAgent = (id: AgentId) => {
    setActiveAgent(id);
    setMode('chat');
    const agent = orchestrator.getAgent(id);
    setMessages(prev => ({ ...prev, [id]: agent.getHistory() }));
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeAgent || isLoading) return;

    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => ({
      ...prev,
      [activeAgent]: [...prev[activeAgent], userMsg],
    }));
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      let accumulated = '';
      await orchestrator.chatWithAgent(activeAgent, userMsg.content, (chunk) => {
        accumulated += chunk;
        setStreamingText(accumulated);
      });

      const agent = orchestrator.getAgent(activeAgent);
      setMessages(prev => ({ ...prev, [activeAgent]: agent.getHistory() }));
      setStreamingText('');
    } catch (error) {
      const errMsg: AgentMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => ({
        ...prev,
        [activeAgent]: [...prev[activeAgent], errMsg],
      }));
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  }, [input, activeAgent, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (!activeAgent) return;
    orchestrator.clearAgentHistory(activeAgent);
    setMessages(prev => ({ ...prev, [activeAgent]: [] }));
  };

  const toggleMultiAgent = (id: AgentId) => {
    setMultiAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const runMultiAgent = async () => {
    if (!multiQuery.trim() || multiAgents.length === 0 || multiRunning) return;

    setMultiRunning(true);
    setMultiStatus(multiAgents.map(id => ({ agentId: id, status: 'pending' })));

    try {
      await orchestrator.runMultiAgentTask(
        multiQuery,
        multiAgents,
        (agentId) => {
          setMultiStatus(prev =>
            prev.map(s => s.agentId === agentId ? { ...s, status: 'running' } : s)
          );
        },
        (agentId, result) => {
          setMultiStatus(prev =>
            prev.map(s => s.agentId === agentId ? { ...s, status: 'completed', result } : s)
          );
        }
      );
    } catch {
      setMultiStatus(prev =>
        prev.map(s => s.status === 'running' ? { ...s, status: 'failed' } : s)
      );
    } finally {
      setMultiRunning(false);
    }
  };

  // ==================== RENDER ====================

  // Chart Panel Component
  const ChartPanel = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">行情图表</h3>
              <p className="text-xs text-gray-500">TradingView 实时数据</p>
            </div>
          </div>
          <button
            onClick={() => setShowChart(false)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Symbol Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={chartInput}
                onChange={e => setChartInput(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter' && chartInput.trim()) {
                    setChartSymbol(chartInput.trim());
                  }
                }}
                placeholder="输入股票代码 (如 NVDA, AAPL, TSLA)"
                className="flex-1 outline-none text-sm text-gray-800"
              />
            </div>
            <button
              onClick={() => chartInput.trim() && setChartSymbol(chartInput.trim())}
              className="px-4 py-2 bg-[#0079d3] text-white rounded-lg text-sm font-medium hover:bg-[#006cbd]"
            >
              查看
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMD', 'GOOGL'].map(s => (
              <button
                key={s}
                onClick={() => { setChartSymbol(s); setChartInput(s); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  chartSymbol === s
                    ? 'bg-[#0079d3] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setChartView('chart')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              chartView === 'chart'
                ? 'text-[#0079d3] border-b-2 border-[#0079d3]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp size={16} />
            K线图表
          </button>
          <button
            onClick={() => setChartView('technical')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              chartView === 'technical'
                ? 'text-[#0079d3] border-b-2 border-[#0079d3]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 size={16} />
            技术分析
          </button>
        </div>

        {/* Chart Content */}
        <div className="h-[500px]">
          {chartView === 'chart' ? (
            <TradingViewChart symbol={chartSymbol} height={500} />
          ) : (
            <TradingViewTechnicalAnalysis symbol={chartSymbol} height={500} />
          )}
        </div>
      </div>
    </div>
  );

  if (mode === 'select') {
    return (
      <div className="max-w-4xl">
        {/* Chart Panel Modal */}
        {showChart && <ChartPanel />}

        {/* Header */}
        <div className="reddit-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff4500] rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">AI 研究中心</h2>
                <p className="text-sm text-gray-500">Multi-Agent Investment Research Platform</p>
              </div>
            </div>
            <button
              onClick={() => setShowChart(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
            >
              <TrendingUp size={18} />
              <span className="font-medium text-sm">行情图表</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="reddit-card mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setMode('select')}
              className="flex-1 py-3 text-sm font-semibold text-[#ff4500] border-b-2 border-[#ff4500] flex items-center justify-center gap-2"
            >
              <Bot size={16} />
              单Agent对话
            </button>
            <button
              onClick={() => setMode('multi')}
              className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              多Agent协同
            </button>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ALL_AGENT_IDS.map(id => {
            const config = AGENT_CONFIGS[id];
            const colors = COLOR_MAP[config.color];
            const Icon = ICON_MAP[config.icon] || Bot;
            const msgCount = messages[id]?.length || 0;

            return (
              <button
                key={id}
                onClick={() => selectAgent(id)}
                className="reddit-card p-4 text-left hover:border-gray-400 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${colors.light}`}>
                    <Icon size={20} className={colors.text} />
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-800 mb-0.5">{config.nameZh}</h3>
                <p className="text-xs text-gray-500 mb-2">{config.name}</p>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{config.description}</p>
                <div className="flex flex-wrap gap-1">
                  {config.capabilities.slice(0, 3).map((cap, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {cap}
                    </span>
                  ))}
                  {config.capabilities.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      +{config.capabilities.length - 3}
                    </span>
                  )}
                </div>
                {msgCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    {msgCount} 条对话记录
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'multi') {
    return (
      <div className="max-w-4xl">
        {/* Chart Panel Modal */}
        {showChart && <ChartPanel />}

        {/* Header */}
        <div className="reddit-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('select')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Zap className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">多Agent协同分析</h2>
                <p className="text-sm text-gray-500">选择Agent组合，一键调度多维分析</p>
              </div>
            </div>
            <button
              onClick={() => setShowChart(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
            >
              <TrendingUp size={18} />
              <span className="font-medium text-sm">行情图表</span>
            </button>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="reddit-card p-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">选择参与分析的Agent:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {ALL_AGENT_IDS.map(id => {
              const config = AGENT_CONFIGS[id];
              const colors = COLOR_MAP[config.color];
              const Icon = ICON_MAP[config.icon] || Bot;
              const selected = multiAgents.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => toggleMultiAgent(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${
                    selected
                      ? `${colors.light} ${colors.text} ${colors.border}`
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon size={14} />
                  <span className="font-medium">{config.nameZh}</span>
                  {selected && <CheckCircle2 size={12} />}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 text-xs">
            <button
              onClick={() => setMultiAgents([...ALL_AGENT_IDS])}
              className="text-[#0079d3] hover:underline"
            >
              全选
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setMultiAgents([])}
              className="text-gray-500 hover:underline"
            >
              清空
            </button>
          </div>
        </div>

        {/* Query Input */}
        <div className="reddit-card p-4 mb-4">
          <textarea
            value={multiQuery}
            onChange={e => setMultiQuery(e.target.value)}
            placeholder="输入你的研究问题... 例如：分析NVIDIA当前的投资价值"
            className="w-full h-28 border border-gray-200 rounded-lg p-3 outline-none focus:border-[#0079d3] resize-none text-gray-800"
          />
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              已选 {multiAgents.length} 个Agent
              {multiAgents.includes('committee') && ' (含投委会综合评估)'}
            </p>
            <button
              onClick={runMultiAgent}
              disabled={multiRunning || multiAgents.length === 0 || !multiQuery.trim()}
              className={`px-5 py-2 rounded-full font-semibold flex items-center gap-2 text-sm transition-all ${
                multiRunning || multiAgents.length === 0 || !multiQuery.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#ff4500] text-white hover:bg-[#ff5414]'
              }`}
            >
              {multiRunning ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {multiRunning ? '分析中...' : '启动分析'}
            </button>
          </div>
        </div>

        {/* Results */}
        {multiStatus.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 px-1">分析进度与结果</h3>
            {multiStatus.map(({ agentId, status, result }) => {
              const config = AGENT_CONFIGS[agentId];
              const colors = COLOR_MAP[config.color];
              const Icon = ICON_MAP[config.icon] || Bot;

              return (
                <div key={agentId} className="reddit-card overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.light}`}>
                        <Icon size={16} className={colors.text} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{config.nameZh}</span>
                        <span className="text-xs text-gray-500 ml-2">{config.name}</span>
                      </div>
                    </div>
                    <div>
                      {status === 'pending' && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">等待中</span>
                      )}
                      {status === 'running' && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> 分析中
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle2 size={12} /> 完成
                        </span>
                      )}
                      {status === 'failed' && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                          <AlertCircle size={12} /> 失败
                        </span>
                      )}
                    </div>
                  </div>
                  {result && (
                    <div className="p-4 bg-gray-50">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                        <MarkdownRenderer content={result} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==================== CHAT MODE ====================
  const agentConfig = activeAgent ? AGENT_CONFIGS[activeAgent] : null;
  const agentColors = agentConfig ? COLOR_MAP[agentConfig.color] : null;
  const AgentIcon = agentConfig ? (ICON_MAP[agentConfig.icon] || Bot) : Bot;
  const currentMessages = activeAgent ? messages[activeAgent] : [];

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-6rem)]">
      {/* Chart Panel Modal */}
      {showChart && <ChartPanel />}

      {/* Header */}
      <div className="reddit-card p-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('select')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          {agentConfig && agentColors && (
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-2 rounded-lg ${agentColors.light}`}>
                <AgentIcon size={18} className={agentColors.text} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{agentConfig.nameZh}</h3>
                <p className="text-xs text-gray-500">{agentConfig.name}</p>
              </div>
            </div>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => setShowChart(true)}
              className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
              title="行情图表"
            >
              <TrendingUp size={16} />
            </button>
            <button
              onClick={() => setMode('multi')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="多Agent协同"
            >
              <Zap size={16} />
            </button>
            <button
              onClick={clearChat}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="清空对话"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {currentMessages.length === 0 && !streamingText && (
          <div className="reddit-card p-8 text-center">
            {agentConfig && agentColors && (
              <>
                <div className={`w-16 h-16 mx-auto rounded-2xl ${agentColors.light} flex items-center justify-center mb-4`}>
                  <AgentIcon size={32} className={agentColors.text} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{agentConfig.nameZh}</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{agentConfig.description}</p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {agentConfig.capabilities.map((cap, i) => (
                    <span key={i} className={`text-xs px-3 py-1 rounded-full ${agentColors.light} ${agentColors.text}`}>
                      {cap}
                    </span>
                  ))}
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <p className="text-xs text-gray-500 mb-2">试试问:</p>
                  {getExampleQueries(activeAgent!).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="block w-full text-left text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-lg transition-all border border-gray-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {currentMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-[#0079d3] text-white rounded-2xl rounded-tr-md px-4 py-3'
                : msg.role === 'system'
                  ? 'bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3'
                  : 'reddit-card rounded-2xl rounded-tl-md px-4 py-3'
            }`}>
              {msg.role === 'agent' && agentConfig && agentColors && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                  <AgentIcon size={12} className={agentColors.text} />
                  <span className={`text-xs font-medium ${agentColors.text}`}>{agentConfig.nameZh}</span>
                </div>
              )}
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? '' : 'text-gray-700'}`}>
                {msg.role === 'user' ? msg.content : <MarkdownRenderer content={msg.content} />}
              </div>
              <div className={`mt-2 text-xs ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] reddit-card rounded-2xl rounded-tl-md px-4 py-3">
              {agentConfig && agentColors && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                  <AgentIcon size={12} className={agentColors.text} />
                  <span className={`text-xs font-medium ${agentColors.text}`}>{agentConfig.nameZh}</span>
                  <Loader2 size={10} className="animate-spin text-gray-400" />
                </div>
              )}
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                <MarkdownRenderer content={streamingText} />
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="reddit-card rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#0079d3]" />
              <span className="text-sm text-gray-500">思考中...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4">
        <div className="reddit-card p-3 flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`向${agentConfig?.nameZh || 'Agent'}提问...`}
            rows={1}
            className="flex-1 outline-none resize-none text-sm text-gray-800 max-h-32 py-2"
            style={{ minHeight: '2.5rem' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2.5 rounded-full transition-all shrink-0 ${
              isLoading || !input.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#0079d3] text-white hover:bg-[#006cbd]'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Enter 发送 / Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}

// ==================== HELPERS ====================

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-gray-800 mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-gray-700 mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-gray-400 shrink-0">-</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-gray-400 shrink-0">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-[#ff4500] pl-3 text-gray-500 italic my-2">
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      elements.push(
        <div key={i} className="flex gap-4 text-xs">
          {cells.map((cell, j) => (
            <span key={j} className="flex-1 py-1">{renderInline(cell)}</span>
          ))}
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i}>{renderInline(line)}</p>
      );
    }
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{processEmphasis(remaining.slice(0, boldMatch.index))}</span>);
      }
      parts.push(<strong key={key++} className="text-gray-800 font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(<span key={key++}>{processEmphasis(remaining.slice(0, codeMatch.index))}</span>);
      }
      parts.push(
        <code key={key++} className="text-[#0079d3] bg-blue-50 px-1.5 py-0.5 rounded text-xs">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    parts.push(<span key={key++}>{processEmphasis(remaining)}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function processEmphasis(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<em key={match.index} className="text-gray-600">{match[1]}</em>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function getExampleQueries(agentId: AgentId): string[] {
  const examples: Record<AgentId, string[]> = {
    ideaSourcing: [
      '最近有什么非共识的投资机会？',
      '帮我扫描一下AI领域的冷门标的',
      'Reddit上最近有什么另类投资信号？',
    ],
    fundamental: [
      '分析NVIDIA的商业模式和护城河',
      '比较AVGO和MRVL在ASIC领域的竞争力',
      '生成一份NVDA的完整Investment Memo',
    ],
    technical: [
      'TSLA目前的技术面如何？关键支撑阻力在哪里？',
      '半导体板块（SOX）当前处于什么技术周期？',
      '我想买AMD，现在是不是追高？',
    ],
    dataTracking: [
      '帮我设计追踪NVDA的关键指标体系',
      '半导体周期应该追踪哪些数据？',
      '云计算capex近期有什么变化？',
    ],
    riskControl: [
      '帮我检查一下这笔交易是否符合纪律',
      '我现在很想追高买入，帮我冷静一下',
      '评估一下我当前portfolio的风险暴露',
    ],
    committee: [
      'Challenge一下我对NVDA的投资论点',
      '综合分析一下这个公司是否值得建仓',
      '帮我review一下这笔投资决策',
    ],
  };
  return examples[agentId] || [];
}
