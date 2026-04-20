import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ShoppingCart,
  Headphones,
  Megaphone,
  Cpu,
  Heart,
  Scale,
  Wallet,
  ArrowRight,
} from "lucide-react";

const sectors = [
  {
    icon: ShoppingCart,
    name: "Comercial & Vendas",
    lead: "Carlos Menezes",
    people: 48,
    desc: "Ofertas, parceiros, performance e canais B2C/B2B.",
  },
  {
    icon: Headphones,
    name: "Atendimento ao Cliente",
    lead: "Patrícia Lopes",
    people: 92,
    desc: "SAC, ouvidoria, retenção e jornada do assinante.",
  },
  {
    icon: Cpu,
    name: "Tecnologia & Rede",
    lead: "Rafael Tanaka",
    people: 36,
    desc: "Core MVNO, BSS/OSS, integrações com hospedeira.",
  },
  {
    icon: Megaphone,
    name: "Marketing & Marca",
    lead: "Júlia Vasconcelos",
    people: 22,
    desc: "Campanhas, conteúdo, branding e mídia paga.",
  },
  {
    icon: Heart,
    name: "Pessoas & Cultura",
    lead: "Marcos Ribeiro",
    people: 14,
    desc: "Recrutamento, desenvolvimento e clima organizacional.",
  },
  {
    icon: Scale,
    name: "Jurídico & Compliance",
    lead: "Helena Couto",
    people: 9,
    desc: "Anatel, LGPD, contratos e governança regulatória.",
  },
  {
    icon: Wallet,
    name: "Financeiro & Billing",
    lead: "André Pimentel",
    people: 18,
    desc: "Faturamento, cobrança, planejamento e controladoria.",
  },
  {
    icon: Building2,
    name: "Relações Institucionais",
    lead: "Ana Souza",
    people: 6,
    desc: "Comunicação corporativa, imprensa e stakeholders.",
  },
];

const Setores = () => {
  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 border-0 bg-primary/10 text-primary">
          <Building2 className="mr-1 h-3 w-3" /> Estrutura organizacional
        </Badge>
        <h1 className="font-display text-4xl font-bold">Setores da Lunks</h1>
        <p className="mt-1 text-muted-foreground">
          Conheça as áreas, seus líderes e o que cada uma entrega para a operação MVNO.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((s, i) => (
          <Card
            key={s.name}
            className="group relative overflow-hidden border-border/60 bg-gradient-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-warm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-warm opacity-0 blur-2xl transition-smooth group-hover:opacity-30" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-smooth group-hover:bg-gradient-warm group-hover:text-primary-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold leading-tight">{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>

              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Líder</p>
                  <p className="text-sm font-semibold">{s.lead}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Pessoas</p>
                  <p className="text-sm font-semibold">{s.people}</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="mt-3 w-full justify-between">
                Acessar área <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Setores;
