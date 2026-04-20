import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Workflow,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";

const processes = [
  {
    code: "P-001",
    title: "Ativação de nova linha pré-paga",
    owner: "Atendimento",
    steps: 6,
    sla: "até 2h",
    status: "Em produção",
  },
  {
    code: "P-014",
    title: "Portabilidade numérica entrante",
    owner: "Operações",
    steps: 9,
    sla: "até 3 dias úteis",
    status: "Em produção",
  },
  {
    code: "P-022",
    title: "Lançamento de oferta comercial",
    owner: "Marketing + Comercial",
    steps: 12,
    sla: "15 dias",
    status: "Em revisão",
  },
  {
    code: "P-031",
    title: "Atendimento de incidente regulatório",
    owner: "Compliance",
    steps: 7,
    sla: "imediato",
    status: "Em produção",
  },
  {
    code: "P-045",
    title: "Onboarding de novo colaborador",
    owner: "Pessoas & Cultura",
    steps: 10,
    sla: "5 dias",
    status: "Em produção",
  },
  {
    code: "P-058",
    title: "Comunicado oficial à imprensa",
    owner: "Relações Institucionais",
    steps: 5,
    sla: "24h",
    status: "Em produção",
  },
];

const statusColor = (s: string) =>
  s === "Em produção"
    ? "bg-success/10 text-success border-success/20"
    : "bg-secondary/20 text-secondary-foreground border-secondary/30";

const Processos = () => {
  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 border-0 bg-primary/10 text-primary">
          <Workflow className="mr-1 h-3 w-3" /> Processos & Fluxos
        </Badge>
        <h1 className="font-display text-4xl font-bold">Como a Lunks opera</h1>
        <p className="mt-1 text-muted-foreground">
          Documentação viva dos processos transversais entre os setores.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Processos mapeados</p>
          <p className="mt-1 font-display text-3xl font-bold">58</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Em produção</p>
          <p className="mt-1 font-display text-3xl font-bold text-success">52</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Em revisão</p>
          <p className="mt-1 font-display text-3xl font-bold text-secondary-foreground">6</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {processes.map((p, i) => (
          <Card
            key={p.code}
            className="group border-border/60 p-6 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-warm"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-semibold text-primary">{p.code}</p>
                <h3 className="mt-1 font-display text-lg font-bold leading-tight group-hover:text-primary">
                  {p.title}
                </h3>
              </div>
              <Badge variant="outline" className={statusColor(p.status)}>
                {p.status === "Em produção" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {p.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
              <div>
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Users className="h-3 w-3" /> Responsável
                </p>
                <p className="mt-1 text-sm font-semibold">{p.owner}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Etapas</p>
                <p className="mt-1 text-sm font-semibold">{p.steps}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Clock className="h-3 w-3" /> SLA
                </p>
                <p className="mt-1 text-sm font-semibold">{p.sla}</p>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="mt-3 w-full justify-between">
              Ver fluxo completo <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Processos;
