import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  FileText,
  PlayCircle,
  HelpCircle,
  ScrollText,
} from "lucide-react";

const categories = [
  { icon: FileText, label: "Políticas internas", count: 24, color: "bg-primary/10 text-primary" },
  { icon: ScrollText, label: "Manuais operacionais", count: 38, color: "bg-secondary/20 text-secondary-foreground" },
  { icon: PlayCircle, label: "Treinamentos em vídeo", count: 17, color: "bg-info/10 text-info" },
  { icon: HelpCircle, label: "FAQ rápida", count: 86, color: "bg-success/10 text-success" },
];

const articles = [
  {
    cat: "Política",
    title: "Código de conduta e ética da Lunks",
    read: "8 min",
  },
  {
    cat: "Manual",
    title: "Como abrir um chamado para a área de Engenharia de Rede",
    read: "3 min",
  },
  {
    cat: "FAQ",
    title: "Diferença entre MVNO Light, Full e Branded — guia rápido",
    read: "5 min",
  },
  {
    cat: "Treinamento",
    title: "Atendimento humanizado: princípios da escuta ativa",
    read: "12 min",
  },
  {
    cat: "Política",
    title: "Diretrizes de comunicação em redes sociais corporativas",
    read: "6 min",
  },
  {
    cat: "Manual",
    title: "Procedimento para tratativa de reclamações na Anatel",
    read: "10 min",
  },
];

const Conhecimento = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-warm p-8 shadow-warm md:p-12">
        <Badge className="mb-3 border-0 bg-background/20 text-primary-foreground backdrop-blur-md">
          <BookOpen className="mr-1 h-3 w-3" /> Base de Conhecimento
        </Badge>
        <h1 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
          O que você quer aprender hoje?
        </h1>
        <p className="mt-3 max-w-xl text-primary-foreground/85">
          Tudo que a Lunks documenta — políticas, manuais, treinamentos e respostas rápidas.
        </p>
        <div className="relative mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar artigos, manuais, treinamentos..."
            className="h-14 rounded-2xl border-0 bg-background pl-12 text-base shadow-soft"
          />
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">Categorias</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Card
              key={c.label}
              className="group cursor-pointer border-border/60 p-5 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-warm"
            >
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${c.color}`}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold">{c.label}</p>
              <p className="text-sm text-muted-foreground">{c.count} artigos</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">Mais acessados</h2>
        <div className="grid gap-3">
          {articles.map((a) => (
            <Card
              key={a.title}
              className="group flex cursor-pointer items-center justify-between gap-4 border-border/60 p-5 shadow-soft transition-smooth hover:bg-accent/30"
            >
              <div className="flex min-w-0 items-center gap-4">
                <Badge variant="outline" className="shrink-0 border-primary/20 bg-primary/5 text-primary">
                  {a.cat}
                </Badge>
                <p className="truncate font-medium group-hover:text-primary">{a.title}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{a.read} de leitura</span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Conhecimento;
