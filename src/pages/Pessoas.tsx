import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Mail, Phone, Search, Users, Plus, Pencil, Trash2, MessageCircle } from "lucide-react";
import { RecordForm } from "@/components/RecordForm";
import { PersonRow, useCrud, usePeopleCloud, useSectors } from "@/hooks/usePortalData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("");

const Pessoas = () => {
  const { data: people = [] } = usePeopleCloud();
  const { data: sectors = [] } = useSectors();
  const { canManageSector, profile } = useAuth();
  const crud = useCrud("people", "people");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PersonRow | null>(null);
  const [confirming, setConfirming] = useState<PersonRow | null>(null);
  const filtered = useMemo(() => people.filter((p) => `${p.full_name}${p.position}${p.sectors?.name}`.toLowerCase().includes(q.toLowerCase())), [people, q]);

  const submit = async (values: Record<string, string>) => {
    const payload = { sector_id: values.sector_id, full_name: values.full_name.trim(), position: values.position.trim(), email: values.email || null, phone: values.phone || null, extension: values.extension || null, bio: values.bio || null, active: true };
    try { editing ? await crud.update.mutateAsync({ id: editing.id, payload }) : await crud.create.mutateAsync(payload); toast.success(editing ? "Pessoa atualizada." : "Pessoa adicionada."); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar pessoa."); }
  };

  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge className="mb-2 border-0 bg-primary/10 text-primary"><Users className="mr-1 h-3 w-3" /> Diretório · {people.length} pessoas</Badge><h1 className="font-display text-4xl font-bold">Pessoas Lunks Feel</h1><p className="mt-1 max-w-xl text-muted-foreground">Diretório real com contatos, setores e ações aplicáveis.</p></div><Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Adicionar pessoa</Button><div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome, área ou cargo" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-full pl-9" /></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((p) => <Card key={p.id} className="border-border/60 bg-gradient-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-warm"><div className="flex items-start gap-4"><Avatar className="h-14 w-14 ring-2 ring-background ring-offset-2 ring-offset-primary/20"><AvatarFallback className="bg-gradient-warm font-bold text-primary-foreground">{initials(p.full_name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><h3 className="font-display text-lg font-bold leading-tight">{p.full_name}</h3><p className="text-sm text-muted-foreground">{p.position}</p><Badge variant="outline" className="mt-2 border-primary/20 bg-primary/5 text-primary">{p.sectors?.name}</Badge></div></div><div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm"><a href={`mailto:${p.email}`} className="flex items-center gap-2 text-muted-foreground transition-smooth hover:text-primary"><Mail className="h-4 w-4" /> {p.email}</a><p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> Ramal {p.extension ?? "—"}</p></div><div className="mt-4 flex gap-2"><Button variant="soft" size="sm" className="flex-1" asChild><a href={`mailto:${p.email}?subject=Contato via ConectaLunks`}><MessageCircle className="h-4 w-4" /> Mensagem</a></Button>{canManageSector(p.sector_id) && <><Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setConfirming(p)}><Trash2 className="h-4 w-4" /></Button></>}</div></Card>)}</div><RecordForm open={open} onOpenChange={setOpen} title={editing ? "Editar pessoa" : "Adicionar pessoa"} sectors={sectors} initial={{ sector_id: editing?.sector_id ?? profile?.sector_id ?? sectors[0]?.id, full_name: editing?.full_name, position: editing?.position, email: editing?.email, phone: editing?.phone, extension: editing?.extension, bio: editing?.bio }} fields={[{ name: "sector_id", label: "Setor", type: "select", required: true }, { name: "full_name", label: "Nome", required: true, maxLength: 100 }, { name: "position", label: "Cargo", required: true, maxLength: 100 }, { name: "email", label: "E-mail", type: "email", maxLength: 255 }, { name: "phone", label: "Telefone", maxLength: 40 }, { name: "extension", label: "Ramal", maxLength: 20 }, { name: "bio", label: "Biografia", type: "textarea", maxLength: 1000 }]} onSubmit={submit} /><AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir pessoa?</AlertDialogTitle><AlertDialogDescription>Remover {confirming?.full_name} do diretório.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={async () => { if (confirming) { await crud.remove.mutateAsync(confirming.id); setConfirming(null); toast.success("Pessoa removida."); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
};
export default Pessoas;
