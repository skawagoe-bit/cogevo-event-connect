
-- eventsテーブルに終了日を追加
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS end_date DATE;

-- visitorsテーブルに名刺交換日（登録日）を追加
ALTER TABLE public.visitors
ADD COLUMN IF NOT EXISTS visit_date DATE DEFAULT CURRENT_DATE;

-- Sansan登録時に利用するため、インデックスも検討（今回は不要か）
