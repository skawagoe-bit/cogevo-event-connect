-- Add preset columns for roles and segments to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS roles_preset jsonb,
ADD COLUMN IF NOT EXISTS segments_preset jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.events.roles_preset IS 'イベントで使用する役割タグのプリセット (JSON配列)';
COMMENT ON COLUMN public.events.segments_preset IS 'イベントで使用する区分マスタのプリセット (JSON配列)';
