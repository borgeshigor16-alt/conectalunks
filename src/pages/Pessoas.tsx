import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Search, Users } from "lucide-react";

const people = [
  { name: "Ana Souza", role: "Gerente de Relações Institucionais", area: "RI", email: "ana.souza@lunks.com.br", ramal: "2010" },
  { name: "Carlos Menezes", role: "Diretor Comercial", area: "Comercial", email: "carlos.m@lunks.com.br", ramal: "2200" },
  { name: "Patrícia Lopes", role: "Head de Atendimento", area: "Atendimento", email: "patricia@lunks.com.br", ramal: "2300" },
  { name: "Rafael Tanaka", role: "CTO", area: "Tecnologia", email: "rafael@lunks.com.br", ramal: "2100" },
  { name: "Júlia Vasconcelos", role: "Head de Marketing", area: "Marketing", email: "julia@lunks.com.br", ramal: "2400" },
  { name: "Marcos Ribeiro", role: "Head de Pessoas", area: "RH", email: "marcos.r@lunks.com.br", ramal: "2500" },
  { name: "Helena Couto", role: "Compliance Officer", area: "Jurídico", email: "helena@lunks.com.br", ramal: "2600" },
  { name: "André Pimentel", role: "CFO", area: "Financeiro", email: "andre.p@lunks.com.br", ramal: "2700" },
  { name: "Beatriz Hara", role: "Analista de Comunicação Interna", area: "RI", email: "bia@lunks.com.br", ramal: "2011" },
];

const areaColors: Record<string, string> = {
  RI: "bg-primary/10 text-primary border-primary/20",
  Comercial: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  Atendimento: "bg-info/10 text-info border-info/20",
  Tecnologia: "bg-accent text-accent-foreground border-accent",
  Marketing: "bg-primary/10 text-primary border-primary/20",
  RH: "bg-success/10 text-success border-success/20",
  Jurídico: "bg-destructive/10 text-destructive border-destructive/20",
  Financeiro: "bg-secondary/20 text-secondary-foreground border-secondary/30",
};

const initials = (n: string) =>
  n.split(" ").map((s) => s[0]).slice(0, 2).join("");

const Pessoas = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 border-0 bg-primary/10 text-primary">
            <Users className="mr-1 h-3 w-3" /> Diretório
          </Badge>
          <h1 className="font-display text-4xl font-bold">Pessoas Lunks</h1>
          <p className="mt-1 text-muted-foreground">
            Encontre quem é quem na empresa e fale com facilidade.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, área ou cargo" className="h-11 rounded-full pl-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p, i) => (
          <Card
            key={p.email}
            className="group border-border/60 bg-gradient-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-warm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-background ring-offset-2 ring-offset-primary/20">
                <AvatarFallback className="bg-gradient-warm font-bold text-primary-foreground">
                  {initials(p.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-bold leading-tight">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.role}</p>
                <Badge variant="outline" className={`mt-2 ${areaColors[p.area]}`}>
                  {p.area}
                </Badge>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
              <a
                href={`mailto:${p.email}`}
                className="flex items-center gap-2 text-muted-foreground transition-smooth hover:text-primary"
              >
                <Mail className="h-4 w-4" /> {p.email}
              </a>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> Ramal {p.ramal}
              </p>
            </div>
            <Button variant="soft" size="sm" className="mt-4 w-full">
              Enviar mensagem
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pessoas;
