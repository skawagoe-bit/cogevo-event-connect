-- Add email_templates column to events table to store segment-specific templates
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS email_templates JSONB DEFAULT '{}'::jsonb;
