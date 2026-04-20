import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Megaphone, Filter, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const items = [
  {
    pinned: true,
    tag: "Lançamento",
    color: "bg-primary/10 text-primary border-primary/20",
    title: "Nova oferta Lunks Família 80GB entra em vigor segunda-feira",
    excerpt:
      "A partir de 22/04 o time comercial deve usar o novo material de venda. Argumentário e FAQ disponíveis na Base de Conhecimento.",
    author: "Marketing",
    time: "há 2 horas",
  },
  {
    tag: "Operações",
    color: "bg-info/10 text-info border-info/20",
    title: "Janela de manutenção do Core 5G — domingo 02h às 05h",
    excerpt:
      "Atendimento deve estar preparado para fluxo elevado de chamadas no domingo de manhã. Roteiro de contingência atualizado.",
    author: "Engenharia de Rede",
    time: "há 5 horas",
  },
  {
    tag: "Pessoas",
    color: "bg-secondary/20 text-secondary-foreground border-secondary/30",
    title: "Inscrições abertas para o programa Conecta Liderança 2026",
    excerpt:
      "RH abre 30 vagas para o programa de desenvolvimento de líderes. Inscrições até 30/04 pelo portal interno.",
    author: "Recursos Humanos",
    time: "ontem",
  },
  {
    tag: "Regulatório",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    title: "Atualização da Resolução Anatel 740 — impactos no SAC",
    excerpt:
      "Compliance preparou um resumo executivo dos novos prazos de resposta. Treinamento obrigatório até 10/05.",
    author: "Jurídico & Compliance",
    time: "2 dias",
  },
  {
    tag: "Cultura",
    color: "bg-accent text-accent-foreground border-accent",
    title: "Resultados da pesquisa de clima 2025 — eNPS sobe para 64",
    excerpt:
      "Crescimento expressivo nos pilares de comunicação e reconhecimento. Confira o relatório completo.",
    author: "Pessoas & Cultura",
    time: "3 dias",
  },
];

const Comunicados = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 border-0 bg-primary/10 text-primary">
            <Megaphone className="mr-1 h-3 w-3" /> Comunicação interna
          </Badge>
          <h1 className="font-display text-4xl font-bold">Comunicados</h1>
          <p className="mt-1 text-muted-foreground">
            Avisos oficiais, lançamentos e mudanças que impactam toda a Lunks.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="h-10 w-64 rounded-full pl-9" />
          </div>
          <Button variant="soft" size="default" className="rounded-full">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((it, i) => (
          <Card
            key={it.title}
            className="group border-border/60 p-6 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-warm"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="bg-gradient-warm text-sm font-bold text-primary-foreground">
                  {it.author.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={it.color}>
                    {it.tag}
                  </Badge>
                  {it.pinned && (
                    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                      <Pin className="mr-1 h-3 w-3" /> Fixado
                    </Badge>
                  )}
                </div>
                <h3 className="font-display text-xl font-bold leading-tight text-foreground group-hover:text-primary">
                  {it.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{it.author}</span> · {it.time}
                  </p>
                  <Button variant="ghost" size="sm">
                    Ler mais →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Comunicados;
