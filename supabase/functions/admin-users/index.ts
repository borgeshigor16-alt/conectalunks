// Admin user management — create, update password, delete auth users.
// Only callable by users with role = 'admin'.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

interface Body {
  action: "create" | "delete" | "reset_password" | "update_profile";
  email?: string;
  password?: string;
  full_name?: string;
  position?: string | null;
  sector_id?: string | null;
  role?: "admin" | "editor" | "viewer";
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing bearer token" }, 401);
    }

    // Verify caller is admin
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id);
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    if (!isAdmin) return json({ error: "Forbidden — admin only" }, 403);

    const body = (await req.json()) as Body;

    switch (body.action) {
      case "create": {
        if (!body.email || !body.password || !body.full_name) {
          return json({ error: "email, password and full_name required" }, 400);
        }
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { full_name: body.full_name },
        });
        if (createErr || !created.user) return json({ error: createErr?.message ?? "create failed" }, 400);

        const newId = created.user.id;
        // Update profile fields (trigger creates a base profile)
        await admin.from("profiles").update({
          full_name: body.full_name,
          position: body.position ?? null,
          sector_id: body.sector_id ?? null,
        }).eq("user_id", newId);

        // Override role if provided (trigger sets viewer by default, or admin if first)
        if (body.role) {
          await admin.from("user_roles").delete().eq("user_id", newId);
          await admin.from("user_roles").insert({ user_id: newId, role: body.role });
        }
        return json({ ok: true, user_id: newId });
      }

      case "delete": {
        if (!body.user_id) return json({ error: "user_id required" }, 400);
        if (body.user_id === userRes.user.id) return json({ error: "Não é possível excluir a si mesmo" }, 400);
        // Ensure at least one admin remains
        const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
        const adminIds = (admins ?? []).map((a) => a.user_id);
        if (adminIds.length <= 1 && adminIds.includes(body.user_id)) {
          return json({ error: "É necessário manter pelo menos um administrador." }, 400);
        }
        const { error: delErr } = await admin.auth.admin.deleteUser(body.user_id);
        if (delErr) return json({ error: delErr.message }, 400);
        return json({ ok: true });
      }

      case "reset_password": {
        if (!body.user_id || !body.password) return json({ error: "user_id and password required" }, 400);
        const { error } = await admin.auth.admin.updateUserById(body.user_id, { password: body.password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "update_profile": {
        if (!body.user_id) return json({ error: "user_id required" }, 400);
        const updates: Record<string, unknown> = {};
        if (body.full_name !== undefined) updates.full_name = body.full_name;
        if (body.position !== undefined) updates.position = body.position;
        if (body.sector_id !== undefined) updates.sector_id = body.sector_id;
        if (Object.keys(updates).length) {
          const { error } = await admin.from("profiles").update(updates).eq("user_id", body.user_id);
          if (error) return json({ error: error.message }, 400);
        }
        return json({ ok: true });
      }

      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "internal error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
