-- 商談メモ（テキスト）用カラムの追加
alter table public.visitors add column memo text;
comment on column public.visitors.memo is '音声認識または手入力された商談メモ';
