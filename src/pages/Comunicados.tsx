import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Megaphone, Pin, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Announcement, useAnnouncements, categoryStyle } from "@/store/announcements";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { toast } from "sonner";

const Comunicados = () => {
  const { announcements, remove, togglePin } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [confirming, setConfirming] = useState<Announcement | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return announcements
      .filter((a) => (filter === "all" ? true : a.category === filter))
      .filter((a) =>
        search.trim() === ""
          ? true
          : (a.title + a.excerpt + a.author).toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [announcements, filter, search]);

  const handleEdit = (a: Announcement) => {
    setEditing(a);
    setOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleDelete = () => {
    if (confirming) {
      remove(confirming.id);
      toast.success("Comunicado removido.");
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 border-0 bg-primary/10 text-primary">
            <Megaphone className="mr-1 h-3 w-3" /> Boletim Conexão Feel
          </Badge>
          <h1 className="font-display text-4xl font-bold">Comunicados oficiais</h1>
          <p className="mt-1 text-muted-foreground">
            Canal padronizado de comunicação interna entre todos os setores da Lunks Feel.
          </p>
        </div>
        <Button variant="hero" size="lg" onClick={handleNew}>
          <Plus className="h-4 w-4" /> Novo comunicado
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, conteúdo ou setor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-full pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-11 w-44 rounded-full">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="Lançamento">Lançamento</SelectItem>
            <SelectItem value="Operações">Operações</SelectItem>
            <SelectItem value="Pessoas">Pessoas</SelectItem>
            <SelectItem value="Regulatório">Regulatório</SelectItem>
            <SelectItem value="Cultura">Cultura</SelectItem>
            <SelectItem value="Diretoria">Diretoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Nenhum comunicado encontrado.</p>
        </Card>
      )}

      <div className="grid gap-4">
        {filtered.map((it, i) => (
          <Card
            key={it.id}
            className="group border-border/60 p-6 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-warm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="bg-gradient-warm text-sm font-bold text-primary-foreground">
                  {it.author.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={categoryStyle(it.category)}>
                    {it.category}
                  </Badge>
                  {it.pinned && (
                    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                      <Pin className="mr-1 h-3 w-3" /> Fixado
                    </Badge>
                  )}
                </div>
                <h3 className="font-display text-xl font-bold leading-tight text-foreground">
                  {it.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.excerpt}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{it.author}</span> ·{" "}
                    {new Date(it.date).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        togglePin(it.id);
                        toast.success(it.pinned ? "Desafixado" : "Fixado no topo");
                      }}
                    >
                      <Pin className="h-4 w-4" />
                      {it.pinned ? "Desafixar" : "Fixar"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(it)}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirming(it)}
                    >
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AnnouncementForm open={open} onOpenChange={setOpen} editing={editing} />

      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comunicado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá <strong>"{confirming?.title}"</strong> da intranet ConectaLunks.
              Não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comunicados;
