import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Generate a marketing flyer/poster image from a text brief.
 * Uses Gemini image via the Lovable AI Gateway. Returns a data URL PNG.
 */
export const generateFlyer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      style: z.enum(["moderne", "africain", "luxe", "fun", "minimal"]).default("moderne"),
      colors: z.string().optional(),
      whatsapp: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY manquant");

    const prompt = `Affiche marketing / flyer promotionnel pour une boutique en Afrique de l'Ouest.
Style : ${data.style}. Format vertical 9:16 pour statut WhatsApp / Instagram Story.
Titre bien lisible : "${data.title}"${data.subtitle ? `\nSous-titre : "${data.subtitle}"` : ""}${data.colors ? `\nCouleurs dominantes : ${data.colors}` : ""}${data.whatsapp ? `\nInclure discrètement WhatsApp : ${data.whatsapp}` : ""}.
Typographie moderne, contrastée, hiérarchie claire. Composition professionnelle, prête à publier. Aucune faute d'orthographe.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gateway ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = (await res.json()) as { choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }> };
    const img = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!img) throw new Error("Aucune image générée");
    return { image: img };
  });

/**
 * Generate a voice message from Rachida (for sending on WhatsApp).
 * Uses OpenAI TTS via the Lovable AI Gateway. Returns base64 MP3.
 */
export const generateVoiceReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      text: z.string().min(1).max(1500),
      voice: z.string().default("alloy"),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY manquant");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice,
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`TTS ${res.status}: ${t.slice(0, 200)}`);
    }
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return { audio: `data:audio/mpeg;base64,${b64}` };
  });
