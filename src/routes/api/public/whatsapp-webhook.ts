import { createFileRoute } from "@tanstack/react-router";

// Webhook WhatsApp Business (Cloud API Meta). Deux rôles :
//   GET  → poignée de vérification exigée par Meta à la configuration du webhook.
//   POST → message entrant d'un client final, sur le numéro WhatsApp du commerçant.
//
// Important : ce fichier NE RÉÉCRIT PAS le cerveau IA. Il transforme le message
// WhatsApp en un appel HTTP interne vers /api/public/rachida-chat (déjà testé et
// fonctionnel), récupère la réponse texte, puis l'envoie via l'API WhatsApp. Ça évite
// de dupliquer ~300 lignes de logique (prompt, catalogue, FAQ, scoring de leads...)
// et le risque de régression que ça introduirait.

const GRAPH_API_VERSION = "v21.0";

type WhatsAppWebhookPayload = {
  entry?: {
    id: string;
    changes?: {
      field: string;
      value?: {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: { profile?: { name?: string }; wa_id: string }[];
        messages?: {
          from: string;
          id: string;
          type: string;
          text?: { body: string };
        }[];
      };
    }[];
  }[];
};

type MessageRow = { role: "user" | "assistant" | "system"; content: string };

async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[whatsapp-webhook] Échec envoi message", res.status, errBody);
  }
}

export const Route = createFileRoute("/api/public/whatsapp-webhook")({
  server: {
    handlers: {
      // Vérification du webhook, faite une fois par Meta au moment de la config.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
          return new Response(challenge ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        // Toujours répondre 200 rapidement à Meta, même en cas d'erreur de notre
        // côté — sinon Meta considère le webhook en échec et réessaie en boucle.
        try {
          const payload = (await request.json()) as WhatsAppWebhookPayload;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          for (const entry of payload.entry ?? []) {
            for (const change of entry.changes ?? []) {
              if (change.field !== "messages") continue;
              const value = change.value;
              const phoneNumberId = value?.metadata?.phone_number_id;
              const incoming = value?.messages?.[0];
              if (!phoneNumberId || !incoming) continue; // ex: accusé de lecture, pas un message
              if (incoming.type !== "text" || !incoming.text?.body) continue; // MVP : texte seulement

              const customerWaId = incoming.from;
              const customerName = value?.contacts?.[0]?.profile?.name ?? null;
              const userText = incoming.text.body;

              // 1. Retrouver la boutique + les identifiants WhatsApp à partir du numéro
              const { data: connections } = await supabaseAdmin
                .from("whatsapp_connections")
                .select("shop_id, access_token")
                .eq("phone_number_id", phoneNumberId)
                .limit(1);
              const connection = connections?.[0];
              if (!connection) {
                console.error("[whatsapp-webhook] Aucune boutique connectée pour ce numéro", phoneNumberId);
                continue;
              }

              const { data: shops } = await supabaseAdmin
                .from("shops")
                .select("slug")
                .eq("id", connection.shop_id)
                .limit(1);
              const shopSlug = shops?.[0]?.slug;
              if (!shopSlug) continue;

              // 2. Retrouver ou créer la conversation pour ce client (par numéro WhatsApp)
              const { data: existingConvs } = await supabaseAdmin
                .from("conversations")
                .select("id")
                .eq("shop_id", connection.shop_id)
                .eq("client_contact", customerWaId)
                .order("created_at", { ascending: false })
                .limit(1);
              let conversationId = existingConvs?.[0]?.id as string | undefined;

              let history: MessageRow[] = [];
              if (conversationId) {
                const { data: pastMessages } = await supabaseAdmin
                  .from("messages")
                  .select("role, content")
                  .eq("conversation_id", conversationId)
                  .order("created_at", { ascending: true })
                  .limit(30);
                history = (pastMessages ?? []) as MessageRow[];
              }

              // 3. Appeler le cerveau IA existant (même endpoint que le widget web)
              const origin = new URL(request.url).origin;
              const chatRes = await fetch(`${origin}/api/public/rachida-chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  shopSlug,
                  mode: "storefront",
                  conversationId,
                  clientName: customerName,
                  clientContact: customerWaId,
                  messages: [...history, { role: "user", content: userText }],
                }),
              });

              const replyText = await chatRes.text();
              conversationId = chatRes.headers.get("X-Conversation-Id") || conversationId;

              // 4. Renvoyer la réponse au client sur WhatsApp
              if (replyText) {
                await sendWhatsAppMessage(phoneNumberId, connection.access_token, customerWaId, replyText);
              }
            }
          }
        } catch (err) {
          console.error("[whatsapp-webhook] Erreur de traitement", err);
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
      },
    },
  },
});
