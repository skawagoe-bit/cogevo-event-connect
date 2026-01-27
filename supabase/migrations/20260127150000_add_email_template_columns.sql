-- Add email_subject and email_body columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_body TEXT;
