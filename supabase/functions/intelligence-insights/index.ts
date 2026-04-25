// Intelligence layer for ConectaLunks: cross-analyzes processes, communications,
// SLAs, and sectors to produce actionable insights grounded in integrated
// communication theory (Kunsch, Torquato).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um analista sênior de comunicação organizacional integrada, especializado nas escolas de Margarida Kunsch (composto da comunicação organizacional: institucional, mercadológica, interna e administrativa) e Gaudêncio Torquato (comunicação como vetor estratégico de integração entre setores).

Seu papel é analisar dados operacionais reais de uma intranet corporativa e produzir insights práticos, objetivos e acionáveis. Foque em:
1. Falhas recorrentes de comunicação entre setores (gargalos de fluxo informacional).
2. Atrasos em processos com base em SLA e tempo médio (gargalos operacionais).
3. Padrões cruzados entre comunicados, processos e setores (alinhamento ou desalinhamento estratégico).
4. Sugestões concretas de melhoria embasadas no composto da comunicação integrada.

Regras de saída:
- Linguagem corporativa, direta, profissional. Sem jargão acadêmico desnecessário.
- Cada item deve citar números, percentuais ou nomes de setores/processos quando os dados permitirem.
- Quando referenciar fundamentos, use frases curtas como "Comunicação interna deficiente (Kunsch)" ou "Falta de integração transversal (Torquato)".
- NUNCA invente números que não estejam nos dados. Se não houver dado, omita o item.
- Produza no MÁXIMO 8 itens no total, equilibrando alertas, insights e sugestões.`;

type InsightItem = {
  kind: "alert" | "insight" | "suggestion";
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  description: string;
  related_sectors: string[];
  metrics: Record<string, unknown>;
  framework_reference?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ error: "AI não configurada" }, 500);

    // Verifica usuário e papel admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Apenas administradores podem gerar análises." }, 403);

    // 1) Coleta dados agregados
    const [
      sectorsRes,
      announcementsRes,
      slaStatusRes,
      avgRes,
      overdueRes,
      logsRes,
      feedbackIdxRes,
      feedbackRecentRes,
    ] = await Promise.all([
      admin.from("sectors").select("id, name, acronym, active").eq("active", true),
      admin
        .from("announcements")
        .select("id, title, category, sector_id, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      admin.from("process_sla_status").select("*"),
      admin.from("step_avg_duration").select("*"),
      admin.rpc("get_overdue_instances"),
      admin
        .from("process_logs")
        .select("action, details, created_at, instance_id")
        .order("created_at", { ascending: false })
        .limit(200),
      admin.rpc("get_feedback_indices", { _days: 90 }),
      admin
        .from("feedbacks")
        .select("target_kind, sentiment, ai_tags, ai_summary, clarity_score, alignment_score, satisfaction_score, created_at")
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

    const sectors = sectorsRes.data ?? [];
    const announcements = announcementsRes.data ?? [];
    const slaStatus = (slaStatusRes.data ?? []) as any[];
    const avgDur = (avgRes.data ?? []) as any[];
    const overdue = (overdueRes.data ?? []) as any[];
    const logs = (logsRes.data ?? []) as any[];
    const feedbackIndices = (feedbackIdxRes.data ?? [])[0] ?? null;
    const feedbacks = (feedbackRecentRes.data ?? []) as any[];

    // 2) Estatísticas pré-computadas
    const totalInstances = slaStatus.length;
    const overdueInstances = slaStatus.filter((s) => s.is_overdue).length;
    const overduePct = totalInstances > 0 ? Math.round((overdueInstances / totalInstances) * 100) : 0;

    const overdueBySector: Record<string, { name: string; total: number; overdue: number }> = {};
    for (const s of slaStatus) {
      const key = s.sector_acronym ?? "—";
      overdueBySector[key] ??= { name: s.sector_name ?? key, total: 0, overdue: 0 };
      overdueBySector[key].total += 1;
      if (s.is_overdue) overdueBySector[key].overdue += 1;
    }
    const sectorOverduePct = Object.entries(overdueBySector).map(([acr, v]) => ({
      acronym: acr,
      name: v.name,
      total: v.total,
      overdue: v.overdue,
      pct: v.total > 0 ? Math.round((v.overdue / v.total) * 100) : 0,
    }));

    const announcementsByCategory: Record<string, number> = {};
    for (const a of announcements) {
      announcementsByCategory[a.category] = (announcementsByCategory[a.category] ?? 0) + 1;
    }

    const stepBottlenecks = avgDur
      .filter((a) => a.avg_hours !== null)
      .map((a) => ({
        step: a.step_name,
        avg_hours: a.avg_hours,
        avg_sla_hours: a.avg_sla_hours,
        samples: a.samples,
        over_sla: a.avg_sla_hours ? a.avg_hours > a.avg_sla_hours : false,
      }))
      .sort((a, b) => (b.avg_hours ?? 0) - (a.avg_hours ?? 0))
      .slice(0, 8);

    const logActionCounts: Record<string, number> = {};
    for (const l of logs) logActionCounts[l.action] = (logActionCounts[l.action] ?? 0) + 1;

    const dataset = {
      generated_at: new Date().toISOString(),
      summary: {
        total_sectors: sectors.length,
        total_announcements_recent: announcements.length,
        total_process_instances: totalInstances,
        overdue_instances: overdueInstances,
        overdue_percentage: overduePct,
      },
      sectors: sectors.map((s) => ({ name: s.name, acronym: s.acronym })),
      sector_overdue: sectorOverduePct,
      step_bottlenecks: stepBottlenecks,
      announcements_by_category: announcementsByCategory,
      overdue_top: overdue.slice(0, 8).map((o: any) => ({
        title: o.instance_title,
        sector: o.sector_acronym,
        process: o.process_code,
        overdue_steps: o.overdue_steps,
        current_step: o.current_step?.title ?? null,
      })),
      log_action_counts: logActionCounts,
    };

    // 3) Chama Lovable AI com tool calling (saída estruturada)
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content:
              "Analise o conjunto de dados operacionais a seguir e produza insights de comunicação integrada. " +
              "Retorne via tool call uma lista equilibrada de alertas, insights e sugestões.\n\nDADOS:\n" +
              JSON.stringify(dataset, null, 2),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "publish_insights",
              description: "Publica a lista final de insights inteligentes para o dashboard.",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    minItems: 3,
                    maxItems: 8,
                    items: {
                      type: "object",
                      properties: {
                        kind: { type: "string", enum: ["alert", "insight", "suggestion"] },
                        severity: {
                          type: "string",
                          enum: ["critical", "warning", "info", "positive"],
                        },
                        title: { type: "string", maxLength: 120 },
                        description: { type: "string", maxLength: 600 },
                        related_sectors: { type: "array", items: { type: "string" } },
                        metrics: { type: "object", additionalProperties: true },
                        framework_reference: { type: "string" },
                      },
                      required: ["kind", "severity", "title", "description", "related_sectors"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "publish_insights" } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI error", aiResp.status, text);
      if (aiResp.status === 429) return json({ error: "Rate limit. Tente novamente em alguns instantes." }, 429);
      if (aiResp.status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }, 402);
      return json({ error: "Falha ao consultar IA" }, 500);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: "IA não retornou estrutura esperada" }, 500);

    let parsed: { items: InsightItem[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return json({ error: "Falha ao interpretar resposta da IA" }, 500);
    }

    const items = (parsed.items ?? []).filter((i) => i?.title && i?.description);
    if (items.length === 0) return json({ error: "Nenhum insight gerado" }, 500);

    // 4) Persiste novo batch e remove batches anteriores (mantém somente o atual)
    const batchId = crypto.randomUUID();
    const rows = items.map((i) => ({
      batch_id: batchId,
      kind: i.kind,
      severity: i.severity,
      title: i.title,
      description: i.description,
      related_sectors: i.related_sectors ?? [],
      metrics: i.metrics ?? {},
      framework_reference: i.framework_reference ?? null,
    }));

    const { error: insertErr } = await admin.from("ai_insights").insert(rows);
    if (insertErr) {
      console.error("insert err", insertErr);
      return json({ error: "Falha ao salvar insights" }, 500);
    }

    // limpa batches antigos
    await admin.from("ai_insights").delete().neq("batch_id", batchId);

    return json({ ok: true, batch_id: batchId, count: rows.length, dataset_summary: dataset.summary });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
