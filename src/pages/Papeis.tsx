import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ShieldCheck, ShieldAlert, UserCog } from "lucide-react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectors } from "@/hooks/usePortalData";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Role = "admin" | "editor" | "viewer";
type ProfileRow = Tables<"profiles">;
type RoleRow = Tables<"user_roles">;

const roleStyle: Record<Role, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  editor: "bg-success/10 text-success border-success/30",
  viewer: "bg-muted text-muted-foreground border-border",
};
const roleLabel: Record<Role, string> = { admin: "Administrador", editor: "Editor", viewer: "Visualizador" };
const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

const Papeis = () => {
  const { isAdmin, loading, user: currentUser } = useAuth();
  const { data: sectors = [] } = useSectors();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const profilesQuery = useQuery({
    queryKey: ["admin", "profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["admin", "user_roles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user_roles"] });
      toast.success("Papel atualizado.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao atualizar papel."),
  });

  const setSector = useMutation({
    mutationFn: async ({ userId, sectorId }: { userId: string; sectorId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ sector_id: sectorId }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast.success("Setor atualizado.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao atualizar setor."),
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, Role[]>();
    (rolesQuery.data ?? []).forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      map.set(r.user_id, arr);
    });
    return map;
  }, [rolesQuery.data]);

  const filtered = useMemo(() => {
    const list = profilesQuery.data ?? [];
    if (!q.trim()) return list;
    const term = q.toLowerCase();
    return list.filter((p) => p.full_name.toLowerCase().includes(term));
  }, [profilesQuery.data, q]);

  const adminCount = useMemo(
    () => Array.from(rolesByUser.values()).filter((r) => r.includes("admin")).length,
    [rolesByUser],
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 border-0 bg-primary/10 text-primary">
            <ShieldCheck className="mr-1 h-3 w-3" /> Gestão de papéis · acesso restrito
          </Badge>
          <h1 className="font-display text-4xl font-bold">Papéis e permissões</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Defina quem é administrador, editor ou visualizador e a qual setor cada pessoa pertence.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-full pl-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Usuários ativos</p>
          <p className="mt-1 font-display text-3xl font-bold">{profilesQuery.data?.length ?? 0}</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Administradores</p>
          <p className="mt-1 font-display text-3xl font-bold text-primary">{adminCount}</p>
        </Card>
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Setores cadastrados</p>
          <p className="mt-1 font-display text-3xl font-bold">{sectors.length}</p>
        </Card>
      </div>

      {(profilesQuery.isLoading || rolesQuery.isLoading) && (
        <Card className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></Card>
      )}

      <div className="grid gap-3">
        {filtered.map((p) => {
          const userRoles = rolesByUser.get(p.user_id) ?? [];
          const currentRole: Role = userRoles.includes("admin") ? "admin" : userRoles.includes("editor") ? "editor" : "viewer";
          const isSelf = p.user_id === currentUser?.id;
          const wouldRemoveLastAdmin = isSelf && currentRole === "admin" && adminCount <= 1;

          return (
            <Card key={p.id} className="border-border/60 p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-warm font-bold text-primary-foreground">{initials(p.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{p.full_name}</p>
                    {isSelf && <Badge variant="outline" className="border-primary/30 text-primary text-xs">Você</Badge>}
                    <Badge variant="outline" className={roleStyle[currentRole]}>{roleLabel[currentRole]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.position ?? "Cargo não informado"}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Papel</span>
                  <Select
                    value={currentRole}
                    onValueChange={(v) => {
                      if (wouldRemoveLastAdmin && v !== "admin") {
                        toast.error("Você é o último administrador. Promova outra pessoa antes de rebaixar a si mesmo.");
                        return;
                      }
                      setRole.mutate({ userId: p.user_id, role: v as Role });
                    }}
                    disabled={setRole.isPending}
                  >
                    <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Setor</span>
                  <Select
                    value={p.sector_id ?? "none"}
                    onValueChange={(v) => setSector.mutate({ userId: p.user_id, sectorId: v === "none" ? null : v })}
                    disabled={setSector.isPending}
                  >
                    <SelectTrigger className="h-10 w-56"><SelectValue placeholder="Sem setor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem setor</SelectItem>
                      {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          );
        })}
        {!profilesQuery.isLoading && filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">
            <UserCog className="mx-auto mb-2 h-6 w-6" /> Nenhum usuário encontrado.
          </Card>
        )}
      </div>

      <Card className="border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-foreground">Boas práticas</p>
            <p>Mantenha pelo menos dois administradores ativos. Editores só podem alterar conteúdos do próprio setor.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Papeis;
