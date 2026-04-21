import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Check, LogOut, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationsCloud } from "@/hooks/usePortalData";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

const initials = (name?: string | null) => (name ?? "CL").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { profile, sectors, roles, signOut, refreshProfile } = useAuth();
  const { data: notifications = [], markRead } = useNotificationsCloud();
  const [profileOpen, setProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [position, setPosition] = useState(profile?.position ?? "");
  const [sectorId, setSectorId] = useState(profile?.sector_id ?? "");
  const unread = notifications.filter((n) => !n.read_at).length;

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName, position, sector_id: sectorId }).eq("id", profile.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    setProfileOpen(false);
    toast.success("Perfil atualizado.");
  };

  const logout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-soft">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-foreground" />
            <div className="relative ml-2 hidden flex-1 max-w-md md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar pessoas, processos, comunicados..." className="h-10 rounded-full border-border bg-muted/50 pl-10 pr-4 focus-visible:ring-primary" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Abrir notificações">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-2">
                  <div className="px-2 py-2">
                    <p className="font-display text-lg font-bold">Notificações</p>
                    <p className="text-xs text-muted-foreground">Avisos reais do seu setor.</p>
                  </div>
                  <div className="max-h-80 space-y-1 overflow-auto">
                    {notifications.map((n) => (
                      <button key={n.id} onClick={() => { if (!n.read_at) markRead.mutate(n.id); if (n.link) navigate(n.link); }} className="w-full rounded-xl p-3 text-left transition-smooth hover:bg-accent">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{n.title}</p>
                          {!n.read_at && <Badge className="bg-primary/10 text-primary">novo</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                      </button>
                    ))}
                    {notifications.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhuma notificação.</p>}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full bg-card px-2 py-1 shadow-soft transition-smooth hover:bg-accent">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-warm text-xs font-semibold text-primary-foreground">{initials(profile?.full_name)}</AvatarFallback></Avatar>
                    <div className="hidden pr-2 text-right md:block">
                      <p className="text-xs font-semibold leading-tight">{profile?.full_name ?? "Colaborador"}</p>
                      <p className="text-[10px] text-muted-foreground">{profile?.position ?? roles[0] ?? "editor"}</p>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setFullName(profile?.full_name ?? ""); setPosition(profile?.position ?? ""); setSectorId(profile?.sector_id ?? ""); setProfileOpen(true); }}><UserRound className="h-4 w-4" /> Meu perfil e setor</Button>
                  <Button variant="ghost" className="w-full justify-start" asChild><Link to="/pessoas"><Search className="h-4 w-4" /> Diretório</Link></Button>
                  <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={logout}><LogOut className="h-4 w-4" /> Sair</Button>
                </PopoverContent>
              </Popover>
            </div>
          </header>
          <main className="flex-1 animate-fade-in p-4 md:p-8">{children}</main>
        </div>
      </div>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">Meu perfil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} /></div>
            <div><Label>Cargo</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} maxLength={100} /></div>
            <div><Label>Setor</Label><Select value={sectorId} onValueChange={setSectorId}><SelectTrigger><SelectValue placeholder="Selecione seu setor" /></SelectTrigger><SelectContent>{sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <Button variant="hero" className="w-full" onClick={saveProfile}><Check className="h-4 w-4" /> Salvar perfil</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
