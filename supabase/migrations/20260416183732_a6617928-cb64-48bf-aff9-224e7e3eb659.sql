CREATE TABLE public.saved_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT,
  source TEXT,
  platform TEXT,
  tools_matched TEXT[] DEFAULT '{}'::text[],
  automation_json JSONB,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved articles"
ON public.saved_articles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved articles"
ON public.saved_articles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved articles"
ON public.saved_articles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_saved_articles_user ON public.saved_articles(user_id, saved_at DESC);