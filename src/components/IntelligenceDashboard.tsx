import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiInsights, useGenerateInsights } from "@/hooks/useAiInsights";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const kindMeta = {
  alert: { label: "Alerta", icon: AlertTriangle },
  insight: { label: "Insight", icon: Brain },
  suggestion: { label: "Sugestão", icon: Lightbulb },
} as const;

const severityStyles: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/5",
  warning: "border-amber-500/30 bg-amber-50 dark:bg-amber-950/10",
  info: "border-border bg-muted/30",
  positive: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/10",
};

const severityBadge: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  info: "bg-muted text-muted-foreground border-border",
  positive: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

const severityIcon: Record<string, typeof Info> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  positive: CheckCircle2,
};

export function IntelligenceDashboard() {
  const { isAdmin } = useAuth();
  const { data: insights = [], isLoading } = useAiInsights();
  const generate = useGenerateInsights();

  const lastUpdate = insights[0]?.created_at;
  const grouped = {
    alert: insights.filter((i) => i.kind === "alert"),
    insight: insights.filter((i) => i.kind === "insight"),
    suggestion: insights.filter((i) => i.kind === "suggestion"),
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge className="mb-1 border-0 bg-primary/10 text-primary">
            <Sparkles className="mr-1 h-3 w-3" /> Inteligência
          </Badge>
          <h2 className="font-display text-xl font-bold">Painel de insights inteligentes</h2>
          <p className="text-sm text-muted-foreground">
            Análise automática cruzando processos, comunicados, SLA e setores —
            fundamentada em comunicação organizacional integrada.
            {lastUpdate && (
              <>
                {" · "}atualizado{" "}
                {formatDistanceToNow(new Date(lastUpdate), { locale: ptBR, addSuffix: true })}
              </>
            )}
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            variant="default"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            <RefreshCw className={cn("h-4 w-4", generate.isPending && "animate-spin")} />
            {generate.isPending ? "Analisando…" : insights.length ? "Recalcular análise" : "Gerar análise"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : insights.length === 0 ? (
        <Card className="border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground shadow-soft">
          <Brain className="mx-auto mb-2 h-6 w-6 text-primary" />
          Nenhuma análise gerada ainda.
          {isAdmin
            ? " Clique em \"Gerar análise\" para que a IA processe os dados atuais."
            : " Aguarde um administrador executar a primeira análise."}
        </Card>
      ) : (
        <div className="space-y-5">
          {(["alert", "insight", "suggestion"] as const).map((kind) => {
            const items = grouped[kind];
            if (items.length === 0) return null;
            const Meta = kindMeta[kind];
            return (
              <div key={kind} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Meta.icon className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {Meta.label}s ({items.length})
                  </h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((item) => {
                    const SevIcon = severityIcon[item.severity] ?? Info;
                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "border p-4 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-warm",
                          severityStyles[item.severity],
                        )}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("gap-1", severityBadge[item.severity])}
                          >
                            <SevIcon className="h-3 w-3" />
                            {item.severity === "critical"
                              ? "Crítico"
                              : item.severity === "warning"
                                ? "Atenção"
                                : item.severity === "positive"
                                  ? "Positivo"
                                  : "Informativo"}
                          </Badge>
                          {item.related_sectors.slice(0, 4).map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="border-border bg-background/60 text-muted-foreground"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                        <p className="font-display text-base font-semibold leading-tight">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        {item.framework_reference && (
                          <p className="mt-3 border-t border-border/40 pt-2 text-[11px] font-medium uppercase tracking-wider text-primary/80">
                            <ArrowUpRight className="mr-1 inline h-3 w-3" />
                            {item.framework_reference}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
