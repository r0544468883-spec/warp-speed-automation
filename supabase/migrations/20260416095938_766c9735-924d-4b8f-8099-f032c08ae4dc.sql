
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');

-- Create audit status enum
CREATE TYPE public.audit_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  industry_type TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  total_saved_time INTEGER NOT NULL DEFAULT 0,
  tool_stack TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Captured events table
CREATE TABLE public.captured_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  fingerprint_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.captured_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON public.captured_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.captured_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_captured_events_user ON public.captured_events(user_id);
CREATE INDEX idx_captured_events_app ON public.captured_events(app_name);
CREATE INDEX idx_captured_events_fingerprint ON public.captured_events(fingerprint_hash);

-- Automation wiki table
CREATE TABLE public.automation_wiki (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  use_case TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'community',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  proof_count INTEGER NOT NULL DEFAULT 0,
  automation_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_wiki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wiki readable by authenticated" ON public.automation_wiki FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert wiki" ON public.automation_wiki FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wiki" ON public.automation_wiki FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_wiki_updated_at BEFORE UPDATE ON public.automation_wiki FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_wiki_tool ON public.automation_wiki(tool_name);
CREATE INDEX idx_wiki_category ON public.automation_wiki(category);
CREATE INDEX idx_wiki_tags ON public.automation_wiki USING GIN(tags);

-- Benchmarks table
CREATE TABLE public.benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  department TEXT,
  description TEXT,
  architecture_json JSONB DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benchmarks readable by authenticated" ON public.benchmarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert benchmarks" ON public.benchmarks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update benchmarks" ON public.benchmarks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_benchmarks_updated_at BEFORE UPDATE ON public.benchmarks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Smart audits table
CREATE TABLE public.smart_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT,
  ai_analysis_json JSONB,
  roi_projection_json JSONB,
  status audit_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.smart_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audits" ON public.smart_audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audits" ON public.smart_audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own audits" ON public.smart_audits FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON public.smart_audits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for smart audit videos
INSERT INTO storage.buckets (id, name, public) VALUES ('smart-audits', 'smart-audits', false);
CREATE POLICY "Users can upload audit videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'smart-audits' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own audit videos" ON storage.objects FOR SELECT USING (bucket_id = 'smart-audits' AND auth.uid()::text = (storage.foldername(name))[1]);
