import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AnnouncementsProvider } from "@/store/announcements";
import Index from "./pages/Index.tsx";
import Comunicados from "./pages/Comunicados.tsx";
import Setores from "./pages/Setores.tsx";
import Processos from "./pages/Processos.tsx";
import Conhecimento from "./pages/Conhecimento.tsx";
import Pessoas from "./pages/Pessoas.tsx";
import Indicadores from "./pages/Indicadores.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AnnouncementsProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/comunicados" element={<Comunicados />} />
              <Route path="/setores" element={<Setores />} />
              <Route path="/processos" element={<Processos />} />
              <Route path="/indicadores" element={<Indicadores />} />
              <Route path="/conhecimento" element={<Conhecimento />} />
              <Route path="/pessoas" element={<Pessoas />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AnnouncementsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
