import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { geminiModel } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  shopId: z.string().uuid(),
  mode: z.enum(["text", "image"]),
  text: z.string().max(20000).optional(),
  imageDataUrl: z.string().max(8_000_000).optional(),
});

type ExtractedProduct = {
  name: string;
  price: number;
  category?: string | null;
  gender?: string | null;
  color?: string | null;
  stock?: number | null;
  description?: string | null;
  image_url?: string | null;
};

const SYSTEM = `Tu es Rachida, assistante d'un commerçant au Burkina Faso. Tu reçois soit un texte libre (liste WhatsApp, message vocal transcrit, note brouillon en français, mooré, dioula, anglais), soit une photo (liste de prix manuscrite, étiquette, capture d'écran, ou photo d'un produit).

Ta tâche : extraire une LISTE de produits pour un catalogue e-commerce.

Règles :
- Devine intelligemment. Si le prix est "5000f", "5 000 FCFA", "5k", "5.000" → 5000.
- Si aucun prix n'est explicite, mets price: 0.
- Nom court et vendeur (max 60 caractères).
- category : "vêtement", "chaussure", "cosmétique", "nourriture", "électronique", "accessoire", "artisanat", "autre".
- gender : "homme", "femme", "enfant", "unisexe", ou null.
- stock : entier si mentionné, sinon 1.
- description : 1 phrase attrayante que Rachida dira au client.
- Ignore le blabla, extrais seulement les produits.

Réponds UNIQUEMENT en JSON strict, sans markdown :
{"products":[{"name":"...","price":5000,"category":"...","gender":null,"color":null,"stock":1,"description":"..."}]}`;

export const smartImportProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify shop ownership
    const { data: shops, error: shopErr } = await supabase
      .from("shops")
      .select("id, owner_id")
      .eq("id", data.shopId)
      .eq("owner_id", userId)
      .limit(1);
    if (shopErr) throw new Error(shopErr.message);
    if (!shops?.[0]) throw new Error("Boutique introuvable ou non autorisée");

    const userContent =
      data.mode === "image" && data.imageDataUrl
        ? [
            { type: "text" as const, text: "Extrais tous les produits de cette image." },
            { type: "image" as const, image: data.imageDataUrl },
          ]
        : [{ type: "text" as const, text: data.text ?? "" }];

    const result = await generateText({
      model: geminiModel(),
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userContent },
      ],
    });

    let parsed: { products?: ExtractedProduct[] } = {};
    try {
      const match = result.text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    } catch {
      parsed = {};
    }

    const products = (parsed.products ?? [])
      .filter((p) => p && typeof p.name === "string" && p.name.trim())
      .map((p) => ({
        name: String(p.name).slice(0, 120),
        price: Number(p.price) || 0,
        category: p.category ?? null,
        gender: p.gender ?? null,
        color: p.color ?? null,
        stock: Number(p.stock ?? 1) || 0,
        description: p.description ?? null,
        image_url: p.image_url ?? null,
      }));

    return { products };
  });

export const saveImportedProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        shopId: z.string().uuid(),
        products: z.array(
          z.object({
            name: z.string().min(1).max(200),
            price: z.number().min(0),
            category: z.string().nullable().optional(),
            gender: z.string().nullable().optional(),
            color: z.string().nullable().optional(),
            stock: z.number().int().min(0).nullable().optional(),
            description: z.string().nullable().optional(),
            image_url: z.string().nullable().optional(),
          }),
        ).min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: shops } = await supabase
      .from("shops")
      .select("id")
      .eq("id", data.shopId)
      .eq("owner_id", userId)
      .limit(1);
    if (!shops?.[0]) throw new Error("Boutique introuvable");

    const rows = data.products.map((p) => ({
      shop_id: data.shopId,
      name: p.name,
      price: p.price,
      category: p.category ?? null,
      gender: p.gender ?? null,
      color: p.color ?? null,
      stock: p.stock ?? 1,
      description: p.description ?? null,
      image_url: p.image_url ?? null,
      is_active: true,
    }));
    const { error } = await supabase.from("products").insert(rows);
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });
