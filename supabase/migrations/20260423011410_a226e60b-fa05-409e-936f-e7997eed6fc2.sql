-- 1. Coluna para vincular instância ao comunicado de origem
ALTER TABLE public.process_instances
  ADD COLUMN IF NOT EXISTS source_announcement_id uuid REFERENCES public.announcements(id) ON DELETE SET NULL;

-- 2. Função que cria o processo + instância + etapas + checklist
CREATE OR REPLACE FUNCTION public.handle_product_launch_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_marketing_id uuid;
  v_comercial_id uuid;
  v_suporte_id uuid;
  v_operacoes_id uuid;
  v_diretoria_id uuid;
  v_process_id uuid;
  v_instance_id uuid;
  v_marketing_step_id uuid;
  v_code text;
BEGIN
  IF NEW.category IS DISTINCT FROM 'Lançamento de Produto' THEN
    RETURN NEW;
  END IF;

  -- Resolve setores por acrônimo (fallback por nome aproximado)
  SELECT id INTO v_marketing_id FROM public.sectors WHERE acronym = 'MC' LIMIT 1;
  SELECT id INTO v_comercial_id FROM public.sectors WHERE acronym = 'CE' LIMIT 1;
  SELECT id INTO v_suporte_id   FROM public.sectors WHERE acronym = 'SO' LIMIT 1;
  SELECT id INTO v_operacoes_id FROM public.sectors WHERE acronym = 'BX' LIMIT 1;
  SELECT id INTO v_diretoria_id FROM public.sectors WHERE acronym = 'DE' LIMIT 1;

  IF v_marketing_id IS NULL THEN
    RAISE NOTICE 'Setor de Marketing não encontrado, automação ignorada.';
    RETURN NEW;
  END IF;

  v_code := 'LP-' || to_char(now(), 'YYYYMMDD-HH24MISS');

  -- Cria o processo (template) vinculado ao Marketing
  INSERT INTO public.processes (sector_id, code, name, description, sla, status, created_by)
  VALUES (
    v_marketing_id,
    v_code,
    'Lançamento de Produto: ' || NEW.title,
    COALESCE(NEW.excerpt, 'Processo automático gerado a partir de comunicado de lançamento.'),
    '30 dias',
    'active',
    NEW.created_by
  )
  RETURNING id INTO v_process_id;

  -- Cria etapas template (referência)
  INSERT INTO public.process_steps (process_id, step_order, title, description, owner_sector_id) VALUES
    (v_process_id, 1, 'Marketing', 'Estratégia, materiais e divulgação do lançamento', v_marketing_id),
    (v_process_id, 2, 'Comercial', 'Capacitação do time de vendas e definição de preços', v_comercial_id),
    (v_process_id, 3, 'Suporte', 'Treinamento da equipe de suporte e base de conhecimento', v_suporte_id),
    (v_process_id, 4, 'Operações', 'Logística, estoque e operação de backoffice', v_operacoes_id),
    (v_process_id, 5, 'Diretoria', 'Aprovação final e acompanhamento estratégico', v_diretoria_id);

  -- Checklist template
  INSERT INTO public.process_checklists (process_id, item_order, description, required) VALUES
    (v_process_id, 1, 'Briefing do produto aprovado', true),
    (v_process_id, 2, 'Materiais de marketing produzidos', true),
    (v_process_id, 3, 'Treinamento das equipes realizado', true),
    (v_process_id, 4, 'FAQ e base de conhecimento publicada', true),
    (v_process_id, 5, 'Comunicado oficial de lançamento divulgado', true);

  -- Cria a instância (execução real) já vinculada ao comunicado
  INSERT INTO public.process_instances (process_id, sector_id, title, status, started_by, source_announcement_id, notes)
  VALUES (
    v_process_id,
    v_marketing_id,
    'Lançamento: ' || NEW.title,
    'in_progress',
    NEW.created_by,
    NEW.id,
    'Execução criada automaticamente a partir do comunicado de lançamento.'
  )
  RETURNING id INTO v_instance_id;

  -- Cria etapas da execução com responsáveis por setor
  INSERT INTO public.process_instance_steps (instance_id, step_order, title, description, status, sla_hours)
  VALUES
    (v_instance_id, 1, 'Marketing',  'Estratégia, materiais e divulgação do lançamento',           'pending', 72),
    (v_instance_id, 2, 'Comercial',  'Capacitação do time de vendas e definição de preços',       'pending', 72),
    (v_instance_id, 3, 'Suporte',    'Treinamento da equipe de suporte e base de conhecimento',   'pending', 72),
    (v_instance_id, 4, 'Operações',  'Logística, estoque e operação de backoffice',                'pending', 72),
    (v_instance_id, 5, 'Diretoria',  'Aprovação final e acompanhamento estratégico',               'pending', 48);

  -- Atualiza responsáveis por setor (via primeira pessoa ativa do setor, se houver)
  UPDATE public.process_instance_steps s
  SET responsible_person_id = (
    SELECT p.id FROM public.people p
    WHERE p.sector_id = sec.id AND p.active = true
    ORDER BY p.created_at LIMIT 1
  )
  FROM (VALUES
    (1, v_marketing_id),
    (2, v_comercial_id),
    (3, v_suporte_id),
    (4, v_operacoes_id),
    (5, v_diretoria_id)
  ) AS sec(step_order, id)
  WHERE s.instance_id = v_instance_id AND s.step_order = sec.step_order;

  -- Inicia automaticamente a etapa de Marketing
  UPDATE public.process_instance_steps
  SET status = 'in_progress'
  WHERE instance_id = v_instance_id AND step_order = 1
  RETURNING id INTO v_marketing_step_id;

  -- Copia checklist template para a execução
  INSERT INTO public.process_instance_checklist (instance_id, checklist_template_id, item_order, description, required)
  SELECT v_instance_id, c.id, c.item_order, c.description, c.required
  FROM public.process_checklists c
  WHERE c.process_id = v_process_id;

  -- Log de origem
  INSERT INTO public.process_logs (instance_id, action, details, performed_by)
  VALUES (
    v_instance_id,
    'auto_created_from_announcement',
    jsonb_build_object('announcement_id', NEW.id, 'announcement_title', NEW.title),
    NEW.created_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcement_product_launch ON public.announcements;
CREATE TRIGGER trg_announcement_product_launch
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_launch_announcement();