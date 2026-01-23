-- Add media columns to visitors table
ALTER TABLE public.visitors 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create a storage bucket for visitor uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('visitor-uploads', 'visitor-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'visitor-uploads' );

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'visitor-uploads' 
  AND auth.role() = 'authenticated'
);
