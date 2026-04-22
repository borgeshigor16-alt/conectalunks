import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type Sector = Tables<"sectors">;
type Profile = Tables<"profiles">;
type Role = "admin" | "editor" | "viewer";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  sectors: Sector[];
  loading: boolean;
  isAdmin: boolean;
  canCreateContent: boolean;
  canManageSector: (sectorId?: string | null) => boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeUser = sessionData.session?.user ?? null;
    if (!activeUser) {
      setProfile(null);
      setRoles([]);
      return;
    }

    const [{ data: profileData }, { data: roleRows }, { data: sectorRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", activeUser.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", activeUser.id),
      supabase.from("sectors").select("*").order("name"),
    ]);

    setProfile(profileData ?? null);
    setRoles((roleRows ?? []).map((row) => row.role as Role));
    setSectors(sectorRows ?? []);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setTimeout(() => {
        refreshProfile().finally(() => setLoading(false));
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      refreshProfile().finally(() => setLoading(false));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = roles.includes("admin");
    const isEditor = roles.includes("editor");
    return {
      user,
      session,
      profile,
      roles,
      sectors,
      loading,
      isAdmin,
      canCreateContent: isAdmin || (isEditor && Boolean(profile?.sector_id)),
      canManageSector: (sectorId) => Boolean(isAdmin || (isEditor && sectorId && profile?.sector_id === sectorId)),
      refreshProfile,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, fullName) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    };
  }, [user, session, profile, roles, sectors, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
