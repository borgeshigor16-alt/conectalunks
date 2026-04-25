import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FeedbackTarget = "process" | "sector" | "announcement";

export type FeedbackRow = {
  id: string;
  target_kind: FeedbackTarget;
  process_instance_id: string | null;
  sector_id: string | null;
  announcement_id: string | null;
  reference_period: string | null;
  clarity_score: number | null;
  alignment_score: number | null;
  satisfaction_score: number | null;
  comment: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_confidence: number | null;
  ai_tags: string[];
  ai_summary: string | null;
  created_by: string;
  created_at: string;
};

export type FeedbackInput = {
  target_kind: FeedbackTarget;
  process_instance_id?: string | null;
  sector_id?: string | null;
  announcement_id?: string | null;
  reference_period?: string | null;
  clarity_score?: number | null;
  alignment_score?: number | null;
  satisfaction_score?: number | null;
  comment?: string | null;
};

export type FeedbackIndices = {
  total_feedbacks: number;
  clarity_index: number | null;
  alignment_index: number | null;
  satisfaction_index: number | null;
  positive_pct: number | null;
  neutral_pct: number | null;
  negative_pct: number | null;
  by_kind: Record<string, { count: number; clarity: number | null; alignment: number | null; satisfaction: number | null }>;
};

export function useFeedbackIndices(days = 90) {
  return useQuery({
    queryKey: ["feedback-indices", days],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_feedback_indices", { _days: days });
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as FeedbackIndices | null;
    },
  });
}

export function useMyFeedbacks() {
  return useQuery({
    queryKey: ["my-feedbacks"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as FeedbackRow[];
    },
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FeedbackInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      const payload: Record<string, unknown> = {
        target_kind: input.target_kind,
        process_instance_id: input.process_instance_id ?? null,
        sector_id: input.sector_id ?? null,
        announcement_id: input.announcement_id ?? null,
        reference_period: input.reference_period ?? null,
        clarity_score: input.clarity_score ?? null,
        alignment_score: input.alignment_score ?? null,
        satisfaction_score: input.satisfaction_score ?? null,
        comment: input.comment?.trim() || null,
        created_by: userData.user.id,
      };

      const { data, error } = await (supabase as any)
        .from("feedbacks")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;

      // Análise de sentimento (não bloqueia o sucesso se falhar)
      try {
        await supabase.functions.invoke("analyze-feedback", { body: { feedback_id: data.id } });
      } catch (e) {
        console.warn("analyze-feedback falhou", e);
      }

      return data.id as string;
    },
    onSuccess: () => {
      toast.success("Feedback enviado. Obrigado!");
      qc.invalidateQueries({ queryKey: ["my-feedbacks"] });
      qc.invalidateQueries({ queryKey: ["feedback-indices"] });
    },
    onError: (e: any) => {
      const msg = e?.message ?? "Não foi possível enviar o feedback";
      if (msg.includes("duplicate") || msg.includes("uq_feedback")) {
        toast.error("Você já enviou um feedback para este item.");
      } else {
        toast.error(msg);
      }
    },
  });
}
