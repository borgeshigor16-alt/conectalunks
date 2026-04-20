import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Workflow, CheckCircle2, Clock, Users, ArrowRight, Loader2 } from "lucide-react";

const processes = [
  {
    code: "P-001",
    title: "Ativação de SIM Card M2M corporativo",
    owner: "Comercial → Suporte Técnico → Logística",
    steps: 7,
    sla: "até 24h",
    status: "Em produção",
  },
  {
    code: "P-002",
    title: "Lançamento de produto (FL+LATAM / Hey Apólo SAT)",
    owner: "Marketing → Comercial → Suporte → Atendimento",
    steps: 12,
    sla: "30 dias antes do go-live",
    status: "Em revisão",
  },
  {
    code: "P-003",
    title: "Atendimento de incidente em conectividade IoT",
    owner: "Atendimento → Suporte Técnico",
    steps: 6,
    sla: "P1: 2h · P2: 8h",
    status: "Em produção",
  },
  {
    code: "P-004",
    title: "Faturamento e conciliação de contratos corporativos",
    owner: "Financeiro ↔ Comercial",
    steps: 9,
    sla: "5 dias úteis",
    status: "Em produção",
  },
  {
    code: "P-005",
    title: "Reunião do Comitê Intersetorial de Comunicação",
    owner: "Entrementes HB + 7 setores",
    steps: 5,
    sla: "Quinzenal",
    status: "Em produção",
  },
  {
    code: "P-006",
    title: "Tratativa de demanda regulatória Anatel",
    owner: "Jurídico → Diretoria → Suporte",
    steps: 8,
    sla: "Imediato",
    status: "Em produção",
  },
  {
    code: "P-007",
    title: "Onboarding de novo colaborador Lunks",
    owner: "RH + setor de destino",
    steps: 10,
    sla: "5 dias",
    status: "Em produção",
  },
  {
    code: "P-008",
    title: "Distribuição internacional de SIM Cards (LATAM)",
    owner: "Logística → Suporte → Comercial",
    steps: 11,
    sla: "10-15 dias úteis",
    status: "Em revisão",
  },
];

const statusStyle = (s: string) =>
  s === "Em produção"
    ? "bg-success/10 text-success border-success/20"
    : "bg-secondary/30 text-secondary-foreground border-secondary/40";

const Processos = () => {
  const total = processes.length;
  const prod = processes.filter((p) => p.status === "Em produção").length;
  const rev = total - prod;

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 border-0 bg-primary/10 text-primary">
          <Workflow className="mr-1 h-3 w-3" /> Processos & Fluxos
        </Badge>
        <h1 className="font-display text-4xl font-bold">Como a Lunks Feel opera</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Documentação dos processos transversais entre setores — base para reduzir retrabalho e
          padronizar fluxos comunicacionais (item 5.3 da proposta).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Processos mapeados</p>
          <p className="mt-1 font-display text-3xl font-bold">{total}</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Em produção</p>
          <p className="mt-1 font-display text-3xl font-bold text-success">{prod}</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Em revisão</p>
          <p className="mt-1 font-display text-3xl font-bold text-secondary-foreground">{rev}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {processes.map((p, i) => (
          <Card
            key={p.code}
            className="group border-border/60 p-6 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-warm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-primary">{p.code}</p>
                <h3 className="mt-1 font-display text-lg font-bold leading-tight group-hover:text-primary">
                  {p.title}
                </h3>
              </div>
              <Badge variant="outline" className={`${statusStyle(p.status)} shrink-0`}>
                {p.status === "Em produção" ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <Loader2 className="mr-1 h-3 w-3" />
                )}
                {p.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
              <div className="col-span-3 sm:col-span-1">
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Users className="h-3 w-3" /> Fluxo
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
