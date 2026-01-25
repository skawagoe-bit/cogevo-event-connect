-- イベント情報のRLSポリシーを変更（全認証ユーザーが参照可能に）
drop policy if exists "events_select_own" on public.events;

create policy "events_select_authenticated" on public.events
  for select to authenticated
  using (true);
