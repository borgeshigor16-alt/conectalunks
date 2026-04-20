import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowUpRight,
  Signal,
  Users,
  TrendingUp,
  Headphones,
  Sparkles,
  Calendar,
  Megaphone,
} from "lucide-react";
import heroImg from "@/assets/hero-connect.jpg";
import { Link } from "react-router-dom";

const kpis = [
  { label: "Linhas ativas", value: "248.5K", trend: "+4,2%", icon: Signal, tone: "primary" },
  { label: "Colaboradores", value: "342", trend: "+8 novos", icon: Users, tone: "secondary" },
  { label: "NPS Atendimento", value: "72", trend: "+5 pts", icon: Headphones, tone: "success" },
  { label: "Churn mensal", value: "1,8%", trend: "-0,3%", icon: TrendingUp, tone: "info" },
];

const announcements = [
  {
    tag: "Lançamento",
    color: "bg-primary/10 text-primary border-primary/20",
    title: "Nova oferta Lunks Família 80GB entra em vigor segunda-feira",
    author: "Marketing",
    time: "há 2 horas",
  },
  {
    tag: "Operações",
    color: "bg-info/10 text-info border-info/20",
    title: "Janela de manutenção do Core 5G — domingo 02h às 05h",
    author: "Engenharia de Rede",
    time: "há 5 horas",
  },
  {
    tag: "Pessoas",
    color: "bg-secondary/20 text-secondary-foreground border-secondary/30",
    title: "Inscrições abertas para o programa Conecta Liderança 2026",
    author: "Recursos Humanos",
    time: "ontem",
  },
];

const events = [
  { day: "23", month: "ABR", title: "All-Hands trimestral", time: "10h00 · Auditório + Online" },
  { day: "28", month: "ABR", title: "Workshop de portabilidade", time: "14h00 · Sala Conexão" },
  { day: "05", month: "MAI", title: "Lançamento campanha 'Sinta Lunks'", time: "09h00 · Marketing" },
];

const Index = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl shadow-warm">
        <img
          src={heroImg}
          alt="Lunks Feel Connect — comunicação que aproxima"
          width={1536}
          height={768}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="relative grid gap-6 p-8 md:grid-cols-2 md:p-12">
          <div className="text-primary-foreground">
            <Badge className="mb-4 border-0 bg-background/20 text-primary-foreground backdrop-blur-md">
              <Sparkles className="mr-1 h-3 w-3" /> Bem-vinda, Ana
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] md:text-5xl">
              Tudo que conecta a Lunks <em className="text-secondary not-italic">em um só lugar.</em>
            </h1>
            <p className="mt-4 max-w-md text-base text-primary-foreground/85">
              Comunicados, processos, pessoas e indicadores integrados — para que cada setor fale
              a mesma língua.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/comunicados">
                  Ver comunicados <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="soft" size="lg" asChild>
                <Link to="/processos">Explorar processos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Card
            key={kpi.label}
            className="group relative overflow-hidden border-border/60 bg-gradient-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-warm"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{kpi.value}</p>
                <p className="mt-1 text-xs font-semibold text-success">{kpi.trend}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
                <kpi.icon className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Comunicados + agenda */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 p-6 shadow-soft lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Comunicados em destaque</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/comunicados">
                Ver todos <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.title}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-transparent p-4 transition-smooth hover:border-border hover:bg-muted/40"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                    {a.author.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Badge variant="outline" className={`mb-2 ${a.color}`}>
                    {a.tag}
                  </Badge>
                  <p className="font-medium leading-snug text-foreground group-hover:text-primary">
                    {a.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.author} · {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border/60 p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Próximos eventos</h2>
          </div>
          <div className="space-y-4">
            {events.map((e) => (
              <div key={e.title} className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground shadow-warm">
                  <span className="font-display text-lg font-bold leading-none">{e.day}</span>
                  <span className="text-[10px] font-semibold tracking-wider">{e.month}</span>
                </div>
                <div className="pt-1">
                  <p className="font-medium text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Index;
