import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, KeyRound, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Configuracoes = () => {
  const { profile, sectors, roles, isAdmin, refreshProfile, signOut, user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [sectorId, setSectorId] = useState<string>("none");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPosition(profile.position ?? "");
      setSectorId(profile.sector_id ?? "none");
    }
  }, [profile]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      const updates: { full_name: string; position: string | null; sector_id?: string | null } = {
        full_name: fullName.trim(),
        position: position.trim() || null,
      };
      if (isAdmin) updates.sector_id = sectorId === "none" ? null : sectorId;
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", profile.user_id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Perfil atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) return toast.error("Senha deve ter ao menos 8 caracteres.");
    if (newPwd !== confirmPwd) return toast.error("Confirmação não confere.");
    if (!user?.email) return toast.error("E-mail não encontrado.");
    setSavingPwd(true);
    try {
      // Reautentica para validar a senha atual
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPwd });
      if (signErr) throw new Error("Senha atual incorreta.");
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      toast.success("Senha atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setSavingPwd(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const userSectorName = sectors.find((s) => s.id === profile?.sector_id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2 border-0 bg-primary/10 text-primary">
          <SettingsIcon className="mr-1 h-3 w-3" /> Configurações da conta
        </Badge>
        <h1 className="font-display text-4xl font-bold">Sua conta no ConectaLunks</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Atualize dados pessoais, troque sua senha e gerencie a sessão.
        </p>
      </div>

      <Card className="border-border/60 bg-gradient-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{profile?.full_name ?? "Carregando..."}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => <Badge key={r} variant="outline" className="border-primary/30 text-primary">{r}</Badge>)}
            <Badge variant="outline">Setor: {userSectorName}</Badge>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="sessao">Sessão</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card className="border-border/60 p-6 shadow-soft">
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} required />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label>Setor</Label>
                <Select value={sectorId} onValueChange={setSectorId} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem setor</SelectItem>
                    {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!isAdmin && <p className="mt-1 text-xs text-muted-foreground">Somente administradores podem alterar o setor.</p>}
              </div>
              <Button type="submit" variant="hero" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar perfil
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card className="border-border/60 p-6 shadow-soft">
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <Label>Senha atual</Label>
                <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nova senha</Label>
                  <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} minLength={8} required />
                </div>
                <div>
                  <Label>Confirmar nova senha</Label>
                  <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} minLength={8} required />
                </div>
              </div>
              <Button type="submit" variant="hero" disabled={savingPwd}>
                {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Alterar senha
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="sessao">
          <Card className="border-border/60 p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">
              Encerrar a sessão removerá seu acesso neste dispositivo. Será necessário entrar novamente para usar o portal.
            </p>
            <Button variant="destructive" className="mt-4" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sair da conta
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
