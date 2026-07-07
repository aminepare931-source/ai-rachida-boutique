import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Retouche une photo produit en la ré-imaginant sur fond propre, mieux éclairée.
 * Utilise Gemini image edit via le AI Gateway. Retourne une data URL PNG.
 */
export const retouchProductPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      imageBase64: z.string().min(20), // data URL ou base64 pur
      productName: z.string().default("produit"),
      instruction: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY manquant");
    const clean = data.imageBase64.startsWith("data:") ? data.imageBase64 : `data:image/jpeg;base64,${data.imageBase64}`;
    const prompt = data.instruction
      || `Retouche photo produit e-commerce : fond blanc/beige neutre, lumière douce, couleurs vives et réalistes, cadrage centré, netteté, sans texte, sans logo. Produit : ${data.productName}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: clean } },
          ]},
        ],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gateway ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = await res.json() as { choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }> };
    const img = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!img) throw new Error("Aucune image générée");
    return { image: img };
  });
