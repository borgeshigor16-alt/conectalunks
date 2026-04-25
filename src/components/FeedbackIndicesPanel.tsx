import { Heart, MessageSquare, Sparkles, TrendingUp, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedbackIndices } from "@/hooks/useFeedback";

const indexMeta = [
  { key: "clarity_index" as const, label: "Clareza da comunicação", icon: MessageSquare },
  { key: "alignment_index" as const, label: "Alinhamento intersetorial", icon: Users2 },
  { key: "satisfaction_index" as const, label: "Satisfação interna", icon: Heart },
];

function tone(value: number | null) {
  if (value === null) return "text-muted-foreground";
  if (value >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function FeedbackIndicesPanel() {
  const { data, isLoading } = useFeedbackIndices(90);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge className="mb-1 border-0 bg-secondary/15 text-secondary-foreground">
            <Sparkles className="mr-1 h-3 w-3" /> Feedback interno
          </Badge>
          <h2 className="font-display text-xl font-bold">Índices estratégicos de comunicação</h2>
          <p className="text-sm text-muted-foreground">
            Consolidado dos últimos 90 dias —{" "}
            {isLoading ? "carregando…" : `${data?.total_feedbacks ?? 0} feedback(s) coletado(s)`}.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : !data || data.total_feedbacks === 0 ? (
        <Card className="border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground shadow-soft">
          Ainda não há feedbacks suficientes. Convide o time a avaliar processos, comunicados e setores
          para alimentar os índices estratégicos.
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {indexMeta.map(({ key, label, icon: Icon }) => {
              const value = data[key];
              return (
                <Card key={key} className="border-border/60 p-5 shadow-soft">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                  </div>
                  <p className={`font-display text-3xl font-bold ${tone(value)}`}>
                    {value === null ? "—" : `${Math.round(value)}`}
                    <span className="ml-1 text-base font-medium text-muted-foreground">/100</span>
                  </p>
                  <Progress value={value ?? 0} className="mt-3 h-2" />
                </Card>
              );
            })}
          </div>

          <Card className="border-border/60 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-display text-base font-bold">Distribuição de sentimento</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SentimentBar label="Positivo" value={data.positive_pct} cls="bg-emerald-500" />
              <SentimentBar label="Neutro" value={data.neutral_pct} cls="bg-muted-foreground" />
              <SentimentBar label="Negativo" value={data.negative_pct} cls="bg-destructive" />
            </div>
          </Card>
        </>
      )}
    </section>
  );
}

function SentimentBar({ label, value, cls }: { label: string; value: number | null; cls: string }) {
  const v = value ?? 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="font-display text-lg font-bold">{value === null ? "—" : `${Math.round(v)}%`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${cls} transition-all`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
