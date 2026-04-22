import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Megaphone, Pin, Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RecordForm } from "@/components/RecordForm";
import { AnnouncementRow, useAnnouncementsCloud, useCrud, useSectors } from "@/hooks/usePortalData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categories = ["Lançamento", "Operações", "Pessoas", "Regulatório", "Cultura", "Diretoria"];
const categoryStyle = (c: string) => ({ Lançamento: "bg-primary/10 text-primary border-primary/20", Operações: "bg-info/10 text-info border-info/20", Pessoas: "bg-secondary/20 text-secondary-foreground border-secondary/30", Regulatório: "bg-destructive/10 text-destructive border-destructive/20", Cultura: "bg-accent text-accent-foreground border-accent", Diretoria: "bg-success/10 text-success border-success/20" }[c] ?? "bg-muted text-muted-foreground border-border");
const initials = (name: string) => name.split(" ").map((s) => s[0]).join("").slice(0, 2);

const Comunicados = () => {
  const { data: announcements = [], isLoading } = useAnnouncementsCloud();
  const { data: sectors = [] } = useSectors();
  const { canManageSector, canCreateContent, profile } = useAuth();
  const crud = useCrud("announcements", "announcements");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [confirming, setConfirming] = useState<AnnouncementRow | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => announcements.filter((a) => (filter === "all" || a.category === filter) && (search.trim() === "" || `${a.title}${a.excerpt}${a.author_name}`.toLowerCase().includes(search.toLowerCase()))), [announcements, filter, search]);
  const defaultSector = profile?.sector_id ?? sectors[0]?.id ?? "";

  const submit = async (values: Record<string, string>) => {
    const payload = { sector_id: values.sector_id, category: values.category, title: values.title.trim(), excerpt: values.excerpt.trim(), body: values.body || values.excerpt, author_name: values.author_name.trim(), status: "published" as const };
    try {
      if (editing) await crud.update.mutateAsync({ id: editing.id, payload }); else await crud.create.mutateAsync(payload);
      toast.success(editing ? "Comunicado atualizado." : "Comunicado publicado.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar comunicado."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-2 border-0 bg-primary/10 text-primary"><Megaphone className="mr-1 h-3 w-3" /> Boletim Conexão Feel</Badge><h1 className="font-display text-4xl font-bold">Comunicados oficiais</h1><p className="mt-1 text-muted-foreground">Canal real de comunicação interna entre setores da Lunks Feel.</p></div>{canCreateContent && <Button variant="hero" size="lg" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Novo comunicado</Button>}</div>
      <div className="flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por título, conteúdo ou setor..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-full pl-9" /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="h-11 w-44 rounded-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas categorias</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
      {isLoading && <Card className="p-10 text-center text-primary"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Card>}
      <div className="grid gap-4">{filtered.map((it) => <Card key={it.id} className="border-border/60 p-6 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-warm"><div className="flex flex-col gap-4 md:flex-row md:items-start"><Avatar className="h-12 w-12 shrink-0"><AvatarFallback className="bg-gradient-warm text-sm font-bold text-primary-foreground">{initials(it.author_name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="outline" className={categoryStyle(it.category)}>{it.category}</Badge>{it.pinned && <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary"><Pin className="mr-1 h-3 w-3" /> Fixado</Badge>}<Badge variant="outline">{it.sectors?.name}</Badge></div><h3 className="font-display text-xl font-bold leading-tight">{it.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.excerpt}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{it.author_name}</span> · {new Date(it.created_at).toLocaleDateString("pt-BR")}</p><div className="flex gap-1">{canManageSector(it.sector_id) && <><Button variant="ghost" size="sm" onClick={() => crud.update.mutate({ id: it.id, payload: { pinned: !it.pinned } })}><Pin className="h-4 w-4" />{it.pinned ? "Desafixar" : "Fixar"}</Button><Button variant="ghost" size="sm" onClick={() => { setEditing(it); setOpen(true); }}><Pencil className="h-4 w-4" /> Editar</Button><Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirming(it)}><Trash2 className="h-4 w-4" /> Excluir</Button></>}</div></div></div></div></Card>)}</div>
      <RecordForm open={open} onOpenChange={setOpen} title={editing ? "Editar comunicado" : "Novo comunicado"} sectors={sectors} initial={{ sector_id: editing?.sector_id ?? defaultSector, category: editing?.category ?? "Lançamento", title: editing?.title, excerpt: editing?.excerpt, body: editing?.body, author_name: editing?.author_name ?? profile?.full_name }} fields={[{ name: "sector_id", label: "Setor", type: "select", required: true }, { name: "category", label: "Categoria", type: "select", required: true, options: categories.map((c) => ({ label: c, value: c })) }, { name: "author_name", label: "Autor", required: true, maxLength: 100 }, { name: "title", label: "Título", required: true, maxLength: 160 }, { name: "excerpt", label: "Resumo", type: "textarea", required: true, maxLength: 500 }, { name: "body", label: "Conteúdo completo", type: "textarea", maxLength: 5000 }]} onSubmit={submit} />
      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir comunicado?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá <strong>"{confirming?.title}"</strong> do portal.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={async () => { if (confirming) { await crud.remove.mutateAsync(confirming.id); setConfirming(null); toast.success("Comunicado removido."); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};
export default Comunicados;
