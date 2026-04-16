-- 1. Extend profiles with public-facing optional fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS linktree_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Allow authenticated users to read minimal public profile info of contributors
CREATE POLICY "Public profile fields readable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- 2. AI cache table
CREATE TABLE public.ai_recommendations_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stack_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(user_id, stack_hash)
);

ALTER TABLE public.ai_recommendations_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cache"
  ON public.ai_recommendations_cache FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cache"
  ON public.ai_recommendations_cache FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cache"
  ON public.ai_recommendations_cache FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cache"
  ON public.ai_recommendations_cache FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_ai_cache_user ON public.ai_recommendations_cache(user_id, stack_hash);

-- 3. Contribution attachments
CREATE TABLE public.contribution_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contribution_id UUID NOT NULL REFERENCES public.community_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contribution_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments readable by authenticated"
  ON public.contribution_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own attachments"
  ON public.contribution_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attachments"
  ON public.contribution_attachments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_attachments_contribution ON public.contribution_attachments(contribution_id);

-- 4. Storage bucket for contribution files
INSERT INTO storage.buckets (id, name, public) VALUES ('contribution-files', 'contribution-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Contribution files publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contribution-files');

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contribution-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contribution-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Realtime for contributions feed
ALTER TABLE public.community_contributions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_contributions;