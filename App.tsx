
import React, { useState, useEffect, useCallback } from 'react';
import { User, Post, PredictionEvent, ViewType, PredictionChoice } from './types';
import { INITIAL_USER, parseInitialPosts } from './constants';
import { Plus, MessageSquare, TrendingUp, User as UserIcon, LogOut, Send, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import UseCaseChart from './UseCaseChart';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('monolith_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeView, setActiveView] = useState<ViewType>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<PredictionEvent[]>([]);
  const [inputName, setInputName] = useState('');

  // Initialize data
  useEffect(() => {
    const savedPosts = localStorage.getItem('monolith_posts');
    let loadedPosts: Post[] = savedPosts ? JSON.parse(savedPosts) : [];
    
    // 始终确保初始内容存在
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim();
    if (!name) return;
    
    // 如果名字是 Xiaohan，使用固定 ID 以关联初始内容
    const isXiaohan = name.toLowerCase() === 'xiaohan';
    const newUser: User = {
      id: isXiaohan ? INITIAL_USER.id : `user_${Date.now()}`,
      name: name,
      avatar: `https://picsum.photos/seed/${name}/200`,
      joinedAt: Date.now(),
      points: 0
    };
    setCurrentUser(newUser);
    localStorage.setItem('monolith_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('monolith_user');
  };

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

  // Calculate points for current user
  const userPoints = events.reduce((acc, ev) => {
    if (ev.status === 'solved' && ev.finalResult !== undefined) {
      const userVote = ev.votes.find(v => v.userId === currentUser?.id);
      if (userVote && userVote.choice === ev.finalResult) {
        return acc + 1;
      }
    }
    return acc;
  }, 0);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center cosmic-gradient p-4">
        <div className="glass-card p-8 rounded-3xl w-full max-w-md monolith-glow">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Monolith 饭否
            </h1>
            <p className="text-slate-400 italic">Stay Different, Stay Weird</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">姓名 / Alias</label>
              <input 
                type="text" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-500 outline-none transition-all text-white placeholder-slate-500"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 py-3 rounded-xl font-bold transition-all monolith-glow"
            >
              Enter The Monolith
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 w-full md:relative md:w-24 bg-zinc-900/50 border-t md:border-t-0 md:border-r border-white/10 backdrop-blur-xl flex md:flex-col items-center justify-around md:justify-start md:pt-12 p-4 z-50">
        <button 
          onClick={() => setActiveView('feed')}
          className={`p-3 rounded-2xl transition-all ${activeView === 'feed' ? 'bg-cyan-500/20 text-cyan-400 monolith-glow' : 'text-slate-400 hover:text-white'}`}
        >
          <MessageSquare size={28} />
        </button>
        <button
          onClick={() => setActiveView('market')}
          className={`p-3 rounded-2xl transition-all md:mt-8 ${activeView === 'market' ? 'bg-purple-500/20 text-purple-400 monolith-glow' : 'text-slate-400 hover:text-white'}`}
        >
          <TrendingUp size={28} />
        </button>
        <button
          onClick={() => setActiveView('chart')}
          className={`p-3 rounded-2xl transition-all md:mt-8 ${activeView === 'chart' ? 'bg-emerald-500/20 text-emerald-400 monolith-glow' : 'text-slate-400 hover:text-white'}`}
        >
          <BarChart3 size={28} />
        </button>
        <button
          onClick={() => setActiveView('profile')}
          className={`p-3 rounded-2xl transition-all md:mt-8 ${activeView === 'profile' ? 'bg-amber-500/20 text-amber-400 monolith-glow' : 'text-slate-400 hover:text-white'}`}
        >
          <UserIcon size={28} />
        </button>
        <div className="hidden md:flex flex-1"></div>
        <button 
          onClick={handleLogout}
          className="p-3 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
        >
          <LogOut size={24} />
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 h-screen scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {activeView === 'feed' && (
            <FeedView 
              posts={posts} 
              createPost={createPost} 
              currentUser={currentUser} 
            />
          )}
          {activeView === 'chart' && (
            <UseCaseChart />
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
          {activeView === 'profile' && (
            <ProfileView 
              user={{...currentUser, points: userPoints}}
              posts={posts.filter(p => p.userId === currentUser.id)}
              participatedEvents={events.filter(ev => ev.votes.some(v => v.userId === currentUser.id))}
            />
          )}
        </div>
      </main>
    </div>
  );
}

const FeedView = ({ posts, createPost, currentUser }: { posts: Post[], createPost: (c: string) => void, currentUser: User }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPost(content);
    setContent('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Monolith 饭否 Feed</h2>
        <p className="text-slate-500">周会纪要、发散思考、灵感瞬间</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的灵感... (支持带日期的批量粘贴)"
          className="w-full h-32 bg-transparent text-white placeholder-zinc-600 outline-none resize-none text-lg"
        />
        <div className="flex justify-between items-center border-t border-white/5 pt-4">
          <p className="text-xs text-zinc-500">提示: 输入带日期(YYYY-MM-DD)的内容可自动切割</p>
          <button 
            type="submit" 
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold transition-all monolith-glow"
          >
            <Send size={18} /> 发射
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="glass-card p-6 rounded-3xl border-l-4 border-cyan-500/50 hover:bg-white/5 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src={`https://picsum.photos/seed/${post.userName}/100`} className="w-10 h-10 rounded-full border border-white/20" alt="" />
                <div>
                  <h4 className="font-bold text-slate-200">{post.userName}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> {post.dateStr}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketView = ({ events, createEvent, onVote, onSolve, currentUser }: { 
  events: PredictionEvent[], 
  createEvent: (t: string, d: string, s: string) => void,
  onVote: (id: string, choice: PredictionChoice) => void,
  onSolve: (id: string, res: PredictionChoice) => void,
  currentUser: User 
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
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Prediction Market</h2>
          <p className="text-slate-500">预测未来，洞察先机</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-purple-600 hover:bg-purple-500 p-4 rounded-2xl text-white monolith-glow transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card p-6 rounded-3xl space-y-4 animate-in fade-in zoom-in duration-300">
          <input 
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="赌约标题: 如 Tsla 2026年股价是否 > 600"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
          />
          <textarea 
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="详细描述与结算标准..."
            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none resize-none"
          />
          <div className="flex gap-4">
            <input 
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-zinc-400"
            />
            <button type="submit" className="bg-purple-600 px-8 rounded-xl font-bold">创建</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {events.map(event => {
          const myVote = event.votes.find(v => v.userId === currentUser.id);
          const yesCount = event.votes.filter(v => v.choice === 1).length;
          const noCount = event.votes.filter(v => v.choice === 0).length;
          const total = event.votes.length || 1;

          return (
            <div key={event.id} className="glass-card p-6 rounded-3xl border-t border-white/10">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${event.status === 'active' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {event.status === 'active' ? '进行中' : '已结算'}
                </span>
                <span className="text-zinc-500 text-xs">截止: {new Date(event.solveDate).toLocaleDateString()}</span>
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-white">{event.title}</h3>
              <p className="text-zinc-400 text-sm mb-6">{event.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Yes ({Math.round((yesCount/total)*100)}%)</span>
                  <span>No ({Math.round((noCount/total)*100)}%)</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="bg-cyan-500 transition-all duration-1000" style={{ width: `${(yesCount/total)*100}%` }} />
                  <div className="bg-rose-500 transition-all duration-1000" style={{ width: `${(noCount/total)*100}%` }} />
                </div>
              </div>

              <div className="flex gap-4">
                {event.status === 'active' ? (
                  <>
                    <button 
                      onClick={() => onVote(event.id, 1)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${myVote?.choice === 1 ? 'bg-cyan-500 text-white monolith-glow' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 hover:bg-cyan-500/20'}`}
                    >
                      Yes / 1
                    </button>
                    <button 
                      onClick={() => onVote(event.id, 0)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${myVote?.choice === 0 ? 'bg-rose-500 text-white monolith-glow' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20'}`}
                    >
                      No / 0
                    </button>
                  </>
                ) : (
                  <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-400">结果: </span>
                    <span className={`font-black text-xl ${event.finalResult === 1 ? 'text-cyan-400' : 'text-rose-400'}`}>
                      {event.finalResult === 1 ? 'YES / 1' : 'NO / 0'}
                    </span>
                    {myVote && (
                      <span className={`text-xs px-2 py-1 rounded ${myVote.choice === event.finalResult ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {myVote.choice === event.finalResult ? '猜中 +1' : '落败'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {event.creatorId === currentUser.id && event.status === 'active' && (
                <div className="mt-6 pt-6 border-t border-white/5 flex gap-2 overflow-x-auto">
                  <p className="text-xs text-zinc-500 whitespace-nowrap self-center mr-2">发布者工具:</p>
                  <button onClick={() => onSolve(event.id, 1)} className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300">结算为 Yes</button>
                  <button onClick={() => onSolve(event.id, 0)} className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300">结算为 No</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProfileView = ({ user, posts, participatedEvents }: { user: User, posts: Post[], participatedEvents: PredictionEvent[] }) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="text-center cosmic-gradient p-12 rounded-[3rem] monolith-glow mb-12 border border-white/10">
        <img src={user.avatar} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/20 monolith-glow object-cover" alt="" />
        <h2 className="text-4xl font-black text-white mb-2">{user.name}</h2>
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Points</p>
            <p className="text-3xl font-black text-amber-400">{user.points}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Posts</p>
            <p className="text-3xl font-black text-cyan-400">{posts.length}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Bets</p>
            <p className="text-3xl font-black text-purple-400">{participatedEvents.length}</p>
          </div>
        </div>
      </header>

      <section>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <MessageSquare className="text-cyan-500" /> 我的想法 ({posts.length})
        </h3>
        <div className="grid gap-4">
          {posts.map(post => (
            <div key={post.id} className="glass-card p-6 rounded-2xl border-l-2 border-cyan-500/30">
              <p className="text-xs text-zinc-500 mb-2">{post.dateStr}</p>
              <p className="text-zinc-300 whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
          {posts.length === 0 && <p className="text-zinc-600 italic">还没有发布过想法</p>}
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <TrendingUp className="text-purple-500" /> 参与的赌约
        </h3>
        <div className="grid gap-4">
          {participatedEvents.map(ev => (
            <div key={ev.id} className="glass-card p-4 rounded-2xl flex justify-between items-center border-l-2 border-purple-500/30">
              <div>
                <h4 className="font-bold text-zinc-200">{ev.title}</h4>
                <p className="text-xs text-zinc-500">
                  我的投票: <span className={ev.votes.find(v => v.userId === user.id)?.choice === 1 ? 'text-cyan-400' : 'text-rose-400'}>
                    {ev.votes.find(v => v.userId === user.id)?.choice === 1 ? 'YES' : 'NO'}
                  </span>
                </p>
              </div>
              <div className="text-right">
                {ev.status === 'active' ? (
                  <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded">进行中</span>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded ${ev.votes.find(v => v.userId === user.id)?.choice === ev.finalResult ? 'text-green-400 bg-green-400/10' : 'text-zinc-500 bg-zinc-800'}`}>
                    {ev.votes.find(v => v.userId === user.id)?.choice === ev.finalResult ? '猜中 +1' : '已结算'}
                  </span>
                )}
              </div>
            </div>
          ))}
          {participatedEvents.length === 0 && <p className="text-zinc-600 italic">还没有参与过预测</p>}
        </div>
      </section>
    </div>
  );
};
