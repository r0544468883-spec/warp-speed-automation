
ALTER TABLE public.webhook_settings ADD COLUMN default_platform TEXT DEFAULT NULL;

CREATE TABLE public.automation_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  automation_name TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own send logs"
  ON public.automation_send_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own send logs"
  ON public.automation_send_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
