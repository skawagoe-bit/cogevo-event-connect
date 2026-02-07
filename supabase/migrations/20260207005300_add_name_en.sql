
-- eventsテーブルにname_enカラムを追加
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS name_en TEXT;

-- 必要であればインデックスを追加（今回は検索用ではないため不要かもしれませんが）
-- CREATE INDEX IF NOT EXISTS idx_events_name_en ON public.events(name_en);
