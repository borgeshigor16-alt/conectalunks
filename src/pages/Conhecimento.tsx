import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Search,
  FileText,
  PlayCircle,
  HelpCircle,
  ScrollText,
  Cpu,
} from "lucide-react";

const categories = [
  { icon: FileText, label: "Políticas internas", count: 12, color: "bg-primary/10 text-primary" },
  { icon: ScrollText, label: "Manuais técnicos M2M/IoT", count: 24, color: "bg-info/10 text-info" },
  { icon: PlayCircle, label: "Treinamentos em vídeo", count: 9, color: "bg-secondary/30 text-secondary-foreground" },
  { icon: HelpCircle, label: "FAQ rápida", count: 38, color: "bg-success/10 text-success" },
];

const articles = [
  { cat: "Manual", title: "FL+LATAM — guia técnico de configuração para roaming IoT", read: "10 min", pop: 92 },
  { cat: "Política", title: "Diretrizes de comunicação interna — plano Entrementes HB 2026", read: "8 min", pop: 86 },
  { cat: "FAQ", title: "Diferença entre M2M e IoT explicada para o time Comercial", read: "4 min", pop: 78 },
  { cat: "Treinamento", title: "Atendimento ao cliente B2B: escuta ativa em incidentes técnicos", read: "12 min", pop: 71 },
  { cat: "Manual", title: "Procedimento de homologação Anatel para SIM Cards corporativos", read: "15 min", pop: 65 },
  { cat: "Pré-lançamento", title: "Hey Apólo SAT — argumentário comercial preliminar (rascunho)", read: "6 min", pop: 58 },
];

const Conhecimento = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-warm p-8 shadow-warm md:p-12">
        <Badge className="mb-3 border-0 bg-background/20 text-primary-foreground backdrop-blur-md">
          <BookOpen className="mr-1 h-3 w-3" /> Base de Conhecimento ConectaLunks
        </Badge>
        <h1 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
          Tudo sobre M2M, IoT e os processos da Lunks.
        </h1>
        <p className="mt-3 max-w-xl text-primary-foreground/85">
          Canal técnico interno acessível a todos os colaboradores — pilar do plano de comunicação
          integrada (item 5.4.3 da monografia).
        </p>
        <div className="relative mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar artigos, manuais técnicos, FAQ..."
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
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold">{c.label}</p>
              <p className="text-sm text-muted-foreground">{c.count} artigos</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Mais acessados pelos setores</h2>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            <Cpu className="mr-1 h-3 w-3" /> Atualizado hoje
          </Badge>
        </div>
        <div className="grid gap-3">
          {articles.map((a) => (
            <Card
              key={a.title}
              className="group cursor-pointer border-border/60 p-5 shadow-soft transition-smooth hover:bg-accent/30"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <Badge variant="outline" className="shrink-0 border-primary/20 bg-primary/5 text-primary">
                    {a.cat}
                  </Badge>
                  <p className="truncate font-medium group-hover:text-primary">{a.title}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{a.read}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={a.pop} className="h-1.5" />
                <span className="text-xs font-semibold text-muted-foreground">{a.pop}% leram</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Conhecimento;
