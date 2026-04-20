import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ShoppingCart,
  Headphones,
  Megaphone,
  Cpu,
  Truck,
  Wallet,
  Crown,
  ArrowRight,
} from "lucide-react";

const sectors = [
  {
    icon: Crown,
    name: "Diretoria Executiva",
    lead: "Higor Borges",
    people: 4,
    desc: "Decisões estratégicas, inovação de produtos e canal 'Fala com a Diretoria'.",
    actions: ["Encontros trimestrais", "Comunicados institucionais", "Comunicação empática"],
  },
  {
    icon: ShoppingCart,
    name: "Comercial",
    lead: "Ricardo Almeida",
    people: 12,
    desc: "Vendas e relacionamento com clientes corporativos de IoT/M2M.",
    actions: [
      "Canal direto com Marketing antes de lançamentos",
      "Newsletter semanal de oportunidades",
      "Reuniões bimestrais de alinhamento",
    ],
  },
  {
    icon: Megaphone,
    name: "Marketing",
    lead: "Júlia Vasconcelos",
    people: 7,
    desc: "Campanhas, lançamentos (FL+LATAM, Hey Apólo SAT) e comunicação externa.",
    actions: [
      "Calendário integrado de campanhas",
      "Materiais explicativos pré-lançamento",
      "Checklists de comunicação interna",
    ],
  },
  {
    icon: Cpu,
    name: "Suporte Técnico",
    lead: "Rafael Tanaka",
    people: 11,
    desc: "Integração e monitoramento dos serviços IoT e SIM Cards M2M.",
    actions: [
      "Canal técnico interno (Base de Conhecimento)",
      "Treinamentos mensais sobre novos produtos",
      "Relatórios de incidentes comunicacionais",
    ],
  },
  {
    icon: Headphones,
    name: "Atendimento ao Cliente",
    lead: "Patrícia Lopes",
    people: 14,
    desc: "Relacionamento pós-venda, SAC corporativo e ouvidoria.",
    actions: [
      "Protocolo padrão com Comercial e Marketing",
      "Feedback estruturado para gestão",
      "Treinamentos integrados com Suporte",
    ],
  },
  {
    icon: Truck,
    name: "Logística e Suprimentos",
    lead: "Daniel Ferraz",
    people: 6,
    desc: "Gestão de chips, envios nacionais/internacionais e controle de estoque.",
    actions: [
      "Padronização de comunicação sobre estoque",
      "Painel digital de pedidos e entregas",
      "Treinamentos com o Comercial",
    ],
  },
  {
    icon: Wallet,
    name: "Financeiro",
    lead: "André Pimentel",
    people: 5,
    desc: "Faturamento, contratos, conciliação e cobrança.",
    actions: [
      "Fluxo automatizado com Comercial",
      "Boletim mensal de indicadores",
      "Canal de dúvidas internas",
    ],
  },
];

const Setores = () => {
  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 border-0 bg-primary/10 text-primary">
          <Building2 className="mr-1 h-3 w-3" /> Estrutura organizacional
        </Badge>
        <h1 className="font-display text-4xl font-bold">Setores da Lunks Feel</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Os 7 departamentos da MVNO, suas lideranças e as ações de comunicação previstas no plano
          aplicado pela <strong>Entrementes HB</strong> (capítulo 5.4 da monografia).
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {sectors.map((s, i) => (
          <Card
            key={s.name}
            className="group relative overflow-hidden border-border/60 bg-gradient-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-warm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-warm opacity-0 blur-2xl transition-smooth group-hover:opacity-30" />
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-smooth group-hover:bg-gradient-warm group-hover:text-primary-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold leading-tight">{s.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border/60 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Líder</p>
                  <p className="text-sm font-semibold">{s.lead}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pessoas</p>
                  <p className="text-sm font-semibold">{s.people}</p>
                </div>
              </div>

              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ações de comunicação
              </p>
              <ul className="mt-2 space-y-1.5">
                {s.actions.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {a}
                  </li>
                ))}
              </ul>

              <Button variant="ghost" size="sm" className="mt-4 w-full justify-between">
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
