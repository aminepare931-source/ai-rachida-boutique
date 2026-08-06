import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { geminiModel } from "@/lib/ai-gateway.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type VisionBody = {
  shopSlug: string;
  conversationId?: string;
  imageDataUrl: string; // data:image/...;base64,...
  intent?: "payment_proof" | "product_photo" | "auto";
};

export const Route = createFileRoute("/api/public/rachida-vision")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async ({ request }) => {
        const body = (await request.json()) as VisionBody;
        if (!body?.shopSlug || !body?.imageDataUrl) {
          return new Response("bad request", { status: 400, headers: corsHeaders });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shops } = await supabaseAdmin
          .from("shops")
          .select("id, currency, name")
          .eq("slug", body.shopSlug)
          .order("created_at", { ascending: false })
          .limit(1);
        const shop = shops?.[0];
        if (!shop) return new Response("shop not found", { status: 404, headers: corsHeaders });

        const intent = body.intent ?? "auto";
        const prompt =
          intent === "payment_proof"
            ? `Tu analyses une capture d'écran de paiement Mobile Money (Orange Money, Moov Money, etc) au Burkina Faso. Extrais en JSON strict: {"montant": number|null, "devise": string|null, "operateur": string|null, "numero_transaction": string|null, "expediteur": string|null, "destinataire": string|null, "date": string|null, "valide": boolean, "raisons": string}. Réponds UNIQUEMENT le JSON.`
            : intent === "product_photo"
              ? `Tu analyses une photo de produit envoyée par un client. Décris en français court (1 phrase) le produit visible et propose 3 mots-clés pour rechercher dans un catalogue. Format JSON: {"description": string, "keywords": string[]}. Réponds UNIQUEMENT le JSON.`
              : `Tu analyses une image envoyée par un client d'une boutique en ligne. Détermine si c'est: (a) une preuve de paiement Mobile Money, (b) une photo de produit, (c) autre. Puis donne une description courte. Format JSON: {"type": "payment_proof"|"product_photo"|"other", "description": string}. Réponds UNIQUEMENT le JSON.`;

        let model;
        try {
          model = geminiModel();
        } catch {
          return new Response("missing key", { status: 500, headers: corsHeaders });
        }

        const result = await generateText({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image", image: body.imageDataUrl },
              ],
            },
          ],
        });

        let analysis: unknown = null;
        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.text };
        } catch {
          analysis = { raw: result.text };
        }

        // Persist if payment proof
        const a = analysis as Record<string, unknown>;
        if (intent === "payment_proof" || a?.type === "payment_proof") {
          await supabaseAdmin.from("payment_proofs").insert({
            shop_id: shop.id,
            conversation_id: body.conversationId ?? null,
            analysis: a as never,
            amount_detected: typeof a?.montant === "number" ? (a.montant as number) : null,
            status: a?.valide ? "valid" : "pending",
          });
        }

        return new Response(JSON.stringify({ analysis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      },
    },
  },
});
