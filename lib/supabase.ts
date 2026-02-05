import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tfzfguypbaqcywqndcde.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Y17UrzPVeXPs6LXkVExNeg_eMIM0U2a';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
  points: number;
}

export interface DbAgentConversation {
  id: string;
  user_id: string;
  agent_id: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

export interface DbResearchReport {
  id: string;
  user_id: string;
  title: string;
  query: string;
  agents_used: string[];
  results: Record<string, string>;
  created_at: string;
}

// Auth helpers
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Agent conversation persistence
export async function saveConversation(userId: string, agentId: string, messages: any[]) {
  const { data, error } = await supabase
    .from('agent_conversations')
    .upsert({
      user_id: userId,
      agent_id: agentId,
      messages,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,agent_id',
    })
    .select()
    .single();

  return { data, error };
}

export async function loadConversation(userId: string, agentId: string) {
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .single();

  return { data, error };
}

export async function loadAllConversations(userId: string) {
  const { data, error } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('user_id', userId);

  return { data, error };
}

// Research reports
export async function saveResearchReport(
  userId: string,
  title: string,
  query: string,
  agentsUsed: string[],
  results: Record<string, string>
) {
  const { data, error } = await supabase
    .from('research_reports')
    .insert({
      user_id: userId,
      title,
      query,
      agents_used: agentsUsed,
      results,
    })
    .select()
    .single();

  return { data, error };
}

export async function loadResearchReports(userId: string) {
  const { data, error } = await supabase
    .from('research_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}
