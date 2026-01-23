-- ============================================
-- Migration: 初期スキーマ作成
-- Purpose: CogEvo Event Connect の基本テーブル構造を作成
-- Tables: users, events, visitors, trial_links, gift_logs
-- ============================================

-- users テーブル (Clerk連携)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  full_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
comment on table public.users is 'アプリケーションのユーザー情報を管理 (Clerk連携)';
alter table public.users enable row level security;

-- events テーブル
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  attributes_preset jsonb,
  user_id uuid references public.users(id) not null,
  created_at timestamptz default now() not null
);
comment on table public.events is 'イベントごとの設定を保持';
alter table public.events enable row level security;

-- visitors テーブル
create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) not null,
  name text,
  company text,
  email text,
  attribute text,
  segment text,
  image_url text,
  scanned_at timestamptz default now() not null,
  is_sent boolean default false,
  sync_status text default 'synced',
  created_at timestamptz default now() not null
);
comment on table public.visitors is '来場者（商談相手）の情報を保持';
alter table public.visitors enable row level security;

-- trial_links テーブル
create table public.trial_links (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.visitors(id) not null,
  token text unique not null,
  expires_at timestamptz not null,
  clicked_at timestamptz,
  created_at timestamptz default now() not null
);
comment on table public.trial_links is '脳体力チェッカーの期間限定体験URL情報';
alter table public.trial_links enable row level security;

-- gift_logs テーブル
create table public.gift_logs (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.visitors(id) not null,
  gift_name text not null,
  granted_at timestamptz default now() not null
);
comment on table public.gift_logs is 'SNS会員証提示に伴うギフト提供記録';
alter table public.gift_logs enable row level security;

-- ============================================
-- RLS Policies
-- ============================================

-- users: 自分のデータのみ参照・更新可能
create policy "users_select_own_data" on public.users
  for select to authenticated
  using (clerk_user_id = auth.jwt() ->> 'sub');

create policy "users_insert_own_data" on public.users
  for insert to authenticated
  with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy "users_update_own_data" on public.users
  for update to authenticated
  using (clerk_user_id = auth.jwt() ->> 'sub')
  with check (clerk_user_id = auth.jwt() ->> 'sub');

-- events: 自分が作成したイベントのみアクセス可能
create policy "events_select_own" on public.events
  for select to authenticated
  using (user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "events_insert_own" on public.events
  for insert to authenticated
  with check (user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "events_update_own" on public.events
  for update to authenticated
  using (user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'));

create policy "events_delete_own" on public.events
  for delete to authenticated
  using (user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'));

-- visitors: 自分が作成したイベントに紐づく訪問者のみアクセス可能
create policy "visitors_select_own" on public.visitors
  for select to authenticated
  using (event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub')));

create policy "visitors_insert_own" on public.visitors
  for insert to authenticated
  with check (event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub')));

create policy "visitors_update_own" on public.visitors
  for update to authenticated
  using (event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub')));

create policy "visitors_delete_own" on public.visitors
  for delete to authenticated
  using (event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub')));

-- trial_links: 関連するvisitorsを通じてアクセス制御
create policy "trial_links_select_own" on public.trial_links
  for select to authenticated
  using (visitor_id in (select id from public.visitors where event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'))));

create policy "trial_links_insert_own" on public.trial_links
  for insert to authenticated
  with check (visitor_id in (select id from public.visitors where event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'))));

-- gift_logs: 関連するvisitorsを通じてアクセス制御
create policy "gift_logs_select_own" on public.gift_logs
  for select to authenticated
  using (visitor_id in (select id from public.visitors where event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'))));

create policy "gift_logs_insert_own" on public.gift_logs
  for insert to authenticated
  with check (visitor_id in (select id from public.visitors where event_id in (select id from public.events where user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'))));

-- ============================================
-- Indexes
-- ============================================
create index idx_users_clerk_user_id on public.users(clerk_user_id);
create index idx_events_user_id on public.events(user_id);
create index idx_visitors_event_id on public.visitors(event_id);
create index idx_trial_links_visitor_id on public.trial_links(visitor_id);
create index idx_trial_links_token on public.trial_links(token);
create index idx_gift_logs_visitor_id on public.gift_logs(visitor_id);
