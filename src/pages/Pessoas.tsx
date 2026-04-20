import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Search, Users } from "lucide-react";

const people = [
  { name: "Higor Borges", role: "Diretor Executivo / RP", area: "Diretoria", email: "higor@lunksfeel.com.br", ramal: "2001" },
  { name: "Ricardo Almeida", role: "Gerente Comercial", area: "Comercial", email: "ricardo.a@lunksfeel.com.br", ramal: "2200" },
  { name: "Júlia Vasconcelos", role: "Coord. Marketing & Lançamentos", area: "Marketing", email: "julia.v@lunksfeel.com.br", ramal: "2400" },
  { name: "Rafael Tanaka", role: "Head de Suporte Técnico IoT", area: "Suporte Técnico", email: "rafael.t@lunksfeel.com.br", ramal: "2100" },
  { name: "Patrícia Lopes", role: "Coord. Atendimento ao Cliente", area: "Atendimento", email: "patricia.l@lunksfeel.com.br", ramal: "2300" },
  { name: "Daniel Ferraz", role: "Resp. Logística e Suprimentos", area: "Logística", email: "daniel.f@lunksfeel.com.br", ramal: "2600" },
  { name: "André Pimentel", role: "Controller Financeiro", area: "Financeiro", email: "andre.p@lunksfeel.com.br", ramal: "2700" },
  { name: "Beatriz Hara", role: "Analista de Comunicação Interna", area: "Diretoria", email: "bia.h@lunksfeel.com.br", ramal: "2010" },
  { name: "Camila Rebouças", role: "Consultora — Entrementes HB", area: "Agência", email: "camila@entrementeshb.com.br", ramal: "—" },
];

const areaColors: Record<string, string> = {
  Diretoria: "bg-success/10 text-success border-success/20",
  Comercial: "bg-primary/10 text-primary border-primary/20",
  Marketing: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  "Suporte Técnico": "bg-info/10 text-info border-info/20",
  Atendimento: "bg-accent text-accent-foreground border-accent",
  Logística: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  Financeiro: "bg-primary/10 text-primary border-primary/20",
  Agência: "bg-destructive/10 text-destructive border-destructive/20",
};

const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("");

const Pessoas = () => {
  const [q, setQ] = useState("");
  const filtered = people.filter((p) =>
    (p.name + p.role + p.area).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 border-0 bg-primary/10 text-primary">
            <Users className="mr-1 h-3 w-3" /> Diretório · 62 pessoas
          </Badge>
          <h1 className="font-display text-4xl font-bold">Pessoas Lunks Feel</h1>
          <p className="mt-1 max-w-xl text-muted-foreground">
            Conheça quem é quem na Lunks Feel do Brasil e na agência parceira Entrementes HB.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, área ou cargo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 rounded-full pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
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
        {filtered.length === 0 && (
          <Card className="col-span-full border-dashed p-12 text-center">
            <p className="text-muted-foreground">Nenhuma pessoa encontrada para "{q}".</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Pessoas;
