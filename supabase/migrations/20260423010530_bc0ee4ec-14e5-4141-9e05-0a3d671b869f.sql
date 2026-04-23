-- 1. Expandir process_steps (template) com responsável e SLA
ALTER TABLE public.process_steps
  ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sla_hours integer;

-- 2. Enum de status de etapa em execução
DO $$ BEGIN
  CREATE TYPE public.step_status AS ENUM ('pending', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.instance_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Checklist template do processo
CREATE TABLE IF NOT EXISTS public.process_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  item_order integer NOT NULL DEFAULT 1,
  description text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_process_checklists_process ON public.process_checklists(process_id);

-- 4. Instâncias de execução de processos
CREATE TABLE IF NOT EXISTS public.process_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  sector_id uuid NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
  title text NOT NULL,
  status public.instance_status NOT NULL DEFAULT 'open',
  started_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_process_instances_process ON public.process_instances(process_id);
CREATE INDEX IF NOT EXISTS idx_process_instances_sector ON public.process_instances(sector_id);

-- 5. Etapas de execução
CREATE TABLE IF NOT EXISTS public.process_instance_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.process_instances(id) ON DELETE CASCADE,
  step_template_id uuid REFERENCES public.process_steps(id) ON DELETE SET NULL,
  step_order integer NOT NULL,
  title text NOT NULL,
  description text,
  status public.step_status NOT NULL DEFAULT 'pending',
  responsible_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  responsible_user_id uuid,
  sla_hours integer,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, step_order)
);
CREATE INDEX IF NOT EXISTS idx_instance_steps_instance ON public.process_instance_steps(instance_id);

-- 6. Checklist da execução
CREATE TABLE IF NOT EXISTS public.process_instance_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.process_instances(id) ON DELETE CASCADE,
  checklist_template_id uuid REFERENCES public.process_checklists(id) ON DELETE SET NULL,
  item_order integer NOT NULL,
  description text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  completed boolean NOT NULL DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instance_checklist_instance ON public.process_instance_checklist(instance_id);

-- 7. Histórico de logs
CREATE TABLE IF NOT EXISTS public.process_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.process_instances(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.process_instance_steps(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_process_logs_instance ON public.process_logs(instance_id);

-- 8. Trigger updated_at
DROP TRIGGER IF EXISTS trg_checklists_updated ON public.process_checklists;
CREATE TRIGGER trg_checklists_updated BEFORE UPDATE ON public.process_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_instances_updated ON public.process_instances;
CREATE TRIGGER trg_instances_updated BEFORE UPDATE ON public.process_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_instance_steps_updated ON public.process_instance_steps;
CREATE TRIGGER trg_instance_steps_updated BEFORE UPDATE ON public.process_instance_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Função: impede avanço se etapa anterior não estiver concluída
CREATE OR REPLACE FUNCTION public.enforce_step_sequence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_pending integer;
BEGIN
  IF NEW.status IN ('in_progress', 'done') THEN
    SELECT COUNT(*) INTO prev_pending
    FROM public.process_instance_steps
    WHERE instance_id = NEW.instance_id
      AND step_order < NEW.step_order
      AND status <> 'done';

    IF prev_pending > 0 THEN
      RAISE EXCEPTION 'Não é possível avançar: existe(m) % etapa(s) anterior(es) não concluída(s).', prev_pending;
    END IF;
  END IF;

  IF NEW.status = 'in_progress' AND NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  IF NEW.status = 'done' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_step_sequence ON public.process_instance_steps;
CREATE TRIGGER trg_enforce_step_sequence
  BEFORE INSERT OR UPDATE OF status ON public.process_instance_steps
  FOR EACH ROW EXECUTE FUNCTION public.enforce_step_sequence();

-- 10. Função: log automático de mudanças de status
CREATE OR REPLACE FUNCTION public.log_step_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.process_logs (instance_id, step_id, action, details, performed_by)
    VALUES (NEW.instance_id, NEW.id, 'step_created',
      jsonb_build_object('step_order', NEW.step_order, 'title', NEW.title, 'status', NEW.status),
      auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.process_logs (instance_id, step_id, action, details, performed_by)
    VALUES (NEW.instance_id, NEW.id, 'step_status_changed',
      jsonb_build_object('from', OLD.status, 'to', NEW.status, 'step_order', NEW.step_order, 'title', NEW.title),
      auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_step_status ON public.process_instance_steps;
CREATE TRIGGER trg_log_step_status
  AFTER INSERT OR UPDATE OF status ON public.process_instance_steps
  FOR EACH ROW EXECUTE FUNCTION public.log_step_status_change();

-- 11. Função: log de mudanças na instância
CREATE OR REPLACE FUNCTION public.log_instance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.process_logs (instance_id, action, details, performed_by)
    VALUES (NEW.id, 'instance_created',
      jsonb_build_object('title', NEW.title, 'status', NEW.status),
      auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.process_logs (instance_id, action, details, performed_by)
    VALUES (NEW.id, 'instance_status_changed',
      jsonb_build_object('from', OLD.status, 'to', NEW.status),
      auth.uid());
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_instance ON public.process_instances;
CREATE TRIGGER trg_log_instance
  AFTER INSERT OR UPDATE OF status ON public.process_instances
  FOR EACH ROW EXECUTE FUNCTION public.log_instance_change();

-- 12. Função: log de checklist
CREATE OR REPLACE FUNCTION public.log_checklist_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.completed IS DISTINCT FROM NEW.completed THEN
    INSERT INTO public.process_logs (instance_id, action, details, performed_by)
    VALUES (NEW.instance_id,
      CASE WHEN NEW.completed THEN 'checklist_item_completed' ELSE 'checklist_item_uncompleted' END,
      jsonb_build_object('description', NEW.description, 'item_order', NEW.item_order),
      auth.uid());
    IF NEW.completed AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
      NEW.completed_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_checklist ON public.process_instance_checklist;
CREATE TRIGGER trg_log_checklist
  BEFORE UPDATE ON public.process_instance_checklist
  FOR EACH ROW EXECUTE FUNCTION public.log_checklist_change();

-- 13. Função auxiliar: pode gerenciar instância (via setor da instância)
CREATE OR REPLACE FUNCTION public.can_manage_instance(_instance_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.process_instances pi
    WHERE pi.id = _instance_id
      AND public.can_manage_sector(pi.sector_id)
  );
$$;

-- 14. RLS
ALTER TABLE public.process_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_instance_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_instance_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_logs ENABLE ROW LEVEL SECURITY;

-- process_checklists: visíveis a autenticados, gerenciáveis por editores do setor do processo
CREATE POLICY "View process checklists" ON public.process_checklists
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id));

CREATE POLICY "Manage process checklists" ON public.process_checklists
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.can_manage_sector(p.sector_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_id AND public.can_manage_sector(p.sector_id)));

-- process_instances
CREATE POLICY "View instances of own sector or admin" ON public.process_instances
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR sector_id = public.get_user_sector(auth.uid())
    OR started_by = auth.uid()
  );

CREATE POLICY "Editors create instances" ON public.process_instances
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_sector(sector_id) AND started_by = auth.uid());

CREATE POLICY "Editors update instances" ON public.process_instances
  FOR UPDATE TO authenticated
  USING (public.can_manage_sector(sector_id))
  WITH CHECK (public.can_manage_sector(sector_id));

CREATE POLICY "Admins delete instances" ON public.process_instances
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- process_instance_steps
CREATE POLICY "View instance steps" ON public.process_instance_steps
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.process_instances pi
    WHERE pi.id = instance_id AND (
      public.has_role(auth.uid(), 'admin')
      OR pi.sector_id = public.get_user_sector(auth.uid())
      OR pi.started_by = auth.uid()
    )
  ));

CREATE POLICY "Manage instance steps" ON public.process_instance_steps
  FOR ALL TO authenticated
  USING (public.can_manage_instance(instance_id))
  WITH CHECK (public.can_manage_instance(instance_id));

-- process_instance_checklist
CREATE POLICY "View instance checklist" ON public.process_instance_checklist
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.process_instances pi
    WHERE pi.id = instance_id AND (
      public.has_role(auth.uid(), 'admin')
      OR pi.sector_id = public.get_user_sector(auth.uid())
      OR pi.started_by = auth.uid()
    )
  ));

CREATE POLICY "Manage instance checklist" ON public.process_instance_checklist
  FOR ALL TO authenticated
  USING (public.can_manage_instance(instance_id))
  WITH CHECK (public.can_manage_instance(instance_id));

-- process_logs (somente leitura via trigger; sem inserts manuais por usuários)
CREATE POLICY "View process logs" ON public.process_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.process_instances pi
    WHERE pi.id = instance_id AND (
      public.has_role(auth.uid(), 'admin')
      OR pi.sector_id = public.get_user_sector(auth.uid())
      OR pi.started_by = auth.uid()
    )
  ));

CREATE POLICY "Editors can add manual logs" ON public.process_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_instance(instance_id) AND performed_by = auth.uid());