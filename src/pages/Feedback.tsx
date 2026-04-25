import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareHeart, Sparkles, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackIndicesPanel } from "@/components/FeedbackIndicesPanel";
import { useMyFeedbacks } from "@/hooks/useFeedback";
import { useSectors } from "@/hooks/usePortalData";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function useCompletedInstances() {
  return useQuery({
    queryKey: ["completed-instances-for-feedback"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("process_instances")
        .select("id, title, status, sector_id, completed_at, sectors(name, acronym)")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useRecentAnnouncements() {
  return useQuery({
    queryKey: ["recent-announcements-for-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, category, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

const sentimentBadge = {
  positive: { label: "Positivo", icon: ThumbsUp, cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  neutral: { label: "Neutro", icon: Minus, cls: "bg-muted text-muted-foreground border-border" },
  negative: { label: "Negativo", icon: ThumbsDown, cls: "bg-destructive/10 text-destructive border-destructive/30" },
} as const;

const Feedback = () => {
  const { data: instances = [], isLoading: li } = useCompletedInstances();
  const { data: announcements = [], isLoading: la } = useRecentAnnouncements();
  const { data: sectors = [] } = useSectors();
  const { data: my = [] } = useMyFeedbacks();
  const [selectedSector, setSelectedSector] = useState<string>("");

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-gradient-warm p-6 text-primary-foreground shadow-warm md:p-8">
        <Badge className="mb-2 border-0 bg-background/20 text-primary-foreground backdrop-blur-md">
          <Sparkles className="mr-1 h-3 w-3" /> Feedback estruturado
        </Badge>
        <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
          Sua voz fortalece a comunicação integrada
        </h1>
        <p className="mt-2 max-w-2xl text-primary-foreground/85">
          Avalie processos, setores e comunicados. A análise é feita automaticamente e alimenta os
          índices estratégicos do dashboard.
        </p>
      </header>

      <FeedbackIndicesPanel />

      <Tabs defaultValue="process" className="space-y-4">
        <TabsList>
          <TabsTrigger value="process">Por processo</TabsTrigger>
          <TabsTrigger value="sector">Por setor (mensal)</TabsTrigger>
          <TabsTrigger value="announcement">Por comunicado</TabsTrigger>
          <TabsTrigger value="my">Meus feedbacks</TabsTrigger>
        </TabsList>

        <TabsContent value="process" className="space-y-3">
          {li ? (
            <Skeleton className="h-32" />
          ) : instances.length === 0 ? (
            <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma execução de processo concluída ainda.
            </Card>
          ) : (
            instances.map((it: any) => (
              <Card key={it.id} className="border-border/60 p-5 shadow-soft">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="mb-1 border-primary/20 bg-primary/5 text-primary">
                      {it.sectors?.acronym ?? "—"}
                    </Badge>
                    <p className="font-display text-base font-semibold">{it.title}</p>
                    {it.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Concluído{" "}
                        {formatDistanceToNow(new Date(it.completed_at), { locale: ptBR, addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <FeedbackForm target="process" processInstanceId={it.id} />
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sector" className="space-y-3">
          <Card className="border-border/60 p-5 shadow-soft">
            <div className="mb-4 max-w-sm">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Setor para avaliar este mês
              </label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger><SelectValue placeholder="Selecione um setor…" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} · {s.acronym}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSector ? (
              <FeedbackForm target="sector" sectorId={selectedSector} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Escolha um setor acima para iniciar a avaliação mensal.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="announcement" className="space-y-3">
          {la ? (
            <Skeleton className="h-32" />
          ) : announcements.length === 0 ? (
            <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum comunicado publicado ainda.
            </Card>
          ) : (
            announcements.map((a: any) => (
              <Card key={a.id} className="border-border/60 p-5 shadow-soft">
                <div className="mb-3">
                  <Badge variant="outline" className="mb-1 border-primary/20 bg-primary/5 text-primary">
                    {a.category}
                  </Badge>
                  <p className="font-display text-base font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}
                  </p>
                </div>
                <FeedbackForm
                  target="announcement"
                  announcementId={a.id}
                  showAlignment={false}
                />
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-3">
          {my.length === 0 ? (
            <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
              <MessageSquareHeart className="mx-auto mb-2 h-6 w-6 text-primary" />
              Você ainda não enviou nenhum feedback.
            </Card>
          ) : (
            my.map((f) => {
              const meta = f.sentiment ? sentimentBadge[f.sentiment] : null;
              const Icon = meta?.icon;
              return (
                <Card key={f.id} className="border-border/60 p-5 shadow-soft">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                      {f.target_kind === "process" ? "Processo" : f.target_kind === "sector" ? "Setor" : "Comunicado"}
                    </Badge>
                    {meta && Icon && (
                      <Badge variant="outline" className={`gap-1 ${meta.cls}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </Badge>
                    )}
                    {f.ai_tags?.map((t) => (
                      <Badge key={t} variant="outline" className="border-border bg-background/60 text-muted-foreground">
                        {t}
                      </Badge>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(f.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <ScoreLine label="Clareza" value={f.clarity_score} />
                    <ScoreLine label="Alinhamento" value={f.alignment_score} />
                    <ScoreLine label="Satisfação" value={f.satisfaction_score} />
                  </div>
                  {f.comment && <p className="mt-3 text-sm">{f.comment}</p>}
                  {f.ai_summary && (
                    <p className="mt-2 border-t border-border/40 pt-2 text-xs italic text-muted-foreground">
                      <Sparkles className="mr-1 inline h-3 w-3" /> {f.ai_summary}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

function ScoreLine({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-bold">{value ?? "—"}{value !== null && "/5"}</span>
    </div>
  );
}

export default Feedback;
