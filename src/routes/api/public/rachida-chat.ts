import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatBody = {
  shopSlug: string;
  conversationId?: string;
  clientName?: string;
  clientContact?: string;
  emotion?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
};

function detectEmotion(text: string): string {
  const t = text.toLowerCase();
  if (/(merci|super|génial|parfait|content|heureux|aime|j'adore|trop bien)/.test(t)) return "positif";
  if (/(énervé|nul|déçu|colère|fâché|arnaque|honte|jamais|horrible|mauvais)/.test(t)) return "négatif";
  if (/(triste|fatigué|peur|inquiet|stress|angoiss)/.test(t)) return "triste";
  if (/(\?|comment|où|quand|combien|aide)/.test(t)) return "questionneur";
  return "neutre";
}

function extractCriteria(msg: string) {
  const lower = msg.toLowerCase();
  const c: { priceMax?: number; priceMin?: number; gender?: string; color?: string; category?: string; keywords: string[] } = { keywords: [] };
  const pMax = lower.match(/moins de\s*([\d\s]+)/) || lower.match(/max(?:imum)?\s*([\d\s]+)/);
  if (pMax) c.priceMax = parseInt(pMax[1].replace(/\s/g, ""));
  const pMin = lower.match(/plus de\s*([\d\s]+)/);
  if (pMin) c.priceMin = parseInt(pMin[1].replace(/\s/g, ""));
  if (/\bhomme\b/.test(lower)) c.gender = "homme";
  if (/\bfemme\b/.test(lower)) c.gender = "femme";
  if (/enfant/.test(lower)) c.gender = "enfant";
  const colors = ["rouge", "bleu", "vert", "noir", "blanc", "jaune", "rose", "violet", "gris", "orange", "marron"];
  for (const col of colors) if (lower.includes(col)) { c.color = col; break; }
  c.keywords = lower.split(/\W+/).filter((w) => w.length > 3).slice(0, 8);
  return c;
}

export const Route = createFileRoute("/api/public/rachida-chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        if (!body?.shopSlug || !Array.isArray(body.messages)) {
          return new Response("bad request", { status: 400, headers: corsHeaders });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("missing key", { status: 500, headers: corsHeaders });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shop } = await supabaseAdmin
          .from("shops")
          .select("*")
          .eq("slug", body.shopSlug)
          .maybeSingle();
        if (!shop) return new Response("shop not found", { status: 404, headers: corsHeaders });

        const lastUser = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const criteria = extractCriteria(lastUser);
        const emotion = detectEmotion(lastUser);

        // Filter catalog
        let q = supabaseAdmin.from("products").select("name, description, price, category, gender, color, stock").eq("shop_id", shop.id).eq("is_active", true);
        if (criteria.priceMax) q = q.lte("price", criteria.priceMax);
        if (criteria.priceMin) q = q.gte("price", criteria.priceMin);
        if (criteria.gender) q = q.eq("gender", criteria.gender);
        if (criteria.color) q = q.ilike("color", `%${criteria.color}%`);
        const { data: products } = await q.limit(15);

        // Conversation persistence
        let conversationId = body.conversationId;
        if (!conversationId) {
          const { data: conv } = await supabaseAdmin
            .from("conversations")
            .insert({
              shop_id: shop.id,
              client_name: body.clientName ?? null,
              client_contact: body.clientContact ?? null,
              emotion,
            })
            .select("id")
            .single();
          conversationId = conv?.id;
        } else {
          await supabaseAdmin
            .from("conversations")
            .update({ emotion, client_name: body.clientName, client_contact: body.clientContact })
            .eq("id", conversationId);
        }
        if (conversationId && lastUser) {
          await supabaseAdmin.from("messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: lastUser,
          });
        }

        const catalogText = products && products.length
          ? products.map((p) => `- ${p.name} | ${p.price} ${shop.currency} | ${p.category ?? ""} ${p.gender ?? ""} ${p.color ?? ""} | stock:${p.stock}${p.description ? ` | ${p.description}` : ""}`).join("\n")
          : "(aucun produit ne correspond exactement, propose une alternative et demande des précisions)";

        const systemPrompt = `Tu es ${shop.rachida_name}, vendeuse IA chaleureuse et professionnelle de la boutique "${shop.name}" au Burkina Faso.
Tu parles français naturel, chaleureux, avec parfois une touche locale ("akwaaba", "yaa son barka") sans en abuser.
Émotion détectée du client : ${emotion}. Adapte ton ton (rassurer si négatif, encourager si positif).
Devise : ${shop.currency}. Remise maximum autorisée : ${shop.max_remise}%.
WhatsApp boutique : ${shop.whatsapp ?? "non configuré"}.

CATALOGUE FILTRÉ POUR CE MESSAGE :
${catalogText}

RÈGLES :
- Recommande 1 à 3 produits maximum à la fois, avec nom + prix.
- Si le client veut commander, demande nom et numéro WhatsApp.
- Si la question dépasse tes compétences, propose le transfert WhatsApp humain : "${shop.whatsapp ?? ""}".
- Reste concise (2-4 phrases max sauf si une liste est demandée).
${shop.system_prompt_extra ?? ""}`;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...body.messages.map((m) => ({ role: m.role, content: m.content })),
          ] as ModelMessage[],
          onFinish: async ({ text }) => {
            if (conversationId && text) {
              await supabaseAdmin.from("messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: text,
              });
            }
          },
        });

        return result.toTextStreamResponse({
          headers: {
            ...corsHeaders,
            "X-Conversation-Id": conversationId ?? "",
            "X-Emotion": emotion,
            "Access-Control-Expose-Headers": "X-Conversation-Id, X-Emotion",
          },
        });
      },
    },
  },
});
