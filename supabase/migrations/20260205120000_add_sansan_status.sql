
-- Add sansan_status column to visitors table
ALTER TABLE public.visitors
ADD COLUMN IF NOT EXISTS sansan_status TEXT DEFAULT 'unsent'; -- 'unsent', 'processing', 'completed', 'error'

-- Add error message column for detailed feedback
ALTER TABLE public.visitors
ADD COLUMN IF NOT EXISTS sansan_error TEXT;
