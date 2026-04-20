import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, TrendingUp, Calendar, Target } from "lucide-react";

const indicators = [
  {
    name: "Taxa de engajamento interno",
    desc: "Percentual de colaboradores que utilizam os novos canais (intranet ConectaLunks, boletim Conexão Feel).",
    target: "≥ 80%",
    current: 78,
    period: "Mensal",
    progress: 78,
    delta: "+12% vs. mês anterior",
    positive: true,
  },
  {
    name: "Tempo médio de resposta intersetorial",
    desc: "Tempo médio de retorno entre setores em demandas internas registradas no portal.",
    target: "Redução de 30%",
    current: 22,
    period: "Trimestral",
    progress: 73,
    delta: "−22% vs. baseline",
    positive: true,
  },
  {
    name: "Índice de retrabalho",
    desc: "Medição de tarefas repetidas por falha comunicacional entre Marketing, Comercial, Suporte e Atendimento.",
    target: "Redução de 40%",
    current: 18,
    period: "Trimestral",
    progress: 45,
    delta: "−18% vs. baseline (caso FL+LATAM)",
    positive: true,
  },
  {
    name: "Clima organizacional",
    desc: "Satisfação geral com a comunicação interna, mensurada por pesquisa de clima.",
    target: "≥ 8/10",
    current: 7.6,
    period: "Semestral",
    progress: 76,
    delta: "+0,9 pt vs. medição inicial",
    positive: true,
  },
  {
    name: "Integração de processos",
    desc: "Grau de interação entre departamentos, apurado por pesquisa interna estruturada.",
    target: "≥ 75%",
    current: 68,
    period: "Semestral",
    progress: 91,
    delta: "Caminho para a meta",
    positive: true,
  },
];

const Indicadores = () => {
  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 border-0 bg-primary/10 text-primary">
          <Gauge className="mr-1 h-3 w-3" /> Item 5.5 da monografia
        </Badge>
        <h1 className="font-display text-4xl font-bold">Indicadores do plano de comunicação</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Métricas qualitativas e quantitativas monitoradas pela <strong>Entrementes HB</strong> para
          avaliar a efetividade do plano de comunicação integrada interna na Lunks Feel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-gradient-warm p-6 text-primary-foreground shadow-warm">
          <Target className="mb-2 h-5 w-5" />
          <p className="text-xs uppercase tracking-wider opacity-90">Indicadores ativos</p>
          <p className="mt-1 font-display text-3xl font-bold">5</p>
          <p className="mt-1 text-xs opacity-90">monitorados continuamente</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-6 shadow-soft">
          <Calendar className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Fase atual</p>
          <p className="mt-1 font-display text-2xl font-bold">Fase 1 — Sensibilização</p>
          <p className="mt-1 text-xs text-muted-foreground">de 6 meses previstos</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-6 shadow-soft">
          <TrendingUp className="mb-2 h-5 w-5 text-success" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Indicadores no rumo</p>
          <p className="mt-1 font-display text-3xl font-bold text-success">5 / 5</p>
          <p className="mt-1 text-xs text-muted-foreground">acima do baseline</p>
        </Card>
      </div>

      <div className="grid gap-4">
        {indicators.map((k, i) => (
          <Card
            key={k.name}
            className="border-border/60 p-6 shadow-soft transition-smooth hover:shadow-warm"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold">{k.name}</h3>
                  <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                    {k.period}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{k.desc}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Progresso até a meta
                    </span>
                    <span className="text-xs font-semibold text-primary">{k.progress}%</span>
                  </div>
                  <Progress value={k.progress} className="h-2" />
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 md:w-56 md:items-end md:text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Resultado atual
                  </p>
                  <p className="font-display text-3xl font-bold text-foreground">
                    {k.current}
                    {k.name.includes("clima") ? "" : k.name.includes("Tempo") || k.name.includes("retrabalho") ? "%" : "%"}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Meta
                  </p>
                  <p className="text-sm font-semibold">{k.target}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    k.positive
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }
                >
                  {k.delta}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Indicadores;
