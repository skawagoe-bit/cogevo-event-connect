
-- Add memo column to visitors table
ALTER TABLE public.visitors 
ADD COLUMN IF NOT EXISTS memo TEXT;
