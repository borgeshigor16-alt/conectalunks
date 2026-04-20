import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-soft">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-foreground" />
            <div className="relative ml-2 hidden flex-1 max-w-md md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar pessoas, processos, comunicados..."
                className="h-10 rounded-full border-border bg-muted/50 pl-10 pr-4 focus-visible:ring-primary"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <div className="flex items-center gap-3 rounded-full bg-card px-2 py-1 shadow-soft">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-warm text-xs font-semibold text-primary-foreground">
                    HB
                  </AvatarFallback>
                </Avatar>
                <div className="hidden pr-2 text-right md:block">
                  <p className="text-xs font-semibold leading-tight">Higor Borges</p>
                  <p className="text-[10px] text-muted-foreground">Diretoria · RP</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 animate-fade-in p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
