import { createContext, useContext, useState, ReactNode } from "react";

export type AnnouncementCategory =
  | "Lançamento"
  | "Operações"
  | "Pessoas"
  | "Regulatório"
  | "Cultura"
  | "Diretoria";

export interface Announcement {
  id: string;
  category: AnnouncementCategory;
  title: string;
  excerpt: string;
  author: string;
  date: string; // ISO
  pinned?: boolean;
}

const initial: Announcement[] = [
  {
    id: "c-001",
    pinned: true,
    category: "Lançamento",
    title: "Pré-lançamento Hey Apólo SAT — conectividade satelital para IoT remoto",
    excerpt:
      "A Diretoria, em conjunto com a agência Entrementes HB, comunica o início da Fase 1 do plano de comunicação integrada para o lançamento do Hey Apólo SAT, previsto para o 2º semestre. Materiais técnicos serão liberados em breve para Comercial, Suporte e Atendimento.",
    author: "Diretoria",
    date: "2026-04-18",
  },
  {
    id: "c-002",
    pinned: true,
    category: "Operações",
    title: "FL+LATAM: novo protocolo de alinhamento Marketing ↔ Suporte ↔ Comercial",
    excerpt:
      "A partir desta semana, todo material de campanha do FL+LATAM passa por checklist de comunicação interna antes da divulgação externa, conforme item 5.4.2 do plano de comunicação integrada.",
    author: "Marketing",
    date: "2026-04-17",
  },
  {
    id: "c-003",
    category: "Cultura",
    title: "Lançado o boletim interno 'Conexão Feel' — edição mensal #01",
    excerpt:
      "Primeira edição do boletim oficial da Lunks Feel já está disponível na intranet ConectaLunks. Conheça novidades de cada setor, perfis de colaboradores e indicadores do mês.",
    author: "Entrementes HB",
    date: "2026-04-15",
  },
  {
    id: "c-004",
    category: "Pessoas",
    title: "Comitê Intersetorial de Comunicação — eleição de representantes",
    excerpt:
      "Cada um dos 7 setores deve indicar um representante até 30/04 para compor o Comitê Intersetorial. Os encontros serão quinzenais e abertos a observadores.",
    author: "Recursos Humanos",
    date: "2026-04-12",
  },
  {
    id: "c-005",
    category: "Regulatório",
    title: "Atualização Anatel — homologação de SIM Cards M2M para roaming LATAM",
    excerpt:
      "Compliance preparou resumo executivo dos novos requisitos para operação do FL+LATAM em países da América Latina. Treinamento obrigatório para Suporte Técnico até 10/05.",
    author: "Jurídico & Compliance",
    date: "2026-04-10",
  },
  {
    id: "c-006",
    category: "Diretoria",
    title: "Encontro trimestral 'Fala com a Diretoria' — 28/04",
    excerpt:
      "Apresentação dos resultados do 1º trimestre, andamento do plano de comunicação integrada e abertura para perguntas dos colaboradores.",
    author: "Diretoria",
    date: "2026-04-08",
  },
];

interface Ctx {
  announcements: Announcement[];
  add: (a: Omit<Announcement, "id" | "date">) => void;
  update: (id: string, a: Partial<Announcement>) => void;
  remove: (id: string) => void;
  togglePin: (id: string) => void;
}

const AnnouncementsContext = createContext<Ctx | undefined>(undefined);

export function AnnouncementsProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initial);

  const add: Ctx["add"] = (a) =>
    setAnnouncements((prev) => [
      { ...a, id: `c-${Date.now()}`, date: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);

  const update: Ctx["update"] = (id, a) =>
    setAnnouncements((prev) => prev.map((x) => (x.id === id ? { ...x, ...a } : x)));

  const remove: Ctx["remove"] = (id) =>
    setAnnouncements((prev) => prev.filter((x) => x.id !== id));

  const togglePin: Ctx["togglePin"] = (id) =>
    setAnnouncements((prev) =>
      prev.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)),
    );

  return (
    <AnnouncementsContext.Provider value={{ announcements, add, update, remove, togglePin }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error("useAnnouncements deve ser usado dentro de AnnouncementsProvider");
  return ctx;
}

export const categoryStyle = (c: AnnouncementCategory) =>
  ({
    Lançamento: "bg-primary/10 text-primary border-primary/20",
    Operações: "bg-info/10 text-info border-info/20",
    Pessoas: "bg-secondary/20 text-secondary-foreground border-secondary/30",
    Regulatório: "bg-destructive/10 text-destructive border-destructive/20",
    Cultura: "bg-accent text-accent-foreground border-accent",
    Diretoria: "bg-success/10 text-success border-success/20",
  })[c];
