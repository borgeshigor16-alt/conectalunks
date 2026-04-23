import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OverdueInstance = {
  instance_id: string;
  instance_title: string;
  process_name: string;
  process_code: string;
  sector_name: string;
  sector_acronym: string;
  overdue_steps: number;
  current_step: {
    id: string;
    title: string;
    step_order: number;
    status: string;
    started_at: string | null;
    sla_hours: number | null;
    overdue: boolean;
  } | null;
  started_at: string;
};

export type StepAvgDuration = {
  step_name: string;
  samples: number;
  avg_hours: number | null;
  avg_sla_hours: number | null;
};

export type SlaStatus = {
  instance_id: string;
  instance_title: string;
  instance_status: "open" | "in_progress" | "completed" | "cancelled";
  process_id: string;
  process_name: string;
  process_code: string;
  sector_name: string;
  sector_acronym: string;
  total_steps: number;
  done_steps: number;
  overdue_steps: number;
  is_overdue: boolean;
  current_step: OverdueInstance["current_step"];
  started_at: string;
};

export function useOverdueInstances() {
  return useQuery({
    queryKey: ["overdue-instances"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_overdue_instances");
      if (error) throw error;
      return (data ?? []) as OverdueInstance[];
    },
    refetchInterval: 60_000,
  });
}

export function useSlaStatus() {
  return useQuery({
    queryKey: ["sla-status"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("process_sla_status")
        .select("*")
        .in("instance_status", ["open", "in_progress"]);
      if (error) throw error;
      return (data ?? []) as SlaStatus[];
    },
    refetchInterval: 60_000,
  });
}

export function useStepAvgDuration() {
  return useQuery({
    queryKey: ["step-avg-duration"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("step_avg_duration").select("*");
      if (error) throw error;
      return (data ?? []) as StepAvgDuration[];
    },
  });
}

/** Compute remaining or overdue time for a step. Returns null when no SLA. */
export function getStepSlaInfo(step: {
  status: string;
  started_at: string | null;
  sla_hours: number | null;
  completed_at?: string | null;
}) {
  if (!step.sla_hours) return null;
  if (step.status === "done") return { state: "done" as const, hours: 0 };
  if (!step.started_at) return { state: "not_started" as const, hours: step.sla_hours };
  const deadline = new Date(step.started_at).getTime() + step.sla_hours * 3600 * 1000;
  const diffH = (deadline - Date.now()) / 3600 / 1000;
  if (diffH < 0) return { state: "overdue" as const, hours: Math.abs(diffH) };
  return { state: "running" as const, hours: diffH };
}
