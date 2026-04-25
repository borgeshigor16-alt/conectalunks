// Analisa um feedback recém-enviado: classifica sentimento, gera tags e resumo
// curto. Usa Lovable AI (Gemini) com tool calling para saída estruturada.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `Você é um analista de comunicação interna especializado em feedback corporativo.
Sua tarefa: classificar o sentimento de um comentário (positivo/neutro/negativo), extrair de 1 a 4 tags curtas (sem emojis, em português, minúsculas, sem hashtags) e produzir um resumo objetivo em 1 frase (máx. 140 caracteres).
Considere também as notas (1-5) atribuídas a clareza, alinhamento e satisfação como contexto.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const { feedback_id } = await req.json().catch(() => ({}));
    if (!feedback_id || typeof feedback_id !== "string") {
      return json({ error: "feedback_id obrigatório" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ error: "AI não configurada" }, 500);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: fb, error: fbErr } = await admin
      .from("feedbacks")
      .select("id, created_by, comment, clarity_score, alignment_score, satisfaction_score, target_kind")
      .eq("id", feedback_id)
      .maybeSingle();

    if (fbErr || !fb) return json({ error: "Feedback não encontrado" }, 404);
    if (fb.created_by !== userData.user.id) {
      // permite admin reanalisar
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) return json({ error: "Sem permissão" }, 403);
    }

    // Sem comentário: deriva sentimento das notas (sem chamar IA)
    const scores = [fb.clarity_score, fb.alignment_score, fb.satisfaction_score].filter(
      (v): v is number => typeof v === "number",
    );
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    if (!fb.comment || fb.comment.trim().length < 3) {
      const sentiment = avg === null ? "neutral" : avg >= 4 ? "positive" : avg <= 2 ? "negative" : "neutral";
      await admin
        .from("feedbacks")
        .update({
          sentiment,
          sentiment_confidence: 0.4,
          ai_tags: [],
          ai_summary: avg !== null ? `Avaliação média ${avg.toFixed(1)}/5 sem comentário.` : null,
        })
        .eq("id", feedback_id);
      return json({ ok: true, sentiment, source: "scores_only" });
    }

    const userPrompt = JSON.stringify({
      target: fb.target_kind,
      scores: {
        clarity: fb.clarity_score,
        alignment: fb.alignment_score,
        satisfaction: fb.satisfaction_score,
      },
      comment: fb.comment.slice(0, 2000),
    });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_feedback",
              description: "Classifica o feedback corporativo.",
              parameters: {
                type: "object",
                properties: {
                  sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  tags: { type: "array", items: { type: "string" }, minItems: 0, maxItems: 4 },
                  summary: { type: "string", maxLength: 160 },
                },
                required: ["sentiment", "confidence", "tags", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_feedback" } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI error", aiResp.status, text);
      if (aiResp.status === 429) return json({ error: "Rate limit. Tente novamente." }, 429);
      if (aiResp.status === 402) return json({ error: "Créditos de IA esgotados." }, 402);
      return json({ error: "Falha ao consultar IA" }, 500);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: "IA não retornou estrutura esperada" }, 500);

    const parsed = JSON.parse(toolCall.function.arguments) as {
      sentiment: "positive" | "neutral" | "negative";
      confidence: number;
      tags: string[];
      summary: string;
    };

    const cleanedTags = (parsed.tags ?? [])
      .map((t) => t.trim().toLowerCase().replace(/^#+/, ""))
      .filter((t) => t.length > 0 && t.length <= 32)
      .slice(0, 4);

    const { error: updErr } = await admin
      .from("feedbacks")
      .update({
        sentiment: parsed.sentiment,
        sentiment_confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
        ai_tags: cleanedTags,
        ai_summary: parsed.summary?.slice(0, 160) ?? null,
      })
      .eq("id", feedback_id);

    if (updErr) {
      console.error("update err", updErr);
      return json({ error: "Falha ao salvar análise" }, 500);
    }

    return json({ ok: true, sentiment: parsed.sentiment, tags: cleanedTags });
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
