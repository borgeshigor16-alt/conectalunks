-- View: status de SLA por instância em execução
CREATE OR REPLACE VIEW public.process_sla_status AS
SELECT
  pi.id AS instance_id,
  pi.title AS instance_title,
  pi.status AS instance_status,
  pi.sector_id,
  pi.started_at,
  p.id AS process_id,
  p.name AS process_name,
  p.code AS process_code,
  s.name AS sector_name,
  s.acronym AS sector_acronym,
  COUNT(st.*) AS total_steps,
  COUNT(st.*) FILTER (WHERE st.status = 'done') AS done_steps,
  COUNT(st.*) FILTER (
    WHERE st.status <> 'done'
      AND st.sla_hours IS NOT NULL
      AND st.started_at IS NOT NULL
      AND now() > st.started_at + (st.sla_hours || ' hours')::interval
  ) AS overdue_steps,
  EXISTS (
    SELECT 1 FROM public.process_instance_steps st2
    WHERE st2.instance_id = pi.id
      AND st2.status <> 'done'
      AND st2.sla_hours IS NOT NULL
      AND st2.started_at IS NOT NULL
      AND now() > st2.started_at + (st2.sla_hours || ' hours')::interval
  ) AS is_overdue,
  (
    SELECT jsonb_build_object(
      'id', cur.id,
      'title', cur.title,
      'step_order', cur.step_order,
      'status', cur.status,
      'started_at', cur.started_at,
      'sla_hours', cur.sla_hours,
      'overdue', (cur.sla_hours IS NOT NULL AND cur.started_at IS NOT NULL
                  AND now() > cur.started_at + (cur.sla_hours || ' hours')::interval)
    )
    FROM public.process_instance_steps cur
    WHERE cur.instance_id = pi.id AND cur.status <> 'done'
    ORDER BY cur.step_order
    LIMIT 1
  ) AS current_step
FROM public.process_instances pi
JOIN public.processes p ON p.id = pi.process_id
JOIN public.sectors s ON s.id = pi.sector_id
LEFT JOIN public.process_instance_steps st ON st.instance_id = pi.id
GROUP BY pi.id, p.id, s.id;

-- View: tempo médio por nome de etapa (apenas etapas concluídas com início e fim)
CREATE OR REPLACE VIEW public.step_avg_duration AS
SELECT
  title AS step_name,
  COUNT(*) AS samples,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600.0)::numeric, 2) AS avg_hours,
  ROUND(AVG(sla_hours)::numeric, 2) AS avg_sla_hours
FROM public.process_instance_steps
WHERE status = 'done'
  AND started_at IS NOT NULL
  AND completed_at IS NOT NULL
GROUP BY title
ORDER BY title;

-- Função: lista instâncias atrasadas visíveis (RLS é aplicada via tabelas base)
CREATE OR REPLACE FUNCTION public.get_overdue_instances()
RETURNS TABLE (
  instance_id uuid,
  instance_title text,
  process_name text,
  process_code text,
  sector_name text,
  sector_acronym text,
  overdue_steps bigint,
  current_step jsonb,
  started_at timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    v.instance_id,
    v.instance_title,
    v.process_name,
    v.process_code,
    v.sector_name,
    v.sector_acronym,
    v.overdue_steps,
    v.current_step,
    v.started_at
  FROM public.process_sla_status v
  WHERE v.is_overdue = true
    AND v.instance_status IN ('open', 'in_progress')
    AND EXISTS (SELECT 1 FROM public.process_instances pi WHERE pi.id = v.instance_id)
  ORDER BY v.overdue_steps DESC, v.started_at ASC;
$$;