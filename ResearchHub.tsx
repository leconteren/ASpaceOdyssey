
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Building2, LineChart, Database, Newspaper, Users,
  Send, Trash2, Zap, Bot, ChevronRight, Loader2,
  Sparkles, ArrowLeft, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Orchestrator, AGENT_CONFIGS, ALL_AGENT_IDS } from './agents/index';
import { AgentId, AgentMessage } from './agents/types';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Building2, LineChart, Database, Newspaper, Users,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' },
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
    fundamental: [], technical: [], dataTracking: [], news: [], committee: [],
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Multi-agent mode state
  const [multiQuery, setMultiQuery] = useState('');
  const [multiAgents, setMultiAgents] = useState<AgentId[]>([]);
  const [multiStatus, setMultiStatus] = useState<MultiAgentStatus[]>([]);
  const [multiRunning, setMultiRunning] = useState(false);

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
    // Sync messages from orchestrator
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

      // Sync from agent history
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

  if (mode === 'select') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="text-cyan-400" size={32} />
            投研中台
          </h2>
          <p className="text-slate-500">Multi-Agent Investment Research Platform</p>
        </header>

        {/* Mode Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setMode('select')}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium text-sm"
          >
            <Bot size={16} className="inline mr-2" />
            单Agent对话
          </button>
          <button
            onClick={() => setMode('multi')}
            className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 font-medium text-sm transition-all"
          >
            <Zap size={16} className="inline mr-2" />
            多Agent协同
          </button>
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
                className={`glass-card p-6 rounded-2xl text-left hover:bg-white/5 transition-all group border-l-4 ${colors.border}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <Icon size={24} className={colors.text} />
                  </div>
                  <ChevronRight size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{config.nameZh}</h3>
                <p className="text-xs text-slate-500 mb-3">{config.name}</p>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{config.description}</p>
                <div className="flex flex-wrap gap-1">
                  {config.capabilities.slice(0, 3).map((cap, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
                      {cap}
                    </span>
                  ))}
                  {config.capabilities.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
                      +{config.capabilities.length - 3}
                    </span>
                  )}
                </div>
                {msgCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-xs text-zinc-500">
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setMode('select')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={24} />
              多Agent协同分析
            </h2>
            <p className="text-sm text-slate-500">选择Agent组合，一键调度多维分析</p>
          </div>
        </header>

        {/* Agent Selector */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <p className="text-sm font-medium text-slate-300">选择参与分析的Agent:</p>
          <div className="flex flex-wrap gap-3">
            {ALL_AGENT_IDS.map(id => {
              const config = AGENT_CONFIGS[id];
              const colors = COLOR_MAP[config.color];
              const Icon = ICON_MAP[config.icon] || Bot;
              const selected = multiAgents.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => toggleMultiAgent(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    selected
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{config.nameZh}</span>
                  {selected && <CheckCircle2 size={14} />}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMultiAgents([...ALL_AGENT_IDS])}
              className="text-xs text-cyan-400 hover:underline"
            >
              全选
            </button>
            <span className="text-xs text-zinc-600">|</span>
            <button
              onClick={() => setMultiAgents([])}
              className="text-xs text-slate-500 hover:underline"
            >
              清空
            </button>
          </div>
        </div>

        {/* Query Input */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <textarea
            value={multiQuery}
            onChange={e => setMultiQuery(e.target.value)}
            placeholder="输入你的研究问题... 例如：分析NVIDIA当前的投资价值"
            className="w-full h-28 bg-transparent text-white placeholder-zinc-600 outline-none resize-none text-lg"
          />
          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <p className="text-xs text-zinc-500">
              已选 {multiAgents.length} 个Agent
              {multiAgents.includes('committee') && ' (含投委会综合评估)'}
            </p>
            <button
              onClick={runMultiAgent}
              disabled={multiRunning || multiAgents.length === 0 || !multiQuery.trim()}
              className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                multiRunning || multiAgents.length === 0 || !multiQuery.trim()
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white monolith-glow'
              }`}
            >
              {multiRunning ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {multiRunning ? '分析中...' : '启动分析'}
            </button>
          </div>
        </div>

        {/* Results */}
        {multiStatus.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">分析进度与结果</h3>
            {multiStatus.map(({ agentId, status, result }) => {
              const config = AGENT_CONFIGS[agentId];
              const colors = COLOR_MAP[config.color];
              const Icon = ICON_MAP[config.icon] || Bot;

              return (
                <div key={agentId} className={`glass-card rounded-2xl overflow-hidden border-l-4 ${colors.border}`}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon size={18} className={colors.text} />
                      </div>
                      <div>
                        <span className="font-bold text-white">{config.nameZh}</span>
                        <span className="text-xs text-zinc-500 ml-2">{config.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'pending' && (
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">等待中</span>
                      )}
                      {status === 'running' && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> 分析中
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle2 size={12} /> 完成
                        </span>
                      )}
                      {status === 'failed' && (
                        <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded flex items-center gap-1">
                          <AlertCircle size={12} /> 失败
                        </span>
                      )}
                    </div>
                  </div>
                  {result && (
                    <div className="px-4 pb-4 border-t border-white/5">
                      <div className="mt-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap prose-invert max-h-96 overflow-y-auto">
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
    <div className="flex flex-col h-[calc(100vh-2rem)] animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/5 mb-4 shrink-0">
        <button
          onClick={() => setMode('select')}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        {agentConfig && agentColors && (
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-xl ${agentColors.bg}`}>
              <AgentIcon size={22} className={agentColors.text} />
            </div>
            <div>
              <h3 className="font-bold text-white">{agentConfig.nameZh}</h3>
              <p className="text-xs text-zinc-500">{agentConfig.name}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('multi')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all"
            title="多Agent协同"
          >
            <Zap size={18} />
          </button>
          <button
            onClick={clearChat}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all"
            title="清空对话"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {currentMessages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {agentConfig && agentColors && (
              <>
                <div className={`p-6 rounded-3xl ${agentColors.bg} mb-6`}>
                  <AgentIcon size={48} className={agentColors.text} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{agentConfig.nameZh}</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md">{agentConfig.description}</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {agentConfig.capabilities.map((cap, i) => (
                    <span key={i} className={`text-xs px-3 py-1 rounded-full ${agentColors.bg} ${agentColors.text}`}>
                      {cap}
                    </span>
                  ))}
                </div>
                <div className="mt-8 space-y-2">
                  <p className="text-xs text-zinc-600">试试问:</p>
                  {getExampleQueries(activeAgent!).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="block w-full text-left text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
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
                ? 'bg-cyan-600/20 border border-cyan-500/20 rounded-2xl rounded-tr-md px-4 py-3'
                : msg.role === 'system'
                  ? 'bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3'
                  : 'glass-card rounded-2xl rounded-tl-md px-4 py-3'
            }`}>
              {msg.role === 'agent' && agentConfig && agentColors && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                  <AgentIcon size={14} className={agentColors.text} />
                  <span className={`text-xs font-medium ${agentColors.text}`}>{agentConfig.nameZh}</span>
                </div>
              )}
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <MarkdownRenderer content={msg.content} />
              </div>
              <div className="mt-2 text-xs text-zinc-600">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] glass-card rounded-2xl rounded-tl-md px-4 py-3">
              {agentConfig && agentColors && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                  <AgentIcon size={14} className={agentColors.text} />
                  <span className={`text-xs font-medium ${agentColors.text}`}>{agentConfig.nameZh}</span>
                  <Loader2 size={12} className="animate-spin text-zinc-500" />
                </div>
              )}
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                <MarkdownRenderer content={streamingText} />
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-cyan-400" />
              <span className="text-sm text-zinc-400">思考中...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4 border-t border-white/5">
        <div className="glass-card rounded-2xl p-3 flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`向${agentConfig?.nameZh || 'Agent'}提问...`}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-zinc-600 outline-none resize-none text-sm max-h-32"
            style={{ minHeight: '2.5rem' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-xl transition-all shrink-0 ${
              isLoading || !input.trim()
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : `${agentColors?.bg || 'bg-cyan-500/20'} ${agentColors?.text || 'text-cyan-400'} hover:opacity-80`
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">
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
        <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-slate-200 mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-zinc-500 shrink-0">-</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-zinc-500 shrink-0">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-cyan-500/40 pl-3 text-zinc-400 italic my-2">
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('|') && line.endsWith('|')) {
      // Simple table row
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue; // separator
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
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{processEmphasis(remaining.slice(0, boldMatch.index))}</span>);
      }
      parts.push(<strong key={key++} className="text-white font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Code
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(<span key={key++}>{processEmphasis(remaining.slice(0, codeMatch.index))}</span>);
      }
      parts.push(
        <code key={key++} className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs">
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
  // Handle *italic*
  const parts: React.ReactNode[] = [];
  const regex = /\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<em key={match.index} className="text-slate-200">{match[1]}</em>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function getExampleQueries(agentId: AgentId): string[] {
  const examples: Record<AgentId, string[]> = {
    fundamental: [
      '分析NVIDIA的商业模式和护城河',
      '比较AVGO和MRVL在ASIC领域的竞争力',
      '评估某公司的估值是否合理',
    ],
    technical: [
      'TSLA目前的技术面如何？关键支撑阻力在哪里？',
      '半导体板块（SOX）当前处于什么技术周期？',
      '如何判断一个个股的突破是否有效？',
    ],
    dataTracking: [
      '当前需要追踪的半导体行业核心指标有哪些？',
      '帮我设计一个AI行业的数据追踪体系',
      '中国宏观经济目前有哪些领先指标值得关注？',
    ],
    news: [
      '分析最近AI芯片领域的重大事件及其影响',
      '如何评估一条市场传闻的可信度？',
      '帮我梳理一下当前市场的核心叙事',
    ],
    committee: [
      '综合分析一下NVDA是否值得现在建仓',
      '帮我评估当前portfolio的风险暴露',
      '如何在AI热潮中做好风险管理？',
    ],
  };
  return examples[agentId] || [];
}
