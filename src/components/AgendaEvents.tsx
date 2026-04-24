import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AgendaEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_at: string;
}

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function AgendaEvents() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaEvent | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    event_at: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agenda_events")
      .select("*")
      .order("event_at", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar agenda");
    } else {
      setEvents(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", location: "", event_at: "" });
    setOpen(true);
  };

  const openEdit = (e: AgendaEvent) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description ?? "",
      location: e.location ?? "",
      event_at: toDatetimeLocal(e.event_at),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.event_at) {
      toast.error("Informe título e data/hora");
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      event_at: new Date(form.event_at).toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("agenda_events").update(payload).eq("id", editing.id);
      if (error) return toast.error("Erro ao atualizar evento");
      toast.success("Evento atualizado");
    } else {
      const { error } = await supabase
        .from("agenda_events")
        .insert({ ...payload, created_by: user?.id });
      if (error) return toast.error("Erro ao criar evento");
      toast.success("Evento criado");
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("agenda_events").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Evento excluído");
    load();
  };

  return (
    <Card className="border-border/60 p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Agenda da Fase</h2>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="soft" onClick={openNew}>
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar evento" : "Novo evento"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex.: Workshop sensibilização — Fase 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_at">Data e hora</Label>
                  <Input
                    id="event_at"
                    type="datetime-local"
                    value={form.event_at}
                    onChange={(e) => setForm({ ...form, event_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ex.: Aud. Vergueiro / Online"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detalhes do evento (opcional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={save}>{editing ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento cadastrado.</p>
      ) : (
        <div className="space-y-4">
          {events.map((e) => {
            const d = new Date(e.event_at);
            const day = String(d.getDate()).padStart(2, "0");
            const month = MONTHS[d.getMonth()];
            const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={e.id} className="group flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground shadow-warm">
                  <span className="font-display text-lg font-bold leading-none">{day}</span>
                  <span className="text-[10px] font-semibold tracking-wider">{month}</span>
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="font-medium leading-tight text-foreground">{e.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {time}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.description && (
                    <p className="mt-1 text-xs text-muted-foreground/90">{e.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
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
                          <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O evento "{e.title}" será removido.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(e.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
