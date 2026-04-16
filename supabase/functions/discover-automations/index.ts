// Edge function: discover-automations
// Uses Lovable AI to find real automation articles/workflows from the web
// based on the user's tool stack.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { tool_stack } = await req.json();
    const tools: string[] = Array.isArray(tool_stack) ? tool_stack : [];

    if (tools.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], reason: "empty_stack" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `הכלים שלי: ${toolsText}. תן לי 10 המלצות אוטומציה מותאמות.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_recommendations",
                description: "Return automation recommendations",
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
                          platform: {
                            type: "string",
                            enum: ["n8n", "Make", "Zapier", "Other"],
                          },
                          tools_used: {
                            type: "array",
                            items: { type: "string" },
                          },
                          trigger: { type: "string" },
                          action: { type: "string" },
                          category: { type: "string" },
                        },
                        required: [
                          "title",
                          "url",
                          "snippet",
                          "platform",
                          "tools_used",
                        ],
                      },
                    },
                  },
                  required: ["recommendations"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_recommendations" },
          },
        }),
      }
    );

    if (!response.ok) {
      const txt = await response.text();
      console.error("AI error:", response.status, txt);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "חרגת ממגבלת הבקשות, נסה שוב בעוד דקה" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום — הוסף קרדיטים ל-Lovable AI" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`AI gateway: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let recommendations: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        recommendations = parsed.recommendations || [];
      } catch (e) {
        console.error("parse error:", e);
      }
    }

    return new Response(
      JSON.stringify({ recommendations, generated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("discover-automations error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
