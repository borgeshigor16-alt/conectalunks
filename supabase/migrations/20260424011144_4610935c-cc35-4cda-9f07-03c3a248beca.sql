
-- Tabela de eventos da agenda
CREATE TABLE public.agenda_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ver
CREATE POLICY "Authenticated users can view agenda events"
ON public.agenda_events
FOR SELECT
TO authenticated
USING (true);

-- Apenas admins criam
CREATE POLICY "Admins can create agenda events"
ON public.agenda_events
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

-- Apenas admins editam
CREATE POLICY "Admins can update agenda events"
ON public.agenda_events
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Apenas admins excluem
CREATE POLICY "Admins can delete agenda events"
ON public.agenda_events
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_agenda_events_updated_at
BEFORE UPDATE ON public.agenda_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index ordenação por data
CREATE INDEX idx_agenda_events_event_at ON public.agenda_events (event_at);
