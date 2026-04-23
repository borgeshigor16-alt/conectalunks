import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Clock, TimerReset } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOverdueInstances, useStepAvgDuration } from "@/hooks/useSla";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function SlaAlerts() {
  const { data: overdue = [], isLoading } = useOverdueInstances();
  const { data: averages = [] } = useStepAvgDuration();

  const totalOverdue = overdue.length;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Badge className="mb-1 border-0 bg-destructive/10 text-destructive">
            <AlertTriangle className="mr-1 h-3 w-3" /> SLA
          </Badge>
          <h2 className="font-display text-xl font-bold">Processos com SLA estourado</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Verificando processos…"
              : totalOverdue === 0
                ? "Nenhuma execução com etapas atrasadas no momento."
                : `${totalOverdue} execução(ões) com pelo menos uma etapa fora do prazo.`}
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/processos">
            Ver todos <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {totalOverdue > 0 && (
        <div className="grid gap-3">
          {overdue.slice(0, 5).map((o) => {
            const startedHours = o.current_step?.started_at
              ? (Date.now() - new Date(o.current_step.started_at).getTime()) / 3600 / 1000
              : null;
            const slaH = o.current_step?.sla_hours ?? null;
            const overByH = startedHours && slaH ? Math.max(0, startedHours - slaH) : null;
            return (
              <Card
                key={o.instance_id}
                className="flex flex-wrap items-center justify-between gap-3 border-destructive/30 bg-destructive/5 p-4 shadow-soft"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Atrasado
                    </Badge>
                    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                      {o.process_code} · {o.sector_acronym}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {o.overdue_steps} etapa(s) fora do prazo
                    </span>
                  </div>
                  <p className="font-display text-base font-semibold leading-tight">{o.instance_title}</p>
                  {o.current_step && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Etapa atual: <span className="font-semibold">{o.current_step.title}</span>
                      {overByH !== null && (
                        <>
                          {" "}
                          · atrasada há {overByH < 1 ? `${Math.round(overByH * 60)}min` : `${overByH.toFixed(1)}h`}
                        </>
                      )}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="default" asChild>
                  <Link to={`/processos/execucao/${o.instance_id}`}>Abrir</Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {averages.length > 0 && (
        <Card className="border-border/60 p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <TimerReset className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-bold">Tempo médio por etapa</h3>
            <span className="text-xs text-muted-foreground">com base em etapas concluídas</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {averages.map((a) => {
              const avg = a.avg_hours ?? 0;
              const sla = a.avg_sla_hours ?? null;
              const within = sla !== null ? avg <= sla : null;
              return (
                <div
                  key={a.step_name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{a.step_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.samples} execução(ões){sla !== null && ` · SLA médio ${sla}h`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold">{avg}h</p>
                    {within !== null && (
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          within ? "text-success" : "text-destructive"
                        }`}
                      >
                        {within ? "no prazo" : "acima do SLA"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {totalOverdue === 0 && averages.length === 0 && !isLoading && (
        <Card className="flex items-center gap-3 border-border/60 p-4 text-sm text-muted-foreground shadow-soft">
          <Clock className="h-4 w-4" /> Sem dados suficientes ainda. Inicie e conclua etapas para acompanhar SLA.
        </Card>
      )}
    </section>
  );
}
