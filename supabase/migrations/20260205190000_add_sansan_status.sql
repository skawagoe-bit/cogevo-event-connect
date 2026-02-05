
-- Sansan連携状態を管理するカラムを追加
ALTER TABLE public.visitors
ADD COLUMN IF NOT EXISTS sansan_registered_at TIMESTAMPTZ;
