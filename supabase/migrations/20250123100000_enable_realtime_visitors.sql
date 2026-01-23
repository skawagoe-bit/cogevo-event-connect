-- ============================================
-- Migration: リアルタイム機能の有効化 (Visitors)
-- Purpose: visitors テーブルの更新をリアルタイムで通知する
-- ============================================

-- realtime publication にテーブルを追加
-- 補足: Supabase Dashboard で Replication を有効にする操作と等価です
alter publication supabase_realtime add table public.visitors;

-- ============================================
-- 補足: broadcast_changes トリガーの設定
-- (クライアント側で postgres_changes を使う場合は上記のみで動作しますが、
--  プロンプトの推奨に従い、トリガーベースの broadcast も設定します)
-- ============================================

-- トリガー関数の作成
create or replace function public.broadcast_visitor_changes()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'event:' || coalesce(new.event_id, old.event_id)::text || ':visitors',
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$$;

-- トリガーの作成
drop trigger if exists visitors_realtime_trigger on public.visitors;
create trigger visitors_realtime_trigger
  after insert or update or delete on public.visitors
  for each row execute function public.broadcast_visitor_changes();

-- realtime.messages テーブルへのポリシー (broadcast 受信用)
-- ユーザーは自分がアクセス権を持つイベントの visitor 更新情報のみ受信可能
create policy "users_can_receive_visitor_broadcasts" on realtime.messages
  for select to authenticated
  using (
    topic like 'event:%:visitors' and
    exists (
      select 1 from public.events
      where id = split_part(topic, ':', 2)::uuid
      and user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub')
    )
  );

