
CREATE TYPE feedback_target AS ENUM ('process', 'sector', 'announcement');
CREATE TYPE feedback_sentiment AS ENUM ('positive', 'neutral', 'negative');

CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind feedback_target NOT NULL,
  -- referência polimórfica (apenas um preenchido)
  process_instance_id uuid,
  sector_id uuid,
  announcement_id uuid,
  reference_period date,            -- usado para feedbacks mensais (ex: 2026-04-01)
  clarity_score smallint CHECK (clarity_score BETWEEN 1 AND 5),
  alignment_score smallint CHECK (alignment_score BETWEEN 1 AND 5),
  satisfaction_score smallint CHECK (satisfaction_score BETWEEN 1 AND 5),
  comment text,
  sentiment feedback_sentiment,
  sentiment_confidence numeric(3,2),
  ai_tags text[] NOT NULL DEFAULT '{}',
  ai_summary text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_target_only CHECK (
    (target_kind = 'process'      AND process_instance_id IS NOT NULL AND sector_id IS NULL AND announcement_id IS NULL) OR
    (target_kind = 'sector'       AND sector_id IS NOT NULL AND process_instance_id IS NULL AND announcement_id IS NULL) OR
    (target_kind = 'announcement' AND announcement_id IS NOT NULL AND sector_id IS NULL AND process_instance_id IS NULL)
  ),
  CONSTRAINT at_least_one_score CHECK (
    clarity_score IS NOT NULL OR alignment_score IS NOT NULL OR satisfaction_score IS NOT NULL
  )
);

-- Unicidade: um feedback por usuário por alvo (e por período no caso de setor)
CREATE UNIQUE INDEX uq_feedback_process ON public.feedbacks(created_by, process_instance_id)
  WHERE target_kind = 'process';
CREATE UNIQUE INDEX uq_feedback_announcement ON public.feedbacks(created_by, announcement_id)
  WHERE target_kind = 'announcement';
CREATE UNIQUE INDEX uq_feedback_sector_period ON public.feedbacks(created_by, sector_id, reference_period)
  WHERE target_kind = 'sector';

CREATE INDEX idx_feedbacks_kind_created ON public.feedbacks(target_kind, created_at DESC);
CREATE INDEX idx_feedbacks_sector ON public.feedbacks(sector_id);
CREATE INDEX idx_feedbacks_process ON public.feedbacks(process_instance_id);
CREATE INDEX idx_feedbacks_announcement ON public.feedbacks(announcement_id);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Visualização: autor vê o seu; admins veem tudo; demais veem apenas dados anonimizados via função (abaixo)
CREATE POLICY "Author or admin can view feedback"
  ON public.feedbacks FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can create own feedback"
  ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Author can update own feedback"
  ON public.feedbacks FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Author or admin can delete feedback"
  ON public.feedbacks FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER trg_feedbacks_updated_at
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função pública para o dashboard: retorna índices agregados (0-100), sem expor autores.
CREATE OR REPLACE FUNCTION public.get_feedback_indices(_days int DEFAULT 90)
RETURNS TABLE (
  total_feedbacks bigint,
  clarity_index numeric,
  alignment_index numeric,
  satisfaction_index numeric,
  positive_pct numeric,
  neutral_pct numeric,
  negative_pct numeric,
  by_kind jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT * FROM public.feedbacks
    WHERE created_at >= now() - (_days || ' days')::interval
  ),
  scores AS (
    SELECT
      COUNT(*)::bigint AS total,
      ROUND(AVG(clarity_score)      FILTER (WHERE clarity_score IS NOT NULL)      * 20, 1) AS clarity_idx,
      ROUND(AVG(alignment_score)    FILTER (WHERE alignment_score IS NOT NULL)    * 20, 1) AS alignment_idx,
      ROUND(AVG(satisfaction_score) FILTER (WHERE satisfaction_score IS NOT NULL) * 20, 1) AS satisfaction_idx,
      ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'positive') / NULLIF(COUNT(*) FILTER (WHERE sentiment IS NOT NULL),0), 1) AS pos_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'neutral')  / NULLIF(COUNT(*) FILTER (WHERE sentiment IS NOT NULL),0), 1) AS neu_pct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'negative') / NULLIF(COUNT(*) FILTER (WHERE sentiment IS NOT NULL),0), 1) AS neg_pct
    FROM base
  ),
  per_kind AS (
    SELECT jsonb_object_agg(target_kind, jsonb_build_object(
      'count', cnt,
      'clarity', clarity_idx,
      'alignment', alignment_idx,
      'satisfaction', satisfaction_idx
    )) AS by_kind
    FROM (
      SELECT
        target_kind,
        COUNT(*) AS cnt,
        ROUND(AVG(clarity_score)      * 20, 1) AS clarity_idx,
        ROUND(AVG(alignment_score)    * 20, 1) AS alignment_idx,
        ROUND(AVG(satisfaction_score) * 20, 1) AS satisfaction_idx
      FROM base GROUP BY target_kind
    ) k
  )
  SELECT
    s.total, s.clarity_idx, s.alignment_idx, s.satisfaction_idx,
    s.pos_pct, s.neu_pct, s.neg_pct,
    COALESCE((SELECT by_kind FROM per_kind), '{}'::jsonb)
  FROM scores s;
$$;
