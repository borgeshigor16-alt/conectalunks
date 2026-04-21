import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type TableName = "announcements" | "people" | "processes" | "knowledge_articles";
export type SectorRow = Tables<"sectors">;
export type AnnouncementRow = Tables<"announcements"> & { sectors?: Pick<SectorRow, "name" | "acronym"> | null };
export type PersonRow = Tables<"people"> & { sectors?: Pick<SectorRow, "name" | "acronym"> | null };
export type ProcessRow = Tables<"processes"> & { sectors?: Pick<SectorRow, "name" | "acronym"> | null };
export type ArticleRow = Tables<"knowledge_articles"> & { sectors?: Pick<SectorRow, "name" | "acronym"> | null };
export type NotificationRow = Tables<"notifications">;

const ordered = <T,>(items: T[] | null) => items ?? [];

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sectors").select("*").order("name");
      if (error) throw error;
      return ordered(data);
    },
  });
}

export function useAnnouncementsCloud() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*, sectors(name, acronym)").order("pinned", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return ordered(data as AnnouncementRow[] | null);
    },
  });
}

export function usePeopleCloud() {
  return useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      const { data, error } = await supabase.from("people").select("*, sectors(name, acronym)").order("full_name");
      if (error) throw error;
      return ordered(data as PersonRow[] | null);
    },
  });
}

export function useProcessesCloud() {
  return useQuery({
    queryKey: ["processes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("processes").select("*, sectors(name, acronym)").order("code");
      if (error) throw error;
      return ordered(data as ProcessRow[] | null);
    },
  });
}

export function useKnowledgeCloud() {
  return useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_articles").select("*, sectors(name, acronym)").order("updated_at", { ascending: false });
      if (error) throw error;
      return ordered(data as ArticleRow[] | null);
    },
  });
}

export function useNotificationsCloud() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return ordered(data);
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return { ...query, markRead };
}

export function useCrud<T extends TableName>(table: T, queryKey: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const create = useMutation({
    mutationFn: async (payload: TablesInsert<T>) => {
      const { error } = await supabase.from(table).insert({ ...payload, created_by: user?.id } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: TablesUpdate<T> }) => {
      const { error } = await supabase.from(table).update(payload as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  return { create, update, remove };
}
