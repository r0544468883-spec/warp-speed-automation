// Edge function: discover-automations
// Uses Lovable AI to find real automation articles/workflows from the web
// based on the user's tool stack. Caches results for 24h per (user, stack).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hashStack(tools: string[]): Promise<string> {
  const normalized = tools.map((t) => t.trim().toLowerCase()).sort().join("|");
  const buf = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { tool_stack, force_refresh } = await req.json();
    const tools: string[] = Array.isArray(tool_stack) ? tool_stack : [];

    if (tools.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], reason: "empty_stack" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Identify the calling user from the JWT (validate in code since verify_jwt=false)
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    let user: { id: string } | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabase.auth.getClaims(token);
      if (!error && data?.claims?.sub) {
        user = { id: data.claims.sub as string };
      }
    }

    const stackHash = await hashStack(tools);

    // Try cache first (unless force_refresh)
    if (user && !force_refresh) {
      const { data: cached } = await supabase
        .from("ai_recommendations_cache")
        .select("payload, expires_at")
        .eq("user_id", user.id)
        .eq("stack_hash", stackHash)
        .maybeSingle();

      if (cached && new Date(cached.expires_at) > new Date()) {
        return new Response(
          JSON.stringify({ ...(cached.payload as any), cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const toolsText = tools.join(", ");
    const seed = Math.floor(Math.random() * 100000);

    const systemPrompt = `אתה מומחה אוטומציה. החזר 8-12 המלצות לתהליכי אוטומציה אמיתיים מהרשת ש משתמש עם הכלים הבאים יכול ליישם: ${toolsText}.

חובה:
- כל URL חייב להיות אמיתי ופעיל. השתמש במקורות מובילים בלבד: n8n.io/workflows, community.n8n.io, make.com/templates, zapier.com/apps, medium.com, dev.to, blog.zapier.com, automation.community.
- העדף תהליכים שמצליבים בין שניים או יותר מהכלים של המשתמש.
- כתוב כותרת ותקציר בעברית.
- ציין trigger ו-action קצרים (באנגלית).
- ציין פלטפורמה מומלצת: n8n, Make או Zapier.
- כל המלצה חייבת להיות שונה. גוון בין המקורות. seed=${seed}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `הכלים שלי: ${toolsText}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_recommendations",
                description: "החזר רשימת המלצות אוטומציה מובנות",
                parameters: {
                  type: "object",
                  properties: {
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          url: { type: "string" },
                          source: { type: "string" },
                          snippet: { type: "string" },
                          platform: { type: "string", enum: ["n8n", "Make", "Zapier", "Other"] },
                          tools_used: { type: "array", items: { type: "string" } },
                          trigger: { type: "string" },
                          action: { type: "string" },
                          category: { type: "string" },
                        },
                        required: ["title", "url", "snippet", "platform", "tools_used"],
                      },
                    },
                  },
                  required: ["recommendations"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_recommendations" } },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: `AI ${response.status}: ${text.slice(0, 200)}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await response.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { recommendations: [] };
    const payload = { recommendations: args.recommendations || [] };

    // Save cache
    if (user && payload.recommendations.length > 0) {
      await supabase.from("ai_recommendations_cache").upsert({
        user_id: user.id,
        stack_hash: stackHash,
        payload,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "user_id,stack_hash" });
    }

    return new Response(
      JSON.stringify({ ...payload, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
