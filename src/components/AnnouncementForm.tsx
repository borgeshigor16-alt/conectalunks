import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Announcement,
  AnnouncementCategory,
  useAnnouncements,
} from "@/store/announcements";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Announcement | null;
}

const categories: AnnouncementCategory[] = [
  "Lançamento",
  "Operações",
  "Pessoas",
  "Regulatório",
  "Cultura",
  "Diretoria",
];

const authors = [
  "Diretoria",
  "Comercial",
  "Marketing",
  "Suporte Técnico",
  "Atendimento ao Cliente",
  "Logística e Suprimentos",
  "Financeiro",
  "Recursos Humanos",
  "Jurídico & Compliance",
  "Entrementes HB",
];

export function AnnouncementForm({ open, onOpenChange, editing }: Props) {
  const { add, update } = useAnnouncements();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [excerpt, setExcerpt] = useState(editing?.excerpt ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(
    editing?.category ?? "Lançamento",
  );
  const [author, setAuthor] = useState(editing?.author ?? "Diretoria");

  const reset = () => {
    setTitle("");
    setExcerpt("");
    setCategory("Lançamento");
    setAuthor("Diretoria");
  };

  const handleSubmit = () => {
    if (!title.trim() || !excerpt.trim()) {
      toast.error("Preencha título e conteúdo do comunicado.");
      return;
    }
    if (editing) {
      update(editing.id, { title, excerpt, category, author });
      toast.success("Comunicado atualizado.");
    } else {
      add({ title, excerpt, category, author });
      toast.success("Comunicado publicado na ConectaLunks.");
      reset();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {editing ? "Editar comunicado" : "Novo comunicado"}
          </DialogTitle>
          <DialogDescription>
            Os comunicados são distribuídos a todos os setores via intranet ConectaLunks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cat">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AnnouncementCategory)}>
                <SelectTrigger id="cat" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="author">Setor responsável</Label>
              <Select value={author} onValueChange={setAuthor}>
                <SelectTrigger id="author" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {authors.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Hey Apólo SAT entra na fase de pré-lançamento"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Conteúdo</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Resuma o comunicado em poucas linhas..."
              rows={5}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="hero" onClick={handleSubmit}>
            {editing ? "Salvar alterações" : "Publicar comunicado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
