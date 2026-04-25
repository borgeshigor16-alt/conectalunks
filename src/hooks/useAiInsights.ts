import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AiInsight = {
  id: string;
  kind: "alert" | "insight" | "suggestion";
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  description: string;
  related_sectors: string[];
  metrics: Record<string, unknown>;
  framework_reference: string | null;
  batch_id: string;
  created_at: string;
};

export function useAiInsights() {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_insights")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AiInsight[];
    },
  });
}

export function useGenerateInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("intelligence-insights", {
        body: {},
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { ok: true; count: number };
    },
    onSuccess: (data) => {
      toast.success(`Análise concluída — ${data.count} insights gerados`);
      qc.invalidateQueries({ queryKey: ["ai-insights"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Não foi possível gerar a análise");
    },
  });
}
