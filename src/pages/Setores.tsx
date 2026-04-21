import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Pencil, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SectorRow, useSectors } from "@/hooks/usePortalData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Setores = () => {
  const { data: sectors = [] } = useSectors();
  const { canManageSector, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SectorRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", acronym: "", leader_name: "", description: "" });

  const start = (sector?: SectorRow) => { setEditing(sector ?? null); setForm({ name: sector?.name ?? "", acronym: sector?.acronym ?? "", leader_name: sector?.leader_name ?? "", description: sector?.description ?? "" }); setOpen(true); };
  const save = async () => { const payload = { name: form.name.trim(), acronym: form.acronym.trim(), leader_name: form.leader_name || null, description: form.description || null }; const q = editing ? supabase.from("sectors").update(payload).eq("id", editing.id) : supabase.from("sectors").insert(payload); const { error } = await q; if (error) return toast.error(error.message); await queryClient.invalidateQueries({ queryKey: ["sectors"] }); setOpen(false); toast.success(editing ? "Setor atualizado." : "Setor criado."); };

  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-2 border-0 bg-primary/10 text-primary"><Building2 className="mr-1 h-3 w-3" /> Estrutura organizacional</Badge><h1 className="font-display text-4xl font-bold">Setores da Lunks Feel</h1><p className="mt-1 max-w-2xl text-muted-foreground">Departamentos reais com edição por responsáveis do setor.</p></div>{isAdmin && <Button variant="hero" onClick={() => start()}><Plus className="h-4 w-4" /> Novo setor</Button>}</div><div className="grid gap-5 md:grid-cols-2">{sectors.map((s) => <Card key={s.id} className="group relative overflow-hidden border-border/60 bg-gradient-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-warm"><div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-warm opacity-0 blur-2xl transition-smooth group-hover:opacity-30" /><div className="relative"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-smooth group-hover:bg-gradient-warm group-hover:text-primary-foreground"><Building2 className="h-6 w-6" /></div><div className="min-w-0 flex-1"><h3 className="font-display text-lg font-bold leading-tight">{s.name}</h3><p className="mt-1 text-sm text-muted-foreground">{s.description}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-border/60 py-3"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Líder</p><p className="text-sm font-semibold">{s.leader_name ?? "—"}</p></div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sigla</p><p className="text-sm font-semibold">{s.acronym}</p></div></div><div className="mt-4 flex gap-2"><Button variant="ghost" size="sm" className="flex-1 justify-between">Acessar área <ArrowRight className="h-4 w-4" /></Button>{canManageSector(s.id) && <Button variant="ghost" size="sm" onClick={() => start(s)}><Pencil className="h-4 w-4" /> Editar</Button>}</div></div></Card>)}</div><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Editar setor" : "Novo setor"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></div><div><Label>Sigla</Label><Input value={form.acronym} onChange={(e) => setForm({ ...form, acronym: e.target.value })} maxLength={12} /></div><div><Label>Liderança</Label><Input value={form.leader_name} onChange={(e) => setForm({ ...form, leader_name: e.target.value })} maxLength={100} /></div><div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={800} /></div></div><DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button variant="hero" onClick={save}>Salvar</Button></DialogFooter></DialogContent></Dialog></div>;
};
export default Setores;
