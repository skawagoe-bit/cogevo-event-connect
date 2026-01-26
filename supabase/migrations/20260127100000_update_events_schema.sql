
-- Add configuration presets to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS segments_preset jsonb DEFAULT '["パートナー", "既存顧客", "新規リード", "競合"]'::jsonb,
ADD COLUMN IF NOT EXISTS roles_preset jsonb DEFAULT '["決裁者", "担当者", "導入検討中", "情報収集"]'::jsonb;

-- Ensure attributes_preset has a default if not set (optional, but good for consistency)
ALTER TABLE public.events 
ALTER COLUMN attributes_preset SET DEFAULT '["医師", "看護師", "PT", "OT", "ST", "事務長", "施設長", "その他"]'::jsonb;
