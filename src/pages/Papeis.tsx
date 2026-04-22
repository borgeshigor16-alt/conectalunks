import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, ShieldCheck, ShieldAlert, UserCog, Plus, KeyRound, Trash2, Pencil, EyeOff, Eye } from "lucide-react";
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

interface UserFormState {
  user_id?: string;
  full_name: string;
  email: string;
  password: string;
  position: string;
  sector_id: string;
  role: Role;
}
const emptyForm: UserFormState = { full_name: "", email: "", password: "", position: "", sector_id: "none", role: "viewer" };

const Papeis = () => {
  const { isAdmin, loading, user: currentUser } = useAuth();
  const { data: sectors = [] } = useSectors();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [resetTarget, setResetTarget] = useState<ProfileRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "user_roles"] });
  };

  const callAdmin = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Papel atualizado."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao atualizar papel."),
  });

  const setSector = useMutation({
    mutationFn: async ({ userId, sectorId }: { userId: string; sectorId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ sector_id: sectorId }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Setor atualizado."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao atualizar setor."),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ active }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => { invalidateAll(); toast.success(vars.active ? "Usuário reativado." : "Usuário ocultado."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao alterar visibilidade."),
  });

  const createUser = useMutation({
    mutationFn: () => callAdmin({
      action: "create",
      email: form.email.trim(),
      password: form.password,
      full_name: form.full_name.trim(),
      position: form.position.trim() || null,
      sector_id: form.sector_id === "none" ? null : form.sector_id,
      role: form.role,
    }),
    onSuccess: () => { invalidateAll(); setFormOpen(false); setForm(emptyForm); toast.success("Usuário criado."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao criar usuário."),
  });

  const updateUser = useMutation({
    mutationFn: () => callAdmin({
      action: "update_profile",
      user_id: editing?.user_id,
      full_name: form.full_name.trim(),
      position: form.position.trim() || null,
      sector_id: form.sector_id === "none" ? null : form.sector_id,
    }).then(async () => {
      if (editing) await setRole.mutateAsync({ userId: editing.user_id, role: form.role });
    }),
    onSuccess: () => { invalidateAll(); setFormOpen(false); setEditing(null); setForm(emptyForm); toast.success("Usuário atualizado."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao atualizar usuário."),
  });

  const resetPassword = useMutation({
    mutationFn: () => callAdmin({ action: "reset_password", user_id: resetTarget?.user_id, password: newPassword }),
    onSuccess: () => { setResetTarget(null); setNewPassword(""); toast.success("Senha redefinida."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao redefinir senha."),
  });

  const deleteUser = useMutation({
    mutationFn: () => callAdmin({ action: "delete", user_id: deleteTarget?.user_id }),
    onSuccess: () => { invalidateAll(); setDeleteTarget(null); toast.success("Usuário excluído."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao excluir usuário."),
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
    return list
      .filter((p) => showInactive || p.active !== false)
      .filter((p) => !q.trim() || p.full_name.toLowerCase().includes(q.toLowerCase()));
  }, [profilesQuery.data, q, showInactive]);

  const adminCount = useMemo(
    () => Array.from(rolesByUser.values()).filter((r) => r.includes("admin")).length,
    [rolesByUser],
  );

  const startCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const startEdit = (p: ProfileRow) => {
    setEditing(p);
    const userRoles = rolesByUser.get(p.user_id) ?? [];
    const role: Role = userRoles.includes("admin") ? "admin" : userRoles.includes("editor") ? "editor" : "viewer";
    setForm({ full_name: p.full_name, email: "", password: "", position: p.position ?? "", sector_id: p.sector_id ?? "none", role });
    setFormOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 border-0 bg-primary/10 text-primary">
            <ShieldCheck className="mr-1 h-3 w-3" /> Gestão de papéis · acesso restrito
          </Badge>
          <h1 className="font-display text-4xl font-bold">Papéis e usuários</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Crie, edite, oculte ou exclua acessos. Defina papel (admin/editor/visualizador) e setor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-full pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
            <Label htmlFor="show-inactive" className="text-sm">Mostrar inativos</Label>
          </div>
          <Button variant="hero" onClick={startCreate}><Plus className="h-4 w-4" /> Novo usuário</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Usuários</p>
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
          const isLastAdmin = currentRole === "admin" && adminCount <= 1;
          const inactive = p.active === false;

          return (
            <Card key={p.id} className={`border-border/60 p-5 shadow-soft ${inactive ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-warm font-bold text-primary-foreground">{initials(p.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{p.full_name}</p>
                    {isSelf && <Badge variant="outline" className="border-primary/30 text-primary text-xs">Você</Badge>}
                    {inactive && <Badge variant="outline" className="border-muted-foreground/30 text-xs">Oculto</Badge>}
                    <Badge variant="outline" className={roleStyle[currentRole]}>{roleLabel[currentRole]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.position ?? "Cargo não informado"}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Papel</span>
                  <Select
                    value={currentRole}
                    onValueChange={(v) => {
                      if (isSelf && isLastAdmin && v !== "admin") {
                        toast.error("Promova outra pessoa antes de rebaixar a si mesmo.");
                        return;
                      }
                      setRole.mutate({ userId: p.user_id, role: v as Role });
                    }}
                    disabled={setRole.isPending}
                  >
                    <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger className="h-10 w-48"><SelectValue placeholder="Sem setor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem setor</SelectItem>
                      {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" title="Editar" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" title="Redefinir senha" onClick={() => { setResetTarget(p); setNewPassword(""); }}><KeyRound className="h-4 w-4" /></Button>
                  <Button
                    variant="ghost" size="icon"
                    title={inactive ? "Reativar" : "Ocultar"}
                    onClick={() => toggleActive.mutate({ userId: p.user_id, active: inactive })}
                  >
                    {inactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" title="Excluir"
                    className="text-destructive hover:text-destructive"
                    disabled={isSelf || isLastAdmin}
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
            <p>Mantenha pelo menos dois administradores ativos. "Ocultar" remove o usuário das listagens sem apagar dados; "Excluir" remove o acesso permanentemente.</p>
          </div>
        </div>
      </Card>

      {/* Form de criação/edição */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome completo</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={100} />
            </div>
            {!editing && (
              <>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                </div>
                <div>
                  <Label>Senha provisória</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} />
                </div>
              </>
            )}
            <div>
              <Label>Cargo</Label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} maxLength={100} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Setor</Label>
                <Select value={form.sector_id} onValueChange={(v) => setForm({ ...form, sector_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem setor</SelectItem>
                    {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Papel</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button
              variant="hero"
              disabled={createUser.isPending || updateUser.isPending}
              onClick={() => editing ? updateUser.mutate() : createUser.mutate()}
            >
              {(createUser.isPending || updateUser.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Defina uma nova senha para <strong>{resetTarget?.full_name}</strong>. Compartilhe de forma segura.</p>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} placeholder="Nova senha (mín. 8 caracteres)" className="mt-3" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancelar</Button>
            <Button variant="hero" disabled={newPassword.length < 8 || resetPassword.isPending} onClick={() => resetPassword.mutate()}>
              {resetPassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Redefinir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente o acesso de <strong>{deleteTarget?.full_name}</strong>. Os conteúdos publicados por ele permanecerão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteUser.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Papeis;
