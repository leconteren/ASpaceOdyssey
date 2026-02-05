-- Supabase Schema for 投研中台 (Investment Research Platform)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'https://picsum.photos/seed/' || new.id || '/200'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Agent Conversations table
create table if not exists public.agent_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  agent_id text not null,
  messages jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, agent_id)
);

-- Enable RLS
alter table public.agent_conversations enable row level security;

-- Conversations policies
create policy "Users can view their own conversations"
  on public.agent_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.agent_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.agent_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.agent_conversations for delete
  using (auth.uid() = user_id);


-- 3. Research Reports table
create table if not exists public.research_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  query text not null,
  agents_used text[] default '{}',
  results jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.research_reports enable row level security;

-- Reports policies
create policy "Users can view their own reports"
  on public.research_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports"
  on public.research_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own reports"
  on public.research_reports for delete
  using (auth.uid() = user_id);


-- 4. Posts table (for Feed)
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  date_str text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;

-- Posts policies - everyone can read, only owner can write
create policy "Anyone can view posts"
  on public.posts for select
  using (true);

create policy "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);


-- 5. Prediction Events table
create table if not exists public.prediction_events (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  solve_date timestamp with time zone not null,
  status text default 'active' check (status in ('active', 'solved')),
  final_result integer check (final_result in (0, 1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.prediction_events enable row level security;

-- Events policies
create policy "Anyone can view events"
  on public.prediction_events for select
  using (true);

create policy "Users can create events"
  on public.prediction_events for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their events"
  on public.prediction_events for update
  using (auth.uid() = creator_id);


-- 6. Votes table
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.prediction_events on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  choice integer not null check (choice in (0, 1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

-- Enable RLS
alter table public.votes enable row level security;

-- Votes policies
create policy "Anyone can view votes"
  on public.votes for select
  using (true);

create policy "Users can insert their own votes"
  on public.votes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own votes"
  on public.votes for update
  using (auth.uid() = user_id);


-- Create indexes for better performance
create index if not exists idx_agent_conversations_user on public.agent_conversations(user_id);
create index if not exists idx_research_reports_user on public.research_reports(user_id);
create index if not exists idx_posts_user on public.posts(user_id);
create index if not exists idx_posts_created on public.posts(created_at desc);
create index if not exists idx_events_status on public.prediction_events(status);
create index if not exists idx_votes_event on public.votes(event_id);
