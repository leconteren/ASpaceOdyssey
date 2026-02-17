
import React, { useState, useEffect, useMemo } from 'react';
import { User, Prompt, PromptCategory, ViewType, SortOption } from './types';
import { INITIAL_USER, SAMPLE_PROMPTS, CATEGORY_LABELS, CATEGORY_COLORS } from './constants';
import {
  Plus, BookOpen, Store, User as UserIcon, LogOut, Search, Heart, Copy, Check,
  Eye, EyeOff, Tag, X, Edit3, Trash2, Share2, Clock, Zap, Filter, ChevronDown,
  Sparkles, BookMarked, ArrowUpRight, Globe, Lock
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('promptvault_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeView, setActiveView] = useState<ViewType>('notebook');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [inputName, setInputName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('promptvault_prompts');
    let loaded: Prompt[] = saved ? JSON.parse(saved) : [];

    const currentIds = new Set(loaded.map(p => p.id));
    const missing = SAMPLE_PROMPTS.filter(p => !currentIds.has(p.id));
    if (missing.length > 0) {
      loaded = [...loaded, ...missing].sort((a, b) => b.createdAt - a.createdAt);
    }
    setPrompts(loaded);
    localStorage.setItem('promptvault_prompts', JSON.stringify(loaded));
  }, []);

  useEffect(() => {
    if (prompts.length > 0) localStorage.setItem('promptvault_prompts', JSON.stringify(prompts));
  }, [prompts]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim();
    if (!name) return;
    const isXiaohan = name.toLowerCase() === 'xiaohan';
    const newUser: User = {
      id: isXiaohan ? INITIAL_USER.id : `user_${Date.now()}`,
      name,
      avatar: `https://picsum.photos/seed/${name}/200`,
      joinedAt: Date.now(),
      points: 0,
    };
    setCurrentUser(newUser);
    localStorage.setItem('promptvault_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('promptvault_user');
  };

  const addPrompt = (prompt: Omit<Prompt, 'id' | 'userId' | 'userName' | 'createdAt' | 'updatedAt' | 'likes' | 'forks' | 'usageCount'>) => {
    if (!currentUser) return;
    const newPrompt: Prompt = {
      ...prompt,
      id: `prompt_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likes: [],
      forks: 0,
      usageCount: 0,
    };
    setPrompts(prev => [newPrompt, ...prev]);
  };

  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    ));
  };

  const deletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  const toggleLike = (id: string) => {
    if (!currentUser) return;
    setPrompts(prev => prev.map(p => {
      if (p.id === id) {
        const liked = p.likes.includes(currentUser.id);
        return {
          ...p,
          likes: liked
            ? p.likes.filter(uid => uid !== currentUser.id)
            : [...p.likes, currentUser.id],
        };
      }
      return p;
    }));
  };

  const forkPrompt = (prompt: Prompt) => {
    if (!currentUser) return;
    const forked: Prompt = {
      ...prompt,
      id: `prompt_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      title: `${prompt.title} (Fork)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: false,
      likes: [],
      forks: 0,
      usageCount: 0,
    };
    setPrompts(prev => {
      const updated = prev.map(p =>
        p.id === prompt.id ? { ...p, forks: p.forks + 1 } : p
      );
      return [forked, ...updated];
    });
  };

  const incrementUsage = (id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p
    ));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center cosmic-gradient p-4">
        <div className="glass-card p-8 rounded-3xl w-full max-w-md card-glow">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              PromptVault
            </h1>
            <p className="text-slate-400">Your personal prompt library & marketplace</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Your Name</label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-3 rounded-xl font-bold transition-all card-glow"
            >
              Enter PromptVault
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 w-full md:relative md:w-20 bg-zinc-900/80 border-t md:border-t-0 md:border-r border-white/10 backdrop-blur-xl flex md:flex-col items-center justify-around md:justify-start md:pt-6 p-3 z-50">
        <div className="hidden md:flex items-center justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
        </div>

        <NavButton
          active={activeView === 'notebook'}
          onClick={() => setActiveView('notebook')}
          icon={<BookOpen size={24} />}
          label="Notebook"
          color="indigo"
        />
        <NavButton
          active={activeView === 'marketplace'}
          onClick={() => setActiveView('marketplace')}
          icon={<Store size={24} />}
          label="Market"
          color="purple"
        />
        <NavButton
          active={activeView === 'profile'}
          onClick={() => setActiveView('profile')}
          icon={<UserIcon size={24} />}
          label="Profile"
          color="amber"
        />

        <div className="hidden md:flex flex-1" />
        <button
          onClick={handleLogout}
          className="p-3 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 h-screen scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {activeView === 'notebook' && (
            <NotebookView
              prompts={prompts.filter(p => p.userId === currentUser.id)}
              onAdd={addPrompt}
              onUpdate={updatePrompt}
              onDelete={deletePrompt}
              onToggleLike={toggleLike}
              onCopy={incrementUsage}
              currentUser={currentUser}
            />
          )}
          {activeView === 'marketplace' && (
            <MarketplaceView
              prompts={prompts.filter(p => p.isPublic)}
              onToggleLike={toggleLike}
              onFork={forkPrompt}
              onCopy={incrementUsage}
              currentUser={currentUser}
            />
          )}
          {activeView === 'profile' && (
            <ProfileView
              user={currentUser}
              prompts={prompts}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── NavButton ─────────────────────────────────────────────────────────────────

const NavButton = ({ active, onClick, icon, label, color }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all md:mb-2 ${active ? `${colorMap[color]} card-glow` : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
      title={label}
    >
      {icon}
    </button>
  );
};

// ─── Prompt Card ───────────────────────────────────────────────────────────────

interface PromptCardProps {
  prompt: Prompt;
  onToggleLike: (id: string) => void;
  onCopy: (id: string) => void;
  currentUser: User;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (id: string) => void;
  onFork?: (prompt: Prompt) => void;
  onTogglePublic?: (id: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onToggleLike, onCopy, currentUser, onEdit, onDelete, onFork, onTogglePublic }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isOwner = prompt.userId === currentUser.id;
  const isLiked = prompt.likes.includes(currentUser.id);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    onCopy(prompt.id);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:bg-white/[0.07] transition-all group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[prompt.category]}`}>
                {CATEGORY_LABELS[prompt.category]}
              </span>
              {isOwner && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${prompt.isPublic ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
                  {prompt.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                  {prompt.isPublic ? 'Public' : 'Private'}
                </span>
              )}
            </div>
            <h3
              className="text-lg font-semibold text-white cursor-pointer hover:text-indigo-300 transition-colors truncate"
              onClick={() => setExpanded(!expanded)}
            >
              {prompt.title}
            </h3>
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{prompt.description}</p>
          </div>
        </div>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {prompt.tags.map(tag => (
              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 mb-4 p-4 rounded-xl bg-black/40 border border-white/5">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-[inherit] leading-relaxed">
              {prompt.content}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {!isOwner && (
              <span className="flex items-center gap-1">
                <img src={`https://picsum.photos/seed/${prompt.userName}/100`} className="w-4 h-4 rounded-full" alt="" />
                {prompt.userName}
              </span>
            )}
            <span className="flex items-center gap-1"><Clock size={12} />{timeAgo(prompt.updatedAt)}</span>
            <span className="flex items-center gap-1"><Zap size={12} />{prompt.usageCount} uses</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
              title="Copy prompt"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
            <button
              onClick={() => onToggleLike(prompt.id)}
              className={`p-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1 text-sm ${isLiked ? 'text-pink-400' : 'text-zinc-400 hover:text-pink-400'}`}
              title="Like"
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              {prompt.likes.length > 0 && <span>{prompt.likes.length}</span>}
            </button>
            {onFork && !isOwner && (
              <button
                onClick={() => onFork(prompt)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all text-zinc-400 hover:text-indigo-400"
                title="Fork to my notebook"
              >
                <BookMarked size={16} />
              </button>
            )}
            {isOwner && onTogglePublic && (
              <button
                onClick={() => onTogglePublic(prompt.id)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all text-zinc-400 hover:text-emerald-400"
                title={prompt.isPublic ? 'Make private' : 'Share to marketplace'}
              >
                <Share2 size={16} />
              </button>
            )}
            {isOwner && onEdit && (
              <button
                onClick={() => onEdit(prompt)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all text-zinc-400 hover:text-amber-400"
                title="Edit"
              >
                <Edit3 size={16} />
              </button>
            )}
            {isOwner && onDelete && (
              <button
                onClick={() => onDelete(prompt.id)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all text-zinc-400 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Prompt Form ───────────────────────────────────────────────────────────────

const PromptForm = ({ onSubmit, onCancel, initial }: {
  onSubmit: (data: { title: string; content: string; description: string; category: PromptCategory; tags: string[]; isPublic: boolean }) => void;
  onCancel: () => void;
  initial?: Prompt;
}) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState<PromptCategory>(initial?.category || 'other');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, content, description, category, tags, isPublic });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl space-y-4 animate-in fade-in duration-300">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Prompt title..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white placeholder-zinc-600 focus:border-indigo-500 transition-colors"
      />
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Brief description of what this prompt does..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white placeholder-zinc-600 focus:border-indigo-500 transition-colors text-sm"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write your prompt here..."
        className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-white placeholder-zinc-600 resize-none focus:border-indigo-500 transition-colors text-sm leading-relaxed"
      />

      <div className="flex flex-wrap gap-3">
        <select
          value={category}
          onChange={e => setCategory(e.target.value as PromptCategory)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-zinc-300 focus:border-indigo-500 transition-colors text-sm"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key} className="bg-zinc-900">{label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="Add tags..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-white placeholder-zinc-600 text-sm focus:border-indigo-500 transition-colors"
          />
          <button type="button" onClick={addTag} className="px-3 py-2.5 bg-white/10 rounded-xl text-sm text-zinc-300 hover:bg-white/20 transition-colors">
            <Tag size={16} />
          </button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center gap-1">
              #{tag}
              <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <div
            className={`w-10 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-indigo-600' : 'bg-zinc-700'}`}
            onClick={() => setIsPublic(!isPublic)}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isPublic ? 'left-5' : 'left-1'}`} />
          </div>
          <span className="text-zinc-400">{isPublic ? 'Share to Marketplace' : 'Keep Private'}</span>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all">
            {initial ? 'Save Changes' : 'Save Prompt'}
          </button>
        </div>
      </div>
    </form>
  );
};

// ─── Notebook View ─────────────────────────────────────────────────────────────

const NotebookView = ({ prompts, onAdd, onUpdate, onDelete, onToggleLike, onCopy, currentUser }: {
  prompts: Prompt[];
  onAdd: (p: Omit<Prompt, 'id' | 'userId' | 'userName' | 'createdAt' | 'updatedAt' | 'likes' | 'forks' | 'usageCount'>) => void;
  onUpdate: (id: string, updates: Partial<Prompt>) => void;
  onDelete: (id: string) => void;
  onToggleLike: (id: string) => void;
  onCopy: (id: string) => void;
  currentUser: User;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<PromptCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, filterCategory]);

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowForm(true);
  };

  const handleFormSubmit = (data: { title: string; content: string; description: string; category: PromptCategory; tags: string[]; isPublic: boolean }) => {
    if (editingPrompt) {
      onUpdate(editingPrompt.id, data);
    } else {
      onAdd(data);
    }
    setShowForm(false);
    setEditingPrompt(null);
  };

  const handleTogglePublic = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      onUpdate(id, { isPublic: !prompt.isPublic });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-indigo-400" size={28} /> My Notebook
          </h2>
          <p className="text-zinc-500 mt-1">{prompts.length} prompts saved</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingPrompt(null); }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm card-glow"
        >
          <Plus size={18} /> New Prompt
        </button>
      </header>

      {showForm && (
        <PromptForm
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingPrompt(null); }}
          initial={editingPrompt || undefined}
        />
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search your prompts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as PromptCategory | 'all')}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-zinc-300 outline-none focus:border-indigo-500 text-sm cursor-pointer"
          >
            <option value="all" className="bg-zinc-900">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="bg-zinc-900">{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Prompt list */}
      <div className="space-y-4">
        {filtered.map(prompt => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onToggleLike={onToggleLike}
            onCopy={onCopy}
            currentUser={currentUser}
            onEdit={handleEdit}
            onDelete={onDelete}
            onTogglePublic={handleTogglePublic}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="mx-auto mb-4 text-zinc-700" size={48} />
            <p className="text-zinc-500">
              {prompts.length === 0
                ? 'Your notebook is empty. Create your first prompt!'
                : 'No prompts match your search.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Marketplace View ──────────────────────────────────────────────────────────

const MarketplaceView = ({ prompts, onToggleLike, onFork, onCopy, currentUser }: {
  prompts: Prompt[];
  onToggleLike: (id: string) => void;
  onFork: (prompt: Prompt) => void;
  onCopy: (id: string) => void;
  currentUser: User;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<PromptCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const filtered = useMemo(() => {
    let result = prompts.filter(p => {
      const matchesSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'popular':
        result.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case 'most_used':
        result.sort((a, b) => b.usageCount - a.usageCount);
        break;
    }

    return result;
  }, [prompts, searchQuery, filterCategory, sortBy]);

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    prompts.forEach(p => {
      stats[p.category] = (stats[p.category] || 0) + 1;
    });
    return stats;
  }, [prompts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Store className="text-purple-400" size={28} /> Marketplace
        </h2>
        <p className="text-zinc-500 mt-1">Discover and share prompts from the community</p>
      </header>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
        >
          All ({prompts.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count = categoryStats[key] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilterCategory(key as PromptCategory)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterCategory === key ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search prompts, tags, or authors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-zinc-300 outline-none focus:border-indigo-500 text-sm cursor-pointer"
          >
            <option value="popular" className="bg-zinc-900">Most Popular</option>
            <option value="newest" className="bg-zinc-900">Newest</option>
            <option value="most_used" className="bg-zinc-900">Most Used</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Prompt grid */}
      <div className="space-y-4">
        {filtered.map(prompt => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onToggleLike={onToggleLike}
            onCopy={onCopy}
            onFork={onFork}
            currentUser={currentUser}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Store className="mx-auto mb-4 text-zinc-700" size={48} />
            <p className="text-zinc-500">No prompts found. Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Profile View ──────────────────────────────────────────────────────────────

const ProfileView = ({ user, prompts }: { user: User; prompts: Prompt[] }) => {
  const myPrompts = prompts.filter(p => p.userId === user.id);
  const publicPrompts = myPrompts.filter(p => p.isPublic);
  const privatePrompts = myPrompts.filter(p => !p.isPublic);
  const totalLikes = myPrompts.reduce((acc, p) => acc + p.likes.length, 0);
  const totalUsage = myPrompts.reduce((acc, p) => acc + p.usageCount, 0);
  const totalForks = myPrompts.reduce((acc, p) => acc + p.forks, 0);

  // Liked prompts from others
  const likedPrompts = prompts.filter(p => p.likes.includes(user.id) && p.userId !== user.id);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Profile header */}
      <header className="text-center cosmic-gradient p-10 rounded-3xl card-glow border border-white/10">
        <img
          src={user.avatar}
          className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white/20 object-cover"
          alt=""
        />
        <h2 className="text-3xl font-bold text-white mb-1">{user.name}</h2>
        <p className="text-zinc-400 text-sm">Joined {new Date(user.joinedAt).toLocaleDateString()}</p>

        <div className="flex justify-center gap-8 mt-8">
          <StatBlock label="Prompts" value={myPrompts.length} color="text-indigo-400" />
          <StatBlock label="Published" value={publicPrompts.length} color="text-emerald-400" />
          <StatBlock label="Likes" value={totalLikes} color="text-pink-400" />
          <StatBlock label="Uses" value={totalUsage} color="text-amber-400" />
          <StatBlock label="Forks" value={totalForks} color="text-purple-400" />
        </div>
      </header>

      {/* Category breakdown */}
      <section>
        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          <Filter size={20} className="text-zinc-500" /> Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = myPrompts.filter(p => p.category === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className={`glass-card rounded-xl p-4 border ${CATEGORY_COLORS[key as PromptCategory]}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs opacity-70">{label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Public prompts */}
      {publicPrompts.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <Globe size={20} className="text-emerald-400" /> Published Prompts
          </h3>
          <div className="space-y-3">
            {publicPrompts.map(p => (
              <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-zinc-200 truncate">{p.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1 truncate">{p.description}</p>
                </div>
                <div className="flex items-center gap-4 ml-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Heart size={12} className="text-pink-400" />{p.likes.length}</span>
                  <span className="flex items-center gap-1"><Zap size={12} className="text-amber-400" />{p.usageCount}</span>
                  <span className="flex items-center gap-1"><BookMarked size={12} className="text-purple-400" />{p.forks}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Liked prompts */}
      {likedPrompts.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <Heart size={20} className="text-pink-400" /> Liked Prompts
          </h3>
          <div className="space-y-3">
            {likedPrompts.map(p => (
              <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-zinc-200 truncate">{p.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1">by {p.userName}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[p.category]}`}>
                  {CATEGORY_LABELS[p.category]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const StatBlock = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="text-center">
    <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);
