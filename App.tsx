
import React, { useState, useEffect } from 'react';
import { Post, PredictionEvent, ViewType, PredictionChoice } from './types';
import { INITIAL_USER, parseInitialPosts } from './constants';
import {
  Home, TrendingUp, User as UserIcon, LogOut, Send, Clock,
  Sparkles, Loader2, Mail, Lock, UserPlus, Search, Bell,
  ChevronUp, ChevronDown, MessageCircle, Share2, Bookmark,
  Plus, MoreHorizontal, Award, Calendar
} from 'lucide-react';
import ResearchHub from './ResearchHub';
import { useAuth, UserProfile } from './lib/AuthContext';

export default function App() {
  const { user, profile, loading, signIn, signUp, signOut } = useAuth();

  const [activeView, setActiveView] = useState<ViewType>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<PredictionEvent[]>([]);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize data
  useEffect(() => {
    const savedPosts = localStorage.getItem('monolith_posts');
    let loadedPosts: Post[] = savedPosts ? JSON.parse(savedPosts) : [];

    const initial = parseInitialPosts(INITIAL_USER.id, INITIAL_USER.name);
    const currentIds = new Set(loadedPosts.map(p => p.id));
    const missingInitial = initial.filter(p => !currentIds.has(p.id));

    if (missingInitial.length > 0) {
      loadedPosts = [...loadedPosts, ...missingInitial].sort((a, b) => b.timestamp - a.timestamp);
    }

    setPosts(loadedPosts);
    localStorage.setItem('monolith_posts', JSON.stringify(loadedPosts));

    const savedEvents = localStorage.getItem('monolith_events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save state
  useEffect(() => {
    if (posts.length > 0) localStorage.setItem('monolith_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    if (events.length > 0) localStorage.setItem('monolith_events', JSON.stringify(events));
  }, [events]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setAuthError(error.message || '登录失败，请检查邮箱和密码');
        }
      } else {
        if (!name.trim()) {
          setAuthError('请输入姓名');
          setAuthLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          setAuthError(error.message || '注册失败，请重试');
        } else {
          setAuthError('');
          setAuthMode('login');
          alert('注册成功！如果需要邮箱验证，请查收验证邮件。');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || '发生错误');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const currentUser = profile ? {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar_url,
    joinedAt: new Date(profile.created_at).getTime(),
    points: profile.points,
  } : null;

  const createPost = (rawContent: string) => {
    if (!currentUser) return;

    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const newPosts: Post[] = [];

    if (dateRegex.test(rawContent)) {
      const parts = rawContent.split(/(\d{4}-\d{2}-\d{2})/);
      for (let i = 1; i < parts.length; i += 2) {
        const dateStr = parts[i].trim();
        const content = parts[i + 1]?.trim();
        if (dateStr && content) {
          newPosts.push({
            id: `post_${Date.now()}_${i}`,
            userId: currentUser.id,
            userName: currentUser.name,
            content,
            timestamp: new Date(dateStr).getTime(),
            dateStr
          });
        }
      }
    } else {
      newPosts.push({
        id: `post_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        content: rawContent,
        timestamp: Date.now(),
        dateStr: new Date().toISOString().split('T')[0]
      });
    }

    setPosts(prev => [...newPosts, ...prev].sort((a, b) => b.timestamp - a.timestamp));
  };

  const createEvent = (title: string, description: string, solveDateStr: string) => {
    if (!currentUser) return;
    const newEvent: PredictionEvent = {
      id: `event_${Date.now()}`,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      title,
      description,
      createdAt: Date.now(),
      solveDate: new Date(solveDateStr).getTime(),
      status: 'active',
      votes: []
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleVote = (eventId: string, choice: PredictionChoice) => {
    if (!currentUser) return;
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const existingVoteIndex = ev.votes.findIndex(v => v.userId === currentUser.id);
        const newVotes = [...ev.votes];
        if (existingVoteIndex >= 0) {
          newVotes[existingVoteIndex].choice = choice;
        } else {
          newVotes.push({ userId: currentUser.id, choice });
        }
        return { ...ev, votes: newVotes };
      }
      return ev;
    }));
  };

  const solveEvent = (eventId: string, result: PredictionChoice) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, status: 'solved', finalResult: result };
      }
      return ev;
    }));
  };

  const userPoints = events.reduce((acc, ev) => {
    if (ev.status === 'solved' && ev.finalResult !== undefined) {
      const userVote = ev.votes.find(v => v.userId === currentUser?.id);
      if (userVote && userVote.choice === ev.finalResult) {
        return acc + 1;
      }
    }
    return acc;
  }, 0);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dae0e6]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#ff4500] mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // Auth screen - Reddit style
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#dae0e6] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#ff4500] p-6 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles size={28} />
              <h1 className="text-2xl font-bold">投研中台</h1>
            </div>
            <p className="text-sm opacity-90">Multi-Agent Investment Research</p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                authMode === 'login'
                  ? 'text-[#ff4500] border-b-2 border-[#ff4500]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                authMode === 'signup'
                  ? 'text-[#ff4500] border-b-2 border-[#ff4500]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              注册
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="p-6 space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  姓名
                </label>
                <div className="relative">
                  <UserPlus size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="你的名字"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#0079d3] focus:ring-1 focus:ring-[#0079d3] outline-none transition-all"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                邮箱
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#0079d3] focus:ring-1 focus:ring-[#0079d3] outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                密码
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#0079d3] focus:ring-1 focus:ring-[#0079d3] outline-none transition-all"
                />
              </div>
            </div>

            {authError && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#ff4500] hover:bg-[#ff5414] text-white py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  处理中...
                </>
              ) : (
                authMode === 'login' ? '登录' : '创建账户'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center pb-6">
            {authMode === 'login'
              ? '没有账户？点击上方"注册"创建'
              : '已有账户？点击上方"登录"'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dae0e6]">
      {/* Top Header - Reddit style */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff4500] rounded-full flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">投研中台</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="header-search flex items-center px-4 py-2">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="搜索..."
                className="bg-transparent outline-none flex-1 text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
              <img
                src={currentUser.avatar}
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{userPoints} 积分</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto bg-white border-r border-gray-200">
          <nav className="py-4">
            <button
              onClick={() => setActiveView('feed')}
              className={`sidebar-link w-full ${activeView === 'feed' ? 'active' : ''}`}
            >
              <Home size={20} />
              <span>信息流</span>
            </button>
            <button
              onClick={() => setActiveView('market')}
              className={`sidebar-link w-full ${activeView === 'market' ? 'active' : ''}`}
            >
              <TrendingUp size={20} />
              <span>预测市场</span>
            </button>
            <button
              onClick={() => setActiveView('research')}
              className={`sidebar-link w-full ${activeView === 'research' ? 'active' : ''}`}
            >
              <Sparkles size={20} />
              <span>AI 研究</span>
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`sidebar-link w-full ${activeView === 'profile' ? 'active' : ''}`}
            >
              <UserIcon size={20} />
              <span>个人中心</span>
            </button>

            <div className="border-t border-gray-200 mt-4 pt-4 px-4">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">
                AI Agents
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">基本面研究</p>
                <p className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">技术分析</p>
                <p className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">数据追踪</p>
                <p className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">新闻情报</p>
                <p className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">投委会</p>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3rem)] py-4 px-4">
          {activeView === 'feed' && (
            <FeedView
              posts={posts}
              createPost={createPost}
              currentUser={currentUser}
            />
          )}
          {activeView === 'market' && (
            <MarketView
              events={events}
              createEvent={createEvent}
              onVote={handleVote}
              onSolve={solveEvent}
              currentUser={currentUser}
            />
          )}
          {activeView === 'research' && (
            <ResearchHub />
          )}
          {activeView === 'profile' && (
            <ProfileView
              user={{...currentUser, points: userPoints}}
              posts={posts.filter(p => p.userId === currentUser.id)}
              participatedEvents={events.filter(ev => ev.votes.some(v => v.userId === currentUser.id))}
            />
          )}
        </main>

        {/* Right Sidebar - Info Panel */}
        <aside className="hidden xl:block w-80 shrink-0 py-4 pr-4">
          <div className="reddit-card p-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#ff4500] rounded-full flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">投研中台</h3>
                <p className="text-xs text-gray-500">r/ResearchHub</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              多Agent协同的智能投研平台，集成基本面、技术面、数据追踪、新闻情报等AI分析能力。
            </p>
            <button
              onClick={() => setActiveView('research')}
              className="reddit-btn w-full text-center"
            >
              开始研究
            </button>
          </div>

          <div className="reddit-card p-4">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Award size={18} className="text-[#ff4500]" />
              排行榜
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#ff4500]">1</span>
                  <span className="text-sm text-gray-700">{currentUser.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500">{userPoints} pts</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
        <button
          onClick={() => setActiveView('feed')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'feed' ? 'text-[#ff4500]' : 'text-gray-500'}`}
        >
          <Home size={20} />
          <span className="text-xs">信息流</span>
        </button>
        <button
          onClick={() => setActiveView('market')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'market' ? 'text-[#ff4500]' : 'text-gray-500'}`}
        >
          <TrendingUp size={20} />
          <span className="text-xs">预测</span>
        </button>
        <button
          onClick={() => setActiveView('research')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'research' ? 'text-[#ff4500]' : 'text-gray-500'}`}
        >
          <Sparkles size={20} />
          <span className="text-xs">研究</span>
        </button>
        <button
          onClick={() => setActiveView('profile')}
          className={`flex flex-col items-center gap-1 p-2 ${activeView === 'profile' ? 'text-[#ff4500]' : 'text-gray-500'}`}
        >
          <UserIcon size={20} />
          <span className="text-xs">我的</span>
        </button>
      </nav>
    </div>
  );
}

interface AppUser {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  points: number;
}

// Feed View - Reddit style cards
const FeedView = ({ posts, createPost, currentUser }: { posts: Post[], createPost: (c: string) => void, currentUser: AppUser }) => {
  const [content, setContent] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPost(content);
    setContent('');
    setShowCompose(false);
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Create Post Card */}
      <div className="reddit-card p-3">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            className="w-10 h-10 rounded-full object-cover"
            alt=""
          />
          <input
            type="text"
            placeholder="分享你的想法..."
            className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none cursor-pointer transition-colors"
            onClick={() => setShowCompose(true)}
            readOnly
          />
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCompose(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">创建帖子</h3>
              <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-gray-700">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的灵感... (支持带日期的批量粘贴)"
                className="w-full h-40 border border-gray-200 rounded-lg p-3 outline-none focus:border-[#0079d3] resize-none text-gray-800"
                autoFocus
              />
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-gray-500">提示: 输入带日期(YYYY-MM-DD)的内容可自动切割</p>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="reddit-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts List */}
      {posts.map(post => (
        <div key={post.id} className="reddit-card flex">
          {/* Vote Column */}
          <div className="vote-column flex flex-col items-center py-2 px-2 rounded-l">
            <button className="p-1 upvote text-gray-400 hover:bg-gray-100 rounded">
              <ChevronUp size={20} />
            </button>
            <span className="text-xs font-bold text-gray-800 my-1">
              {Math.floor(Math.random() * 50) + 1}
            </span>
            <button className="p-1 downvote text-gray-400 hover:bg-gray-100 rounded">
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <img src={`https://picsum.photos/seed/${post.userName}/100`} className="w-5 h-5 rounded-full" alt="" />
              <span className="font-medium text-gray-800 hover:underline cursor-pointer">{post.userName}</span>
              <span>·</span>
              <Clock size={12} />
              <span>{post.dateStr}</span>
            </div>
            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-3">
              {post.content}
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <button className="flex items-center gap-1 text-xs hover:bg-gray-100 px-2 py-1 rounded transition-colors">
                <MessageCircle size={16} />
                <span>评论</span>
              </button>
              <button className="flex items-center gap-1 text-xs hover:bg-gray-100 px-2 py-1 rounded transition-colors">
                <Share2 size={16} />
                <span>分享</span>
              </button>
              <button className="flex items-center gap-1 text-xs hover:bg-gray-100 px-2 py-1 rounded transition-colors">
                <Bookmark size={16} />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Market View - Reddit style
const MarketView = ({ events, createEvent, onVote, onSolve, currentUser }: {
  events: PredictionEvent[],
  createEvent: (t: string, d: string, s: string) => void,
  onVote: (id: string, choice: PredictionChoice) => void,
  onSolve: (id: string, res: PredictionChoice) => void,
  currentUser: AppUser
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent(title, desc, date);
    setShowCreate(false);
    setTitle(''); setDesc(''); setDate('');
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">预测市场</h2>
          <p className="text-sm text-gray-500">预测未来，洞察先机</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="reddit-btn flex items-center gap-2"
        >
          <Plus size={18} />
          创建预测
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">创建新预测</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="如: TSLA 2026年股价是否 > 600"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#0079d3]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="详细描述与结算标准..."
                  className="w-full h-24 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#0079d3] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#0079d3]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="reddit-btn-outline"
                >
                  取消
                </button>
                <button type="submit" className="reddit-btn">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      {events.map(event => {
        const myVote = event.votes.find(v => v.userId === currentUser.id);
        const yesCount = event.votes.filter(v => v.choice === 1).length;
        const noCount = event.votes.filter(v => v.choice === 0).length;
        const total = event.votes.length || 1;

        return (
          <div key={event.id} className="reddit-card p-4">
            <div className="flex items-start justify-between mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                event.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {event.status === 'active' ? '进行中' : '已结算'}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} />
                截止: {new Date(event.solveDate).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{event.description}</p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Yes ({Math.round((yesCount/total)*100)}%)</span>
                <span>No ({Math.round((noCount/total)*100)}%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#ff4500] transition-all duration-500"
                  style={{ width: `${(yesCount/total)*100}%` }}
                />
                <div
                  className="bg-[#0079d3] transition-all duration-500"
                  style={{ width: `${(noCount/total)*100}%` }}
                />
              </div>
            </div>

            {/* Voting Buttons */}
            <div className="flex gap-3">
              {event.status === 'active' ? (
                <>
                  <button
                    onClick={() => onVote(event.id, 1)}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                      myVote?.choice === 1
                        ? 'bg-[#ff4500] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => onVote(event.id, 0)}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                      myVote?.choice === 0
                        ? 'bg-[#0079d3] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </>
              ) : (
                <div className="w-full py-3 px-4 bg-gray-100 rounded-lg flex items-center justify-between">
                  <span className="text-gray-600">结果:</span>
                  <span className={`font-bold ${event.finalResult === 1 ? 'text-[#ff4500]' : 'text-[#0079d3]'}`}>
                    {event.finalResult === 1 ? 'YES' : 'NO'}
                  </span>
                  {myVote && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      myVote.choice === event.finalResult
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {myVote.choice === event.finalResult ? '猜中 +1' : '落败'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Creator Tools */}
            {event.creatorId === currentUser.id && event.status === 'active' && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                <p className="text-xs text-gray-500 mr-2">发布者工具:</p>
                <button
                  onClick={() => onSolve(event.id, 1)}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  结算为 Yes
                </button>
                <button
                  onClick={() => onSolve(event.id, 0)}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  结算为 No
                </button>
              </div>
            )}
          </div>
        );
      })}

      {events.length === 0 && (
        <div className="reddit-card p-8 text-center">
          <TrendingUp size={40} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">还没有预测事件</p>
          <p className="text-sm text-gray-500 mt-1">点击上方按钮创建第一个预测</p>
        </div>
      )}
    </div>
  );
};

// Profile View - Reddit style
const ProfileView = ({ user, posts, participatedEvents }: { user: AppUser, posts: Post[], participatedEvents: PredictionEvent[] }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'predictions'>('posts');

  return (
    <div className="max-w-2xl">
      {/* Profile Header Card */}
      <div className="reddit-card overflow-hidden mb-4">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-[#ff4500] to-[#ff6a33]"></div>

        {/* Profile Info */}
        <div className="p-4 pt-0 relative">
          <img
            src={user.avatar}
            className="w-20 h-20 rounded-full border-4 border-white absolute -top-10 object-cover"
            alt=""
          />
          <div className="pt-12">
            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-sm text-gray-500">u/{user.name.toLowerCase().replace(/\s/g, '_')}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">{user.points}</p>
              <p className="text-xs text-gray-500">积分</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">{posts.length}</p>
              <p className="text-xs text-gray-500">帖子</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">{participatedEvents.length}</p>
              <p className="text-xs text-gray-500">预测</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="reddit-card mb-4">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'posts'
                ? 'text-[#ff4500] border-b-2 border-[#ff4500]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            我的帖子
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'predictions'
                ? 'text-[#ff4500] border-b-2 border-[#ff4500]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            参与的预测
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' ? (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="reddit-card p-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Clock size={12} />
                {post.dateStr}
              </p>
              <p className="text-gray-800 text-sm whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="reddit-card p-8 text-center text-gray-500">
              还没有发布过帖子
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {participatedEvents.map(ev => (
            <div key={ev.id} className="reddit-card p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{ev.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  我的投票:
                  <span className={`ml-1 font-semibold ${
                    ev.votes.find(v => v.userId === user.id)?.choice === 1
                      ? 'text-[#ff4500]'
                      : 'text-[#0079d3]'
                  }`}>
                    {ev.votes.find(v => v.userId === user.id)?.choice === 1 ? 'YES' : 'NO'}
                  </span>
                </p>
              </div>
              <div>
                {ev.status === 'active' ? (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">进行中</span>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded ${
                    ev.votes.find(v => v.userId === user.id)?.choice === ev.finalResult
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ev.votes.find(v => v.userId === user.id)?.choice === ev.finalResult ? '猜中 +1' : '已结算'}
                  </span>
                )}
              </div>
            </div>
          ))}
          {participatedEvents.length === 0 && (
            <div className="reddit-card p-8 text-center text-gray-500">
              还没有参与过预测
            </div>
          )}
        </div>
      )}
    </div>
  );
};
