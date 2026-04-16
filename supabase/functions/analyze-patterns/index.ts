import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, events } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `אתה יועץ אוטומציה מומחה של מערכת 24.7 AUTOMATION.
תפקידך לנתח דפוסי עבודה חוזרים ולהמליץ על אוטומציות.

כללים:
- תמיד המלץ על פלטפורמה (n8n, Make, או Zapier)
- תן הסבר קצר בעברית
- ציין את הכלים המעורבים (toolFrom, toolTo)
- דרג לפי עדיפות
- הוסף הערכת זמן שנחסך

ענה בפורמט JSON מובנה באמצעות הפונקציה שזמינה לך.`;

    let userContent = "";
    if (description) {
      userContent = `המשתמש מתאר קושי: "${description}"\nאנא הצע 3 אוטומציות רלוונטיות.`;
    } else if (events && events.length > 0) {
      userContent = `הנה אירועים שנלכדו מפעילות המשתמש:\n${JSON.stringify(events.slice(0, 20))}\nנתח את הדפוסים והצע 3 אוטומציות.`;
    } else {
      userContent = "הצע 3 אוטומציות פופולריות למשתמש חדש בתחום הטכנולוגיה.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_automations",
              description: "Return automation suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        toolFrom: { type: "string" },
                        toolTo: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string" },
                        platform: { type: "string", enum: ["n8n", "make", "zapier"] },
                        estimatedTimeSaved: { type: "string" },
                      },
                      required: ["toolFrom", "toolTo", "description", "category", "platform"],
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_automations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד דקה" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש חידוש מנוי" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(args), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-patterns error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
