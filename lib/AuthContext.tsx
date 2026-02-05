import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  points: number;
  created_at: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const initSession = async () => {
      try {
        // 先检查 localStorage 是否有保存的 session
        const savedSession = localStorage.getItem('research-hub-auth');
        console.log('[Auth] Saved session exists:', !!savedSession);

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[Auth] getSession result:', { hasSession: !!session, error });

        if (error) {
          console.warn('[Auth] Session restore error:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[Auth] Session found, user:', session.user.email);
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (savedSession) {
          // localStorage 有数据但 getSession 失败，尝试刷新
          console.log('[Auth] Attempting session refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.warn('[Auth] Refresh failed:', refreshError);
            // 清除无效的 session
            localStorage.removeItem('research-hub-auth');
            setLoading(false);
            return;
          }

          if (refreshData.session?.user) {
            console.log('[Auth] Session refreshed successfully');
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            await fetchProfile(refreshData.session.user.id);
          } else {
            setLoading(false);
          }
        } else {
          console.log('[Auth] No session found');
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet, create it
        if (error.code === 'PGRST116') {
          const newProfile = {
            id: userId,
            name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
            avatar_url: `https://picsum.photos/seed/${userId}/200`,
            points: 0,
          };
          await supabase.from('profiles').insert(newProfile);
          setProfile(newProfile as UserProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, name: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
