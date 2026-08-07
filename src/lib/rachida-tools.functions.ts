import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { geminiModel, noThinking } from "@/lib/ai-gateway.server";
import { generateText } from "ai";

async function ask(system: string, prompt: string): Promise<string> {
  const { text } = await generateText({ model: geminiModel(), system, prompt, temperature: 0.85, providerOptions: noThinking });
  return text.trim();
}

/* -------------------------------------------------------------------------- */
/* 1. Product description                                                     */
/* -------------------------------------------------------------------------- */
export const generateProductDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    name: z.string().min(1),
    category: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().default("FCFA"),
    tone: z.enum(["chaleureux", "pro", "fun", "luxe"]).default("chaleureux"),
    lang: z.enum(["fr", "moore", "dioula"]).default("fr"),
  }).parse(i))
  .handler(async ({ data }) => {
    const system = `Tu es Rachida, copywriter e-commerce pour boutiques d'Afrique de l'Ouest. Ton ${data.tone}. Écris en ${data.lang === "fr" ? "français simple" : data.lang}. Pas de superlatif creux, pas d'emoji excessif (max 2).`;
    const prompt = `Rédige une fiche produit vendeuse (3 parties, 90 mots max total) :\n1. Accroche 1 ligne\n2. Description avec 2-3 bénéfices concrets\n3. Appel à l'action court\n\nProduit : ${data.name}${data.category ? " • Catégorie : " + data.category : ""}${data.price ? " • Prix : " + data.price + " " + data.currency : ""}.`;
    return { text: await ask(system, prompt) };
  });

/* -------------------------------------------------------------------------- */
/* 2. Social post (WhatsApp status / FB / Insta / TikTok)                     */
/* -------------------------------------------------------------------------- */
export const generateSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    platform: z.enum(["whatsapp", "facebook", "instagram", "tiktok"]),
    topic: z.string().min(1),
    shopName: z.string().optional(),
    whatsapp: z.string().optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const rules: Record<string, string> = {
      whatsapp: "1 statut WhatsApp très court (max 40 mots), 1 emoji, appel à réagir. Termine par 'Écris-moi 👉' + numéro.",
      facebook: "1 post Facebook (60-100 mots), 3 emojis max, question à la fin pour engager les commentaires.",
      instagram: "1 caption Instagram (80 mots), storytelling personnel court, 5 hashtags locaux pertinents à la fin.",
      tiktok: "1 script TikTok de 15 secondes, format hook + révélation + CTA. Marque les moments (0s / 5s / 12s).",
    };
    const system = `Tu es community manager pour ${data.shopName || "une boutique locale"} en Afrique de l'Ouest. Français vivant, jamais générique.`;
    const prompt = `Sujet : ${data.topic}\nContact WhatsApp : ${data.whatsapp || "(non fourni)"}\n\n${rules[data.platform]}`;
    return { text: await ask(system, prompt) };
  });

/* -------------------------------------------------------------------------- */
/* 3. Promo / campagne                                                        */
/* -------------------------------------------------------------------------- */
export const generatePromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    context: z.string().min(1),
    goal: z.enum(["deblocker_stock", "attirer_nouveaux", "fideliser", "fete"]).default("attirer_nouveaux"),
  }).parse(i))
  .handler(async ({ data }) => {
    const system = "Tu es stratège promo pour petits commerces africains. Propose des mécaniques réalistes, marges protégées.";
    const prompt = `Contexte boutique : ${data.context}\nObjectif : ${data.goal}\n\nDonne :\n1. Nom accrocheur de la promo\n2. Mécanique claire (ex : -20% le samedi, 2+1 gratuit, code parrainage)\n3. Message WhatsApp de lancement (60 mots)\n4. Durée conseillée\n5. Comment éviter de rogner la marge`;
    return { text: await ask(system, prompt) };
  });

/* -------------------------------------------------------------------------- */
/* 4. Suggest a competitive price                                             */
/* -------------------------------------------------------------------------- */
export const suggestPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    product: z.string().min(1),
    cost: z.number().optional(),
    currency: z.string().default("FCFA"),
    market: z.string().default("Burkina Faso"),
  }).parse(i))
  .handler(async ({ data }) => {
    const system = "Tu es expert pricing pour marchés d'Afrique de l'Ouest. Donne des fourchettes de prix réalistes en FCFA.";
    const prompt = `Produit : ${data.product}\nMarché : ${data.market}\nCoût de revient : ${data.cost ? data.cost + " " + data.currency : "non fourni"}\n\nDonne 3 niveaux de prix (entrée / cœur de gamme / premium) avec justification courte pour chaque, et le prix conseillé. Format bref.`;
    return { text: await ask(system, prompt) };
  });

/* -------------------------------------------------------------------------- */
/* 5. Reply to a review / customer complaint                                  */
/* -------------------------------------------------------------------------- */
export const generateReviewReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    review: z.string().min(1),
    stars: z.number().min(1).max(5).default(3),
    shopName: z.string().optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const system = `Tu réponds au nom de ${data.shopName || "la boutique"}. Ton chaleureux, jamais agressif, jamais robotique. Français simple.`;
    const prompt = `Avis client (${data.stars}★) : "${data.review}"\n\nRédige une réponse publique (80 mots max) : remerciement, prise en compte du point, solution ou invitation à échanger en privé si négatif.`;
    return { text: await ask(system, prompt) };
  });

/* -------------------------------------------------------------------------- */
/* 6. Daily business tip based on the shop                                    */
/* -------------------------------------------------------------------------- */
export const dailyBusinessTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    shopName: z.string().optional(),
    productsSample: z.array(z.string()).optional(),
  }).parse(i))
  .handler(async ({ data }) => {
    const system = "Tu es Rachida, mentor business quotidien. Donne UN conseil concret et actionnable aujourd'hui, adapté aux petits commerces africains.";
    const prompt = `Boutique : ${data.shopName || "(sans nom)"}\nQuelques produits : ${(data.productsSample || []).slice(0, 5).join(", ") || "inconnus"}\n\nDonne : conseil du jour (50 mots) + 1 action précise à faire avant ce soir.`;
    return { text: await ask(system, prompt) };
  });
