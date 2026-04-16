-- Enum for contribution types
CREATE TYPE public.contribution_type AS ENUM ('automation', 'expert', 'linkedin', 'case_study', 'forum', 'other');

-- Main table
CREATE TABLE public.community_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type public.contribution_type NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  tags TEXT[] DEFAULT '{}',
  tools_related TEXT[] DEFAULT '{}',
  upvotes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions readable by authenticated"
  ON public.community_contributions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own contributions"
  ON public.community_contributions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contributions"
  ON public.community_contributions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contributions"
  ON public.community_contributions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_community_contributions_updated_at
  BEFORE UPDATE ON public.community_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Votes table
CREATE TABLE public.contribution_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contribution_id UUID NOT NULL REFERENCES public.community_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contribution_id, user_id)
);

ALTER TABLE public.contribution_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes readable by authenticated"
  ON public.contribution_votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own votes"
  ON public.contribution_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.contribution_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to maintain upvotes count
CREATE OR REPLACE FUNCTION public.update_contribution_upvotes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_contributions
      SET upvotes = upvotes + 1 WHERE id = NEW.contribution_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_contributions
      SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.contribution_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_contribution_votes_count
  AFTER INSERT OR DELETE ON public.contribution_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_contribution_upvotes();

CREATE INDEX idx_contributions_type ON public.community_contributions(type);
CREATE INDEX idx_contributions_upvotes ON public.community_contributions(upvotes DESC);
CREATE INDEX idx_contribution_votes_user ON public.contribution_votes(user_id);