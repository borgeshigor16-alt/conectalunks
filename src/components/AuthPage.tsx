import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, LockKeyhole, Sparkles } from "lucide-react";

export function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, fullName.trim());
        toast.success("Conta criada. Confira seu e-mail para confirmar o acesso.");
      } else {
        await signIn(email.trim(), password);
        toast.success("Acesso liberado ao ConectaLunks.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md border-border/60 bg-gradient-card p-8 shadow-warm">
        <Badge className="mb-4 border-0 bg-primary/10 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> ConectaLunks · acesso interno
        </Badge>
        <h1 className="font-display text-3xl font-bold">{mode === "login" ? "Entrar no portal" : "Criar acesso"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Login real para colaboradores da Lunks Feel com permissões por setor.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={100} required className="mt-1" />
            </div>
          )}
          <div>
            <Label htmlFor="email">E-mail corporativo</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className="mt-1" />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {mode === "login" ? "Acessar" : "Cadastrar"}
          </Button>
        </form>

        <Button variant="ghost" className="mt-3 w-full" onClick={() => setMode(mode === "login" ? "signup" : "login")}> 
          {mode === "login" ? "Criar novo acesso" : "Já tenho acesso"}
        </Button>
      </Card>
    </main>
  );
}
