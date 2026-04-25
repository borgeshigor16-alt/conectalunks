
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('alert', 'insight', 'suggestion')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'positive')),
  title text NOT NULL,
  description text NOT NULL,
  related_sectors text[] NOT NULL DEFAULT '{}',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  framework_reference text,
  batch_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_insights_batch ON public.ai_insights(batch_id);
CREATE INDEX idx_ai_insights_created ON public.ai_insights(created_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view insights"
  ON public.ai_insights FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert insights"
  ON public.ai_insights FOR INSERT
  TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete insights"
  ON public.ai_insights FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'));
