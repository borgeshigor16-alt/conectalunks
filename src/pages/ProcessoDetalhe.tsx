import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Lock,
  Play,
  Workflow,
  ListChecks,
  History,
  AlertTriangle,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type StepStatus = "pending" | "in_progress" | "done";
type InstanceStatus = "open" | "in_progress" | "completed" | "cancelled";

const stepStatusLabel: Record<StepStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
};

const stepStatusStyle: Record<StepStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  done: "bg-success/10 text-success border-success/20",
};

const instanceStatusLabel: Record<InstanceStatus, string> = {
  open: "Aberto",
  in_progress: "Em execução",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const instanceStatusStyle: Record<InstanceStatus, string> = {
  open: "bg-secondary/30 text-secondary-foreground border-secondary/40",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const ProcessoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const { user, canManageSector } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const instanceQuery = useQuery({
    queryKey: ["instance", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("process_instances")
        .select("*, processes(name, code, sla, status, sector_id, sectors(name, acronym))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const stepsQuery = useQuery({
    queryKey: ["instance-steps", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("process_instance_steps")
        .select("*, people(full_name, position)")
        .eq("instance_id", id)
        .order("step_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const checklistQuery = useQuery({
    queryKey: ["instance-checklist", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("process_instance_checklist")
        .select("*")
        .eq("instance_id", id)
        .order("item_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["instance-logs", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("process_logs")
        .select("*")
        .eq("instance_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const instance = instanceQuery.data;
  const steps = stepsQuery.data ?? [];
  const checklist = checklistQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  const requiredPending = useMemo(
    () => checklist.filter((c: any) => c.required && !c.completed).length,
    [checklist],
  );
  const checklistComplete = requiredPending === 0;
  const canManage = canManageSector(instance?.sector_id);

  const updateStep = useMutation({
    mutationFn: async ({ stepId, status }: { stepId: string; status: StepStatus }) => {
      const { error } = await (supabase as any)
        .from("process_instance_steps")
        .update({ status })
        .eq("id", stepId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instance-steps", id] });
      qc.invalidateQueries({ queryKey: ["instance-logs", id] });
      qc.invalidateQueries({ queryKey: ["instance", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar etapa"),
  });

  const toggleChecklist = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      const { error } = await (supabase as any)
        .from("process_instance_checklist")
        .update({ completed })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instance-checklist", id] });
      qc.invalidateQueries({ queryKey: ["instance-logs", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar checklist"),
  });

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await (supabase as any).from("process_logs").insert({
        instance_id: id,
        action: "comment",
        details: { message: text },
        performed_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["instance-logs", id] });
      toast.success("Comentário adicionado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao comentar"),
  });

  const updateInstanceStatus = useMutation({
    mutationFn: async (status: InstanceStatus) => {
      const { error } = await (supabase as any)
        .from("process_instances")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instance", id] });
      qc.invalidateQueries({ queryKey: ["instance-logs", id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar status"),
  });

  const handleStartStep = (step: any) => {
    if (!checklistComplete) {
      toast.error("Conclua todos os itens obrigatórios do checklist antes de iniciar.");
      return;
    }
    updateStep.mutate({ stepId: step.id, status: "in_progress" });
  };

  const handleCompleteStep = (step: any) => {
    updateStep.mutate({ stepId: step.id, status: "done" });
  };

  if (instanceQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="space-y-4">
        <Link to="/processos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 font-display text-lg">Execução não encontrada</p>
        </Card>
      </div>
    );
  }

  const allDone = steps.length > 0 && steps.every((s: any) => s.status === "done");

  return (
    <div className="space-y-6">
      <Link to="/processos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar para processos
      </Link>

      {/* HEADER */}
      <Card className="border-border/60 bg-gradient-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 border-0 bg-primary/10 text-primary">
              <Workflow className="mr-1 h-3 w-3" /> {instance.processes?.code} · {instance.processes?.sectors?.acronym}
            </Badge>
            <h1 className="font-display text-3xl font-bold leading-tight">{instance.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{instance.processes?.name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={instanceStatusStyle[instance.status as InstanceStatus]}>
              {instanceStatusLabel[instance.status as InstanceStatus]}
            </Badge>
            {instance.processes?.sla && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> SLA: {instance.processes.sla}
              </span>
            )}
          </div>
        </div>
        {canManage && instance.status !== "completed" && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {instance.status === "open" && (
              <Button size="sm" variant="hero" onClick={() => updateInstanceStatus.mutate("in_progress")}>
                <Play className="h-4 w-4" /> Iniciar execução
              </Button>
            )}
            {allDone && (
              <Button size="sm" variant="default" onClick={() => updateInstanceStatus.mutate("completed")}>
                <CheckCircle2 className="h-4 w-4" /> Marcar como concluído
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateInstanceStatus.mutate("cancelled")}>
              Cancelar execução
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* TIMELINE */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Linha do tempo</h2>
          {!checklistComplete && (
            <Card className="flex items-center gap-3 border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Conclua o checklist obrigatório para liberar o avanço das etapas.</span>
            </Card>
          )}
          <div className="relative space-y-3">
            {steps.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma etapa cadastrada nesta execução.</Card>
            )}
            {steps.map((step: any, idx: number) => {
              const prev = steps[idx - 1];
              const blockedByPrev = prev && prev.status !== "done";
              const blocked = blockedByPrev || !checklistComplete;
              const status = step.status as StepStatus;
              return (
                <Card key={step.id} className="border-border/60 p-5 shadow-soft">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                          status === "done"
                            ? "border-success bg-success/10 text-success"
                            : status === "in_progress"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </div>
                      {idx < steps.length - 1 && <div className="mt-2 h-12 w-px bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-mono text-muted-foreground">Etapa {step.step_order}</p>
                          <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                        </div>
                        <Badge variant="outline" className={stepStatusStyle[status]}>
                          {stepStatusLabel[status]}
                        </Badge>
                      </div>
                      {step.description && <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {step.people?.full_name ?? "Sem responsável"}
                        </span>
                        {step.sla_hours && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> SLA: {step.sla_hours}h
                          </span>
                        )}
                        {step.completed_at && (
                          <span>
                            Concluída {formatDistanceToNow(new Date(step.completed_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        )}
                      </div>
                      {canManage && status !== "done" && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {status === "pending" && (
                            <Button
                              size="sm"
                              variant="hero"
                              disabled={blocked || updateStep.isPending}
                              onClick={() => handleStartStep(step)}
                            >
                              <Play className="h-4 w-4" /> Iniciar
                            </Button>
                          )}
                          {status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={updateStep.isPending}
                              onClick={() => handleCompleteStep(step)}
                            >
                              <CheckCircle2 className="h-4 w-4" /> Concluir
                            </Button>
                          )}
                          {blockedByPrev && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" /> Aguarda etapa anterior
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR: Checklist + Logs */}
        <div className="space-y-6">
          <Card className="border-border/60 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Checklist obrigatório</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {checklist.length === 0
                ? "Sem itens cadastrados."
                : checklistComplete
                  ? "Todos os itens obrigatórios concluídos."
                  : `${requiredPending} item(ns) obrigatório(s) pendente(s).`}
            </p>
            <div className="mt-3 space-y-2">
              {checklist.map((item: any) => (
                <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/40">
                  <Checkbox
                    checked={item.completed}
                    disabled={!canManage || toggleChecklist.isPending}
                    onCheckedChange={(v) => toggleChecklist.mutate({ itemId: item.id, completed: Boolean(v) })}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.description}
                    </p>
                    {item.required && !item.completed && (
                      <span className="text-[10px] uppercase tracking-wider text-warning">Obrigatório</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card className="border-border/60 p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Comentários e histórico</h2>
            </div>
            {canManage && (
              <div className="mb-4 space-y-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  rows={3}
                />
                <Button
                  size="sm"
                  variant="hero"
                  className="w-full"
                  disabled={!comment.trim() || addComment.isPending}
                  onClick={() => addComment.mutate(comment.trim())}
                >
                  Comentar
                </Button>
              </div>
            )}
            <div className="space-y-3 max-h-96 overflow-auto">
              {logs.length === 0 && <p className="text-xs text-muted-foreground">Sem registros ainda.</p>}
              {logs.map((log: any) => (
                <div key={log.id} className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{describeAction(log)}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {log.details?.message && <p className="mt-1 text-sm text-foreground">{log.details.message}</p>}
                  {log.action !== "comment" && log.details && (
                    <p className="mt-1 text-muted-foreground">{describeDetails(log)}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function describeAction(log: any): string {
  switch (log.action) {
    case "instance_created":
      return "Execução criada";
    case "instance_status_changed":
      return "Status da execução alterado";
    case "step_created":
      return "Etapa criada";
    case "step_status_changed":
      return "Status da etapa alterado";
    case "checklist_item_completed":
      return "Item do checklist concluído";
    case "checklist_item_uncompleted":
      return "Item do checklist reaberto";
    case "comment":
      return "Comentário";
    default:
      return log.action;
  }
}

function describeDetails(log: any): string {
  const d = log.details ?? {};
  if (log.action === "step_status_changed") return `${d.title ?? ""} · ${d.from} → ${d.to}`;
  if (log.action === "instance_status_changed") return `${d.from} → ${d.to}`;
  if (log.action === "step_created") return `Etapa ${d.step_order}: ${d.title}`;
  if (log.action?.startsWith("checklist_item")) return d.description ?? "";
  return "";
}

export default ProcessoDetalhe;
