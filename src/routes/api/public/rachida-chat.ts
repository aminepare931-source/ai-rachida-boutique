import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { geminiModel, GENEROUS_MAX_TOKENS } from "@/lib/ai-gateway.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatBody = {
  shopSlug: string;
  mode?: "storefront" | "platform" | "admin";
  conversationId?: string;
  clientName?: string;
  clientContact?: string;
  parentUrl?: string | null;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
};

type CustomerProfileRow = { customer_name: string | null; language: string | null; budget_max: number | null; notes: string | null; total_conversations: number | null };
type SiteProduct = { name: string; price?: number; image?: string; description?: string };
type SiteInfo = { title?: string; description?: string; og_image?: string; products?: SiteProduct[] };


function detectEmotion(text: string): string {
  const t = text.toLowerCase();
  if (/(merci|super|génial|parfait|content|heureux|aime|j'adore|trop bien)/.test(t)) return "positif";
  if (/(énervé|nul|déçu|colère|fâché|arnaque|honte|jamais|horrible|mauvais)/.test(t)) return "négatif";
  if (/(triste|fatigué|peur|inquiet|stress|angoiss)/.test(t)) return "triste";
  if (/(\?|comment|où|quand|combien|aide)/.test(t)) return "questionneur";
  return "neutre";
}

function detectLanguage(text: string): string {
  const t = text.toLowerCase();
  // crude detection — Mooré markers
  if (/(yaa son|barka|nesongo|ne y windga|ne y zaabre|wend|naaba|ka beoogo)/.test(t)) return "moore";
  // Dioula markers
  if (/(i ni ce|i ni sogoma|i ni tile|aw ni ce|n'be|baara|donni)/.test(t)) return "dioula";
  return "fr";
}

function scoreLead(messages: { role: string; content: string }[]): { score: number; reasons: string } {
  const userText = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase()).join(" ");
  let score = 1;
  const reasons: string[] = [];
  if (/(prix|combien|coute|coûte|coût)/.test(userText)) { score += 2; reasons.push("intérêt prix"); }
  if (/(commander|acheter|prends|prends-le|je veux|j'achete)/.test(userText)) { score += 4; reasons.push("intention achat"); }
  if (/(livraison|livrer|adresse|quand)/.test(userText)) { score += 2; reasons.push("logistique"); }
  if (/(\+?\d[\d\s]{6,})/.test(userText)) { score += 1; reasons.push("contact partagé"); }
  if (/(reflechir|réfléchir|peut-etre|plus tard|trop cher)/.test(userText)) { score -= 1; reasons.push("hésitation"); }
  if (messages.filter((m) => m.role === "user").length > 5) { score += 1; reasons.push("engagement conversation"); }
  score = Math.max(1, Math.min(10, score));
  return { score, reasons: reasons.join(", ") || "exploration" };
}

function extractCriteria(msg: string) {
  const lower = msg.toLowerCase();
  const c: { priceMax?: number; priceMin?: number; gender?: string; color?: string; keywords: string[] } = { keywords: [] };
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

async function checkRateLimit(ip: string, endpoint: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const windowStart = new Date(Math.floor(Date.now() / 60000) * 60000).toISOString();
  const { data: rows } = await supabaseAdmin
    .from("rate_limits")
    .select("count")
    .eq("ip", ip)
    .eq("endpoint", endpoint)
    .eq("window_start", windowStart)
    .limit(1);
  const data = rows?.[0];
  if (data && data.count >= 30) return false;
  if (data) {
    await supabaseAdmin
      .from("rate_limits")
      .update({ count: data.count + 1 })
      .eq("ip", ip).eq("endpoint", endpoint).eq("window_start", windowStart);
  } else {
    await supabaseAdmin.from("rate_limits").insert({ ip, endpoint, window_start: windowStart, count: 1 });
  }
  return true;
}

function money(n: number | null | undefined, currency = "FCFA") {
  return `${Math.round(n ?? 0).toLocaleString("fr-FR")} ${currency}`;
}

async function getAdminContext(supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"], shop: { id: string; currency: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [convsToday, convsTotal, ordersToday, ordersTotal, hotLeads, products, latestConvs, views] = await Promise.all([
    supabaseAdmin.from("conversations").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).gte("created_at", todayIso),
    supabaseAdmin.from("conversations").select("id", { count: "exact", head: true }).eq("shop_id", shop.id),
    supabaseAdmin.from("orders").select("id,total,status,client_name,client_contact,created_at").eq("shop_id", shop.id).gte("created_at", todayIso).order("created_at", { ascending: false }),
    supabaseAdmin.from("orders").select("id,total,status,client_name,client_contact,created_at").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(80),
    supabaseAdmin.from("lead_scores").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).gte("score", 7),
    supabaseAdmin.from("products").select("id,name,price,stock,category,description,is_active").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(30),
    supabaseAdmin.from("conversations").select("id,client_name,client_contact,emotion,created_at").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(8),
    supabaseAdmin.from("product_views").select("product_id, products(name)").eq("shop_id", shop.id).limit(120),
  ]);

  const todayRevenue = (ordersToday.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
  const totalRevenue = (ordersTotal.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
  const productRows = products.data ?? [];
  const lowStock = productRows.filter((p) => Number(p.stock ?? 0) <= 3 && p.is_active).slice(0, 8);
  const viewCounts: Record<string, number> = {};
  type ViewRow = { products: { name: string } | { name: string }[] | null };
  ((views.data ?? []) as ViewRow[]).forEach((v) => {
    const prod = Array.isArray(v.products) ? v.products[0] : v.products;
    if (prod?.name) viewCounts[prod.name] = (viewCounts[prod.name] ?? 0) + 1;
  });
  const topViewed = Object.entries(viewCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `DONNÉES BUSINESS DISPONIBLES POUR LE DASHBOARD :
- Chiffre d'affaires aujourd'hui : ${money(todayRevenue, shop.currency)}
- Commandes aujourd'hui : ${ordersToday.data?.length ?? 0}
- Conversations aujourd'hui : ${convsToday.count ?? 0}
- Chiffre d'affaires total connu : ${money(totalRevenue, shop.currency)}
- Commandes totales connues : ${ordersTotal.data?.length ?? 0}
- Conversations totales : ${convsTotal.count ?? 0}
- Leads chauds (score >= 7) : ${hotLeads.count ?? 0}
- Produits au catalogue : ${productRows.length}
- Produits stock bas : ${lowStock.map((p) => `${p.name} (${p.stock})`).join(", ") || "aucun dans les 30 derniers produits"}
- Produits les plus consultés : ${topViewed.map(([name, n]) => `${name} (${n} vues)`).join(", ") || "pas encore de vues"}
- Dernières commandes : ${(ordersToday.data ?? []).slice(0, 5).map((o) => `${o.client_name ?? "client"} · ${money(Number(o.total), shop.currency)} · ${o.status}`).join(" | ") || "aucune aujourd'hui"}
- Dernières conversations : ${(latestConvs.data ?? []).map((c) => `${c.client_name ?? "Anonyme"} · ${c.emotion ?? "neutre"}`).join(" | ") || "aucune"}
- Extraits catalogue utiles : ${productRows.slice(0, 12).map((p) => `${p.name} (${money(Number(p.price), shop.currency)}, stock ${p.stock})`).join(" | ") || "catalogue vide"}`;
}

function platformPrompt(emotion: string) {
  return `Tu es Rachida, l'assistante officielle de la plateforme Rachida AI, pas la vendeuse de la Boutique Démo.
Tu réponds aux visiteurs entrepreneurs qui veulent comprendre le SaaS.
Interdiction de parler du catalogue démo, sac, boubou, karité, etc sauf si on te demande explicitement une démonstration boutique.
Ne commence jamais par "Yaa son barka". Utilise un français clair, professionnel, naturel.
Émotion détectée : ${emotion}. Adapte ton ton.

CE QUE TU SAIS SUR RACHIDA AI :
- Rachida AI est une vendeuse IA pour entreprises, boutiques et entrepreneurs du Burkina Faso et d'Afrique francophone.
- Elle s'intègre sur un site, une page boutique offerte, WhatsApp ou des plateformes no-code.
- Elle apprend le catalogue, prix, stock, FAQ, règles de remise, ton de marque et contacts.
- Elle conseille les clients, recommande les produits, négocie dans les limites autorisées, suit les leads, détecte l'émotion, analyse les images/preuves Mobile Money et aide à augmenter les ventes.
- Le dashboard permet de voir conversations, leads chauds, commandes, chiffre d'affaires, catalogue, FAQ, diagnostic d'installation et page boutique offerte.
- Pour les non-développeurs : lien boutique offert, invitation webmaster, guide WordPress/Wix/Shopify/Webflow/Squarespace, diagnostic automatique.

RÈGLES :
- Réponse courte et utile, 2 à 5 phrases.
- Si on demande "comment ça marche", explique côté commerçant, côté client, et installation sans code.
- Si on demande le prix, dis que la beta peut être gratuite/à valider selon l'offre, sans inventer un tarif fixe.
- Ne dis pas que tu ne peux pas aider si la réponse est dans ces informations.`;
}

export const Route = createFileRoute("/api/public/rachida-chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async ({ request }) => {
        const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
        const ok = await checkRateLimit(ip.split(",")[0].trim(), "chat");
        if (!ok) return new Response("rate limit exceeded", { status: 429, headers: corsHeaders });

        const body = (await request.json()) as ChatBody;
        if (!body?.shopSlug || !Array.isArray(body.messages)) {
          return new Response("bad request", { status: 400, headers: corsHeaders });
        }
        const mode = body.mode ?? "storefront";
        const isStorefront = mode === "storefront";
        if (!process.env.GEMINI_API_KEY) return new Response("missing key", { status: 500, headers: corsHeaders });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shops } = await supabaseAdmin
          .from("shops")
          .select("*")
          .eq("slug", body.shopSlug)
          .order("created_at", { ascending: false })
          .limit(1);
        const shop = shops?.[0] ?? (mode === "platform" ? {
          id: "00000000-0000-0000-0000-000000000000",
          slug: "platform",
          name: "Rachida AI",
          owner_id: "",
          color: "#7c5cfc",
          currency: "FCFA",
          greeting: "Bonjour, je suis Rachida.",
          max_remise: 0,
          rachida_name: "Rachida",
          system_prompt_extra: null,
          whatsapp: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : null);
        if (!shop) return new Response("shop not found", { status: 404, headers: corsHeaders });

        if (mode === "admin") {
          const auth = request.headers.get("authorization") || "";
          const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
          const { data: userData, error: authError } = token ? await supabaseAdmin.auth.getUser(token) : { data: { user: null }, error: null };
          if (authError || !userData.user || userData.user.id !== shop.owner_id) {
            return new Response("unauthorized", { status: 401, headers: corsHeaders });
          }
        }

        const lastUser = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const criteria = extractCriteria(lastUser);
        const emotion = detectEmotion(lastUser);
        const language = detectLanguage(lastUser);

        // Parallel reads: FAQ, customer profile, filtered catalog, and site-scraped products (if embedded on external site)
        let productsQuery = supabaseAdmin.from("products").select("id, name, description, price, category, gender, color, stock").eq("shop_id", shop.id).eq("is_active", true);
        if (criteria.priceMax) productsQuery = productsQuery.lte("price", criteria.priceMax);
        if (criteria.priceMin) productsQuery = productsQuery.gte("price", criteria.priceMin);
        if (criteria.gender) productsQuery = productsQuery.eq("gender", criteria.gender);
        if (criteria.color) productsQuery = productsQuery.ilike("color", `%${criteria.color}%`);

        let parentHost = "";
        if (body.parentUrl) {
          try { parentHost = new URL(body.parentUrl).host; } catch {}
        }

        const [faqsRes, profRes, productsRes, installRes] = await Promise.all([
          isStorefront
            ? supabaseAdmin.from("faq").select("question, answer, keywords").eq("shop_id", shop.id)
            : Promise.resolve({ data: [] as { question: string; answer: string; keywords: string | null }[] }),
          body.clientContact
            ? supabaseAdmin.from("customer_profiles")
                .select("customer_name, language, budget_max, notes, total_conversations")
                .eq("shop_id", shop.id).eq("customer_contact", body.clientContact).limit(1)
            : Promise.resolve({ data: [] as CustomerProfileRow[] }),
          productsQuery.limit(15),
          isStorefront && parentHost
            ? supabaseAdmin.from("installations")
                .select("site_info")
                .eq("shop_id", shop.id).eq("parent_host", parentHost).limit(1)
            : Promise.resolve({ data: [] as { site_info: SiteInfo | null }[] }),
        ]);

        const faqs = faqsRes.data ?? [];
        const lowerLast = lastUser.toLowerCase();
        const faqMatch = isStorefront ? faqs.find((f) => {
          const kws = (f.keywords ?? "").toLowerCase().split(/[,;\s]+/).filter(Boolean);
          if (kws.some((k) => k && lowerLast.includes(k))) return true;
          const qWords = f.question.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
          const hits = qWords.filter((w) => lowerLast.includes(w)).length;
          return hits >= 2;
        }) : undefined;

        const customerProfile = (profRes.data?.[0] ?? null) as CustomerProfileRow | null;
        const products = productsRes.data;
        const siteInfo = (installRes.data?.[0]?.site_info ?? null) as SiteInfo | null;
        const siteProducts = siteInfo?.products ?? [];

        // Conversation persistence
        let conversationId = body.conversationId;
        if (isStorefront && !conversationId) {
          const { data: convRows } = await supabaseAdmin
            .from("conversations")
            .insert({
              shop_id: shop.id,
              client_name: body.clientName ?? customerProfile?.customer_name ?? null,
              client_contact: body.clientContact ?? null,
              emotion,
            })
            .select("id")
            .limit(1);
          conversationId = convRows?.[0]?.id;
        }

        // Lead scoring
        const lead = scoreLead(body.messages);

        // Fire all follow-up writes in parallel (don't block response)
        if (isStorefront) {
          const writes: PromiseLike<unknown>[] = [];
          if (conversationId && body.conversationId) {
            writes.push(supabaseAdmin.from("conversations")
              .update({ emotion, client_name: body.clientName, client_contact: body.clientContact })
              .eq("id", conversationId));
          }
          if (conversationId && lastUser) {
            writes.push(supabaseAdmin.from("messages").insert({
              conversation_id: conversationId, role: "user", content: lastUser,
            }));
          }
          if (products?.length && conversationId) {
            writes.push(supabaseAdmin.from("product_views").insert(
              products.slice(0, 5).map((p) => ({ shop_id: shop.id, product_id: p.id, conversation_id: conversationId! })),
            ));
          }
          if (conversationId) {
            writes.push(supabaseAdmin.from("lead_scores").upsert(
              { shop_id: shop.id, conversation_id: conversationId, score: lead.score, reasons: lead.reasons },
              { onConflict: "conversation_id" },
            ));
          }
          if (body.clientContact) {
            writes.push(supabaseAdmin.from("customer_profiles").upsert(
              {
                shop_id: shop.id,
                customer_contact: body.clientContact,
                customer_name: body.clientName ?? customerProfile?.customer_name ?? null,
                language,
                last_seen_at: new Date().toISOString(),
                total_conversations: (customerProfile?.total_conversations ?? 0) + (body.conversationId ? 0 : 1),
              },
              { onConflict: "shop_id,customer_contact" },
            ));
          }
          // don't await — let them run in the background
          void Promise.all(writes).catch(() => {});
        }


        // FAQ short-circuit (still log message but skip IA)
        if (faqMatch) {
          if (conversationId) {
            await supabaseAdmin.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: faqMatch.answer,
            });
          }
          return new Response(faqMatch.answer, {
            headers: {
              ...corsHeaders,
              "X-Conversation-Id": conversationId ?? "",
              "X-Emotion": emotion,
              "X-Lead-Score": String(lead.score),
              "X-Source": "faq",
              "Access-Control-Expose-Headers": "X-Conversation-Id, X-Emotion, X-Lead-Score, X-Source",
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }

        const catalogText = products && products.length
          ? products.map((p) => `- ${p.name} | ${p.price} ${shop.currency} | ${p.category ?? ""} ${p.gender ?? ""} ${p.color ?? ""} | stock:${p.stock}${p.description ? ` | ${p.description}` : ""}`).join("\n")
          : "(aucun produit dans l'admin de ce commerçant)";

        const siteContextBlock = siteInfo
          ? `\nSITE OÙ TU ES INTÉGRÉE (${parentHost}) :
- Titre : ${siteInfo.title ?? "?"}
- Description : ${siteInfo.description ?? "—"}
${siteProducts.length ? `- Produits détectés sur ce site (source: page publique du site) :\n${siteProducts.slice(0, 20).map((p) => `  · ${p.name}${p.price != null ? ` — ${p.price}` : ""}${p.description ? ` — ${p.description.slice(0, 120)}` : ""}`).join("\n")}` : "- Aucun produit structuré détecté sur ce site."}

IMPORTANT : Ce site peut avoir des produits DIFFÉRENTS de l'admin. Si le client demande un produit et qu'il apparaît sur CE SITE (montres, etc.) mais pas dans l'admin, confirme qu'il est disponible et propose de commander via WhatsApp. Ne dis JAMAIS "on n'a pas ce produit" si tu le vois listé ci-dessus.`
          : "";


        const memoryBlock = customerProfile
          ? `MÉMOIRE CLIENT :
- Nom : ${customerProfile.customer_name ?? "inconnu"}
- Langue préférée : ${customerProfile.language ?? "fr"}
- Budget habituel : ${customerProfile.budget_max ?? "?"} ${shop.currency}
- Conversations précédentes : ${customerProfile.total_conversations ?? 0}
- Notes : ${customerProfile.notes ?? "—"}
`
          : "";

        const langInstruction =
          language === "moore"
            ? "Le client a écrit en Mooré. Réponds en Mooré simple si tu sais, sinon en français. Ne répète pas automatiquement 'Yaa son barka'."
            : language === "dioula"
              ? "Le client a écrit en Dioula. Réponds en Dioula simple si tu sais, sinon en français. Ne répète pas automatiquement 'I ni ce'."
              : "";

        const adminContext = mode === "admin" ? await getAdminContext(supabaseAdmin, shop) : "";

        const systemPrompt = mode === "platform"
          ? platformPrompt(emotion)
          : mode === "admin"
            ? `Tu es ${shop.rachida_name}, assistante business IA du commerçant propriétaire de "${shop.name}".
Tu n'es PAS une vendeuse parlant à un client : tu es dans l'admin/dashboard. Tu dois aider le patron à piloter l'entreprise.
Ne commence jamais par "Yaa son barka". Français naturel, direct, professionnel.
Tu as accès aux données ci-dessous : utilise-les pour répondre aux questions de chiffre d'affaires, commandes, conversations, leads, catalogue, stock, top produits.
Si le patron demande "combien", donne le chiffre exact disponible. Ne dis jamais que tu n'as pas la capacité si la donnée est dans le contexte.
Tu peux aussi : proposer de nouveaux produits, écrire des descriptions produits, améliorer une fiche produit, créer une FAQ, suggérer des relances clients, analyser les leads chauds, écrire des messages WhatsApp de suivi.
Si une donnée n'existe pas encore, dis clairement "pas encore de donnée enregistrée" puis propose quoi faire.

${adminContext}

RÈGLES :
- Réponds en 2 à 6 phrases, ou en liste claire si demandé.
- Pour les montants, utilise ${shop.currency}.
- Quand tu proposes une description produit, donne une version prête à copier.
- Ne parle pas comme si tu vendais au client final.`
            : `Tu es ${shop.rachida_name}, vendeuse IA chaleureuse et professionnelle de la boutique "${shop.name}" au Burkina Faso.
Tu parles français naturel et chaleureux. Ne commence PAS chaque message par "Yaa son barka" ou une salutation locale. Utilise une touche locale seulement si le client l'utilise ou si c'est vraiment pertinent.
Émotion détectée : ${emotion} (score lead actuel : ${lead.score}/10 — ${lead.reasons}). Adapte ton ton.
Devise : ${shop.currency}. Remise maximum autorisée : ${shop.max_remise}%.
WhatsApp boutique : ${shop.whatsapp ?? "non configuré"}.
${langInstruction}

${memoryBlock}
CATALOGUE ADMIN (produits enregistrés par le commerçant) :
${catalogText}
${siteContextBlock}


RÈGLES :
- Recommande 1 à 3 produits maximum à la fois, avec nom + prix.
- Si le client veut commander, demande nom et numéro WhatsApp s'ils manquent.
- Si client hésite sur le prix, propose UNE remise max ${shop.max_remise}% MAX, jamais plus.
- Quand pertinent, propose UN upsell ou complément.
- Si la question dépasse tes compétences, propose le transfert WhatsApp humain : "${shop.whatsapp ?? ""}".
- Ne salue pas à chaque réponse ; continue naturellement la conversation.
- Reste concise (2-4 phrases max sauf si une liste est demandée).
${shop.system_prompt_extra ?? ""}`;

        const model = geminiModel();

        const result = streamText({
          model,
          maxOutputTokens: GENEROUS_MAX_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            ...body.messages.map((m) => ({ role: m.role, content: m.content })),
          ] as ModelMessage[],
        });

        let sentAnything = false;
        let capturedError: unknown = null;
        let fullText = "";
        const encoder = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              for await (const part of result.fullStream) {
                if (part.type === "text-delta" && part.text) {
                  sentAnything = true;
                  fullText += part.text;
                  controller.enqueue(encoder.encode(part.text));
                } else if (part.type === "error") {
                  capturedError = part.error;
                }
              }
            } catch (err) {
              capturedError = err;
            }

            if (!sentAnything) {
              let errMsg: string;
              if (capturedError instanceof Error) {
                errMsg = `${capturedError.name}: ${capturedError.message}`;
                const body = (capturedError as { responseBody?: string }).responseBody;
                if (body) errMsg += ` | Détail Google: ${body}`;
              } else if (capturedError) {
                errMsg = String(capturedError);
              } else {
                errMsg = "réponse vide, aucune erreur explicite";
              }
              console.error("[rachida-chat] Réponse IA vide", errMsg);
              const visible = `Désolée, un souci technique m'empêche de répondre. (${errMsg})`;
              controller.enqueue(encoder.encode(visible));
              fullText = visible;
            }

            if (isStorefront && conversationId && fullText) {
              await supabaseAdmin.from("messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: fullText,
              });
            }

            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/plain; charset=utf-8",
            "X-Conversation-Id": conversationId ?? "",
            "X-Emotion": emotion,
            "X-Lead-Score": String(lead.score),
            "X-Language": language,
            "X-Source": "ai",
            "Access-Control-Expose-Headers": "X-Conversation-Id, X-Emotion, X-Lead-Score, X-Language, X-Source",
          },
        });
      },
    },
  },
});
