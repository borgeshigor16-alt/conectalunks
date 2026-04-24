import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface IndicatorRow {
  id: string;
  name: string;
  description: string;
  target: string;
  current_value: number;
  unit: string;
  period: string;
  progress: number;
  delta: string;
  positive: boolean;
  display_order: number;
  phase_event_id: string | null;
}

interface PhaseOption {
  id: string;
  title: string;
  event_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: IndicatorRow | null;
  phases: PhaseOption[];
  onSaved: () => void;
}

const PERIODS = ["Mensal", "Trimestral", "Semestral", "Anual"];
const UNITS = ["%", "pts", "h", "dias"];

export function IndicatorForm({ open, onOpenChange, editing, phases, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    description: "",
    target: "",
    current_value: "0",
    unit: "%",
    period: "Mensal",
    progress: "0",
    delta: "",
    positive: true,
    display_order: "0",
    phase_event_id: "none",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description,
        target: editing.target,
        current_value: String(editing.current_value),
        unit: editing.unit,
        period: editing.period,
        progress: String(editing.progress),
        delta: editing.delta,
        positive: editing.positive,
        display_order: String(editing.display_order),
        phase_event_id: editing.phase_event_id ?? "none",
      });
    } else {
      setForm({
        name: "",
        description: "",
        target: "",
        current_value: "0",
        unit: "%",
        period: "Mensal",
        progress: "0",
        delta: "",
        positive: true,
        display_order: "0",
        phase_event_id: "none",
      });
    }
  }, [editing, open]);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do indicador");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      target: form.target.trim(),
      current_value: Number(form.current_value) || 0,
      unit: form.unit,
      period: form.period,
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
      delta: form.delta.trim(),
      positive: form.positive,
      display_order: Number(form.display_order) || 0,
      phase_event_id: form.phase_event_id === "none" ? null : form.phase_event_id,
    };

    if (editing) {
      const { error } = await supabase.from("indicators").update(payload).eq("id", editing.id);
      if (error) return toast.error("Erro ao atualizar indicador");
      toast.success("Indicador atualizado");
    } else {
      const { error } = await supabase
        .from("indicators")
        .insert({ ...payload, created_by: user?.id });
      if (error) return toast.error("Erro ao criar indicador");
      toast.success("Indicador criado");
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar indicador" : "Novo indicador"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Taxa de engajamento interno"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="O que esse indicador mede e por quê"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target">Meta</Label>
              <Input
                id="target"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="Ex.: ≥ 80%"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current_value">Resultado atual</Label>
              <Input
                id="current_value"
                type="number"
                step="0.1"
                value={form.current_value}
                onChange={(e) => setForm({ ...form, current_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progresso (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="delta">Variação / Comentário</Label>
              <Input
                id="delta"
                value={form.delta}
                onChange={(e) => setForm({ ...form, delta: e.target.value })}
                placeholder="Ex.: +12% vs. mês anterior"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de exibição</Label>
              <Input
                id="display_order"
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phase_event_id">Vincular a uma fase (Agenda)</Label>
            <Select
              value={form.phase_event_id}
              onValueChange={(v) => setForm({ ...form, phase_event_id: v })}
            >
              <SelectTrigger id="phase_event_id">
                <SelectValue placeholder="Sem vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo</SelectItem>
                {phases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {new Date(p.event_at).toLocaleDateString("pt-BR")} — {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Indicadores vinculados aparecem na Agenda da Fase, na tela inicial.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <Label htmlFor="positive" className="font-medium">
                Tendência positiva
              </Label>
              <p className="text-xs text-muted-foreground">
                Marca o indicador em verde (no rumo). Desmarque para sinalizar atenção.
              </p>
            </div>
            <Switch
              id="positive"
              checked={form.positive}
              onCheckedChange={(v) => setForm({ ...form, positive: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>{editing ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
