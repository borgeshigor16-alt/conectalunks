-- Tabela de indicadores do plano de comunicação
CREATE TABLE public.indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target TEXT NOT NULL DEFAULT '',
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',
  period TEXT NOT NULL DEFAULT 'Mensal',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  delta TEXT NOT NULL DEFAULT '',
  positive BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  phase_event_id UUID REFERENCES public.agenda_events(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view indicators"
  ON public.indicators FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can create indicators"
  ON public.indicators FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update indicators"
  ON public.indicators FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete indicators"
  ON public.indicators FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_indicators_updated_at
  BEFORE UPDATE ON public.indicators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_indicators_phase_event ON public.indicators(phase_event_id);
CREATE INDEX idx_indicators_order ON public.indicators(display_order);