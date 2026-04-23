import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthPage } from "@/components/AuthPage";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";
import Comunicados from "./pages/Comunicados.tsx";
import Setores from "./pages/Setores.tsx";
import Processos from "./pages/Processos.tsx";
import ProcessoDetalhe from "./pages/ProcessoDetalhe.tsx";
import Conhecimento from "./pages/Conhecimento.tsx";
import Pessoas from "./pages/Pessoas.tsx";
import Indicadores from "./pages/Indicadores.tsx";
import Papeis from "./pages/Papeis.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const protectedApp = (children: JSX.Element) => (
  <RequireAuth>
    <AppLayout>{children}</AppLayout>
  </RequireAuth>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={protectedApp(<Index />)} />
            <Route path="/comunicados" element={protectedApp(<Comunicados />)} />
            <Route path="/setores" element={protectedApp(<Setores />)} />
            <Route path="/processos" element={protectedApp(<Processos />)} />
            <Route path="/processos/execucao/:id" element={protectedApp(<ProcessoDetalhe />)} />
            <Route path="/indicadores" element={protectedApp(<Indicadores />)} />
            <Route path="/conhecimento" element={protectedApp(<Conhecimento />)} />
            <Route path="/pessoas" element={protectedApp(<Pessoas />)} />
            <Route path="/papeis" element={protectedApp(<Papeis />)} />
            <Route path="/configuracoes" element={protectedApp(<Configuracoes />)} />
            <Route path="*" element={protectedApp(<NotFound />)} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
