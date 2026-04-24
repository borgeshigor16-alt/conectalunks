import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Gauge, Pencil, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { IndicatorForm, IndicatorRow } from "@/components/IndicatorForm";

interface PhaseEvent {
  id: string;
  title: string;
  event_at: string;
}

const Indicadores = () => {
  const { isAdmin } = useAuth();
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  const [phases, setPhases] = useState<PhaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IndicatorRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: indData, error: indErr }, { data: phData }] = await Promise.all([
      supabase
        .from("indicators")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("agenda_events")
        .select("id, title, event_at")
        .order("event_at", { ascending: true }),
    ]);
    if (indErr) toast.error("Erro ao carregar indicadores");
    setIndicators((indData ?? []) as IndicatorRow[]);
    setPhases((phData ?? []) as PhaseEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const phasesById = useMemo(() => {
    const map = new Map<string, PhaseEvent>();
    phases.forEach((p) => map.set(p.id, p));
    return map;
  }, [phases]);

  const onTrack = indicators.filter((i) => i.positive).length;
  const currentPhase = phases.find((p) => new Date(p.event_at) >= new Date()) ?? phases[0];

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (i: IndicatorRow) => {
    setEditing(i);
    setOpen(true);
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("indicators").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir indicador");
    toast.success("Indicador excluído");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="mb-2 border-0 bg-primary/10 text-primary">
            <Gauge className="mr-1 h-3 w-3" /> Item 5.5 da monografia
          </Badge>
          <h1 className="font-display text-4xl font-bold">Indicadores do plano de comunicação</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Métricas qualitativas e quantitativas monitoradas pela <strong>Entrementes HB</strong>{" "}
            para avaliar a efetividade do plano de comunicação integrada interna na Lunks Feel.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openNew} variant="soft">
            <Plus className="h-4 w-4" /> Novo indicador
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-gradient-warm p-6 text-primary-foreground shadow-warm">
          <Target className="mb-2 h-5 w-5" />
          <p className="text-xs uppercase tracking-wider opacity-90">Indicadores ativos</p>
          <p className="mt-1 font-display text-3xl font-bold">{indicators.length}</p>
          <p className="mt-1 text-xs opacity-90">monitorados continuamente</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-6 shadow-soft">
          <Calendar className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Fase atual</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {currentPhase ? currentPhase.title : "Sem fase cadastrada"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {currentPhase
              ? new Date(currentPhase.event_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Cadastre fases na Agenda"}
          </p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-6 shadow-soft">
          <TrendingUp className="mb-2 h-5 w-5 text-success" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Indicadores no rumo
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-success">
            {onTrack} / {indicators.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">acima do baseline</p>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : indicators.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum indicador cadastrado.{" "}
            {isAdmin && "Use o botão acima para criar o primeiro."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {indicators.map((k) => {
            const phase = k.phase_event_id ? phasesById.get(k.phase_event_id) : null;
            return (
              <Card
                key={k.id}
                className="border-border/60 p-6 shadow-soft transition-smooth hover:shadow-warm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold">{k.name}</h3>
                      <Badge
                        variant="outline"
                        className="border-border bg-muted text-muted-foreground"
                      >
                        {k.period}
                      </Badge>
                      {phase && (
                        <Badge className="border-0 bg-primary/10 text-primary">
                          <Calendar className="mr-1 h-3 w-3" /> {phase.title}
                        </Badge>
                      )}
                    </div>
                    {k.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{k.description}</p>
                    )}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Progresso até a meta
                        </span>
                        <span className="text-xs font-semibold text-primary">{k.progress}%</span>
                      </div>
                      <Progress value={k.progress} className="h-2" />
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 md:w-56 md:items-end md:text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Resultado atual
                      </p>
                      <p className="font-display text-3xl font-bold text-foreground">
                        {k.current_value}
                        <span className="ml-1 text-sm text-muted-foreground">{k.unit}</span>
                      </p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Meta
                      </p>
                      <p className="text-sm font-semibold">{k.target || "—"}</p>
                    </div>
                    {k.delta && (
                      <Badge
                        variant="outline"
                        className={
                          k.positive
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        }
                      >
                        {k.delta}
                      </Badge>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1 pt-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(k)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir indicador?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O indicador "{k.name}" será
                                removido.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(k.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <IndicatorForm
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        phases={phases}
        onSaved={load}
      />
    </div>
  );
};

export default Indicadores;
