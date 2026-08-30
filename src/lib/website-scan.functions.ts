import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { geminiModel, GENEROUS_MAX_TOKENS } from "@/lib/ai-gateway.server";

// Scan "à la demande" (pas de surveillance continue — voir la discussion produit) :
// 1. On cherche un sitemap.xml pour lister les pages du site.
// 2. Sur chaque page, on cherche d'abord un balisage schema.org/Product (fiable,
//    gratuit, pas d'IA) — beaucoup de boutiques WordPress/WooCommerce/Shopify l'ont.
// 3. Pour tout ce qui n'a pas ce balisage, on regroupe le texte des pages restantes
//    et on fait UN SEUL appel IA pour extraire ce qui ressemble à des produits —
//    pour limiter le coût plutôt qu'un appel par page.

const MAX_PAGES_TO_FETCH = 15;
const MAX_HEADLESS_PAGES = 5;
const MAX_TEXT_CHARS_FOR_AI = 15000;
const FETCH_TIMEOUT_MS = 8000;

type ExtractedProduct = {
  name: string;
  price: number;
  category?: string | null;
  gender?: string | null;
  color?: string | null;
  stock?: number | null;
  description?: string | null;
  image_url?: string | null;
  isService?: boolean;
};

async function fetchWithTimeout(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RachidaBot/1.0; +https://ai-rachida-boutique.vercel.app)" },
    });
    clearTimeout(t);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/** Extrait les URLs <loc> d'un sitemap.xml, en suivant un niveau de sitemap-index. */
async function discoverUrlsFromSitemap(origin: string): Promise<string[]> {
  const candidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
  for (const sitemapUrl of candidates) {
    const res = await fetchWithTimeout(sitemapUrl);
    if (!res) continue;
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    if (!locs.length) continue;

    if (/<sitemapindex/i.test(xml)) {
      // Sitemap-index : on suit jusqu'à 3 sous-sitemaps (souvent "products", "shop"...)
      const prioritized = locs
        .sort((a, b) => {
          const score = (u: string) => (/product|shop|boutique|catalog/i.test(u) ? 0 : 1);
          return score(a) - score(b);
        })
        .slice(0, 3);
      const nested: string[] = [];
      for (const sub of prioritized) {
        const subRes = await fetchWithTimeout(sub);
        if (!subRes) continue;
        const subXml = await subRes.text();
        nested.push(...[...subXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]));
      }
      if (nested.length) return nested;
    }
    return locs;
  }
  return [];
}

/** Repli : extrait les liens internes trouvés sur la page d'accueil. */
function extractInternalLinks(html: string, origin: string): string[] {
  const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const abs = links
    .map((href) => {
      try {
        return new URL(href, origin).toString();
      } catch {
        return null;
      }
    })
    .filter((u): u is string => !!u && u.startsWith(origin));
  return [...new Set(abs)];
}

function prioritizeProductLikeUrls(urls: string[]): string[] {
  return [...urls]
    .sort((a, b) => {
      const score = (u: string) =>
        /product|produit|shop|boutique|catalog|item|article/i.test(u) ? 0 : 1;
      return score(a) - score(b);
    })
    .slice(0, MAX_PAGES_TO_FETCH);
}

/** Cherche un JSON-LD schema.org/Product OU Service dans le HTML d'une page. */
function extractJsonLdProducts(html: string, pageUrl: string): ExtractedProduct[] {
  const found: ExtractedProduct[] = [];
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, raw] of scripts) {
    try {
      const json = JSON.parse(raw.trim());
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const item of items) {
        const type = item?.["@type"];
        const isService = type === "Service" || type === "Offer" || type === "OfferCatalog";
        const isProduct = type === "Product";
        if (!item || (!isProduct && !isService)) continue;

        const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        const price = Number(item.price ?? offers?.price ?? offers?.lowPrice ?? 0) || 0;
        const image = Array.isArray(item.image) ? item.image[0] : item.image;
        found.push({
          name: String(item.name ?? "").slice(0, 120) || "Produit",
          price,
          description: typeof item.description === "string" ? item.description.slice(0, 300) : null,
          image_url: typeof image === "string" ? image : null,
          category: isService ? "service" : null,
          gender: null,
          color: null,
          // Une prestation de service n'a pas de rupture de stock au sens physique —
          // on la marque toujours disponible plutôt que 0 (qui déclencherait une
          // fausse alerte "stock bas" côté Rachida).
          stock: isService ? 999 : 1,
        });
      }
    } catch {
      // JSON-LD mal formé — on ignore cette page pour ce chemin, le texte de repli prendra le relais
    }
  }
  if (found.length === 0) return [];
  return found.filter((p) => p.name && p.name !== "Produit");
}

/** Texte visible grossier (sans balises), pour repli IA. */
function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYSTEM = `Tu es Rachida, assistante d'un commerçant. Tu reçois du texte brut extrait de plusieurs pages d'un site web (mélangé, avec du bruit : menus, pied de page, etc.).

Ta tâche : repérer ce qui est VENDU — un produit physique (avec un prix à l'unité) OU une prestation de service payante (une consultation, un forfait, une intervention, un abonnement...) — et en extraire une liste pour le catalogue.

Règles :
- Ignore tout ce qui n'est pas à vendre (navigation, footer, mentions légales, articles de blog, page "À propos").
- Devine le prix si le format est ambigu ("5000f", "5 000 FCFA", "à partir de 10 000" → 10000). Si aucun prix trouvé, price: 0.
- category : "vêtement", "chaussure", "cosmétique", "nourriture", "électronique", "accessoire", "artisanat", "service", "autre". Utilise "service" pour toute prestation (pas d'objet physique livré).
- Pour un service, isService: true — il n'a pas de notion de stock physique.
- Ne réponds qu'avec ce que tu es raisonnablement sûr d'avoir bien identifié.

Réponds UNIQUEMENT en JSON strict, sans markdown :
{"products":[{"name":"...","price":5000,"category":"...","description":"...","isService":false}]}`;

export const scanWebsiteForProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ shopId: z.string().uuid(), url: z.string().url() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: shops, error: shopErr } = await supabase
      .from("shops")
      .select("id, owner_id")
      .eq("id", data.shopId)
      .eq("owner_id", userId)
      .limit(1);
    if (shopErr) throw new Error(shopErr.message);
    if (!shops?.[0]) throw new Error("Boutique introuvable ou non autorisée");

    let origin: string;
    try {
      origin = new URL(data.url).origin;
    } catch {
      throw new Error("URL invalide");
    }

    // 1. Découverte des pages
    let urls = await discoverUrlsFromSitemap(origin);
    let usedSitemap = urls.length > 0;
    if (!urls.length) {
      const homeRes = await fetchWithTimeout(origin);
      if (!homeRes) throw new Error("Impossible de joindre ce site. Vérifie l'adresse.");
      const homeHtml = await homeRes.text();
      urls = extractInternalLinks(homeHtml, origin);
      urls.unshift(origin);
    }
    urls = prioritizeProductLikeUrls(urls);

    // 2. Récupération + extraction JSON-LD (gratuit) par page, texte de repli pour l'IA
    const structuredProducts: ExtractedProduct[] = [];
    let leftoverText = "";
    let pagesFetched = 0;
    let usedHeadless = false;

    for (const url of urls) {
      const res = await fetchWithTimeout(url);
      if (!res) continue;
      const html = await res.text();
      pagesFetched++;

      const jsonLd = extractJsonLdProducts(html, url);
      if (jsonLd.length) {
        structuredProducts.push(...jsonLd);
      } else if (leftoverText.length < MAX_TEXT_CHARS_FOR_AI) {
        leftoverText += `\n\n--- Page: ${url} ---\n` + stripHtmlToText(html).slice(0, 2000);
      }
    }

    if (pagesFetched === 0) {
      throw new Error("Impossible de lire ce site (pages inaccessibles). Vérifie que l'adresse est correcte et publique.");
    }

    // 2bis. Repli "rendu JS" via Jina AI Reader (r.jina.ai, gratuit, sans clé) : si le
    // scan rapide n'a presque rien trouvé, c'est probablement un site dont le contenu
    // est chargé en JavaScript après coup (ex: "Chargement...", React/Vue). Plutôt que
    // de faire tourner nous-mêmes un navigateur (fragile sur une fonction serverless),
    // on délègue le rendu à ce service : il exécute la page côté serveur et renvoie le
    // texte déjà nettoyé, prêt pour l'IA.
    const foundTooLittle = structuredProducts.length === 0 && leftoverText.trim().length < 300;
    let headlessDebug = "non déclenché (assez de contenu trouvé au scan rapide)";
    if (foundTooLittle) {
      const pagesToRender = urls.slice(0, MAX_HEADLESS_PAGES);
      leftoverText = "";
      let renderedOk = 0;
      let lastError = "";
      for (const url of pagesToRender) {
        try {
          const res = await fetchWithTimeout(`https://r.jina.ai/${url}`);
          if (!res) {
            lastError = "réponse vide de r.jina.ai";
            continue;
          }
          const cleanText = (await res.text()).slice(0, 3000);
          if (!cleanText.trim()) continue;
          renderedOk++;
          usedHeadless = true;
          if (leftoverText.length < MAX_TEXT_CHARS_FOR_AI) {
            leftoverText += `\n\n--- Page: ${url} ---\n` + cleanText;
          }
        } catch (err) {
          lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        }
      }
      headlessDebug =
        renderedOk > 0
          ? `${renderedOk}/${pagesToRender.length} page(s) rendues via r.jina.ai, ${leftoverText.trim().length} caractères pour l'IA`
          : `échec sur toutes les pages${lastError ? ` (${lastError})` : ""}`;
      if (renderedOk === 0) {
        console.error("[website-scan] Repli r.jina.ai indisponible", lastError);
        // On continue avec ce qu'on a du scan rapide — mieux vaut un résultat partiel
        // qu'un échec total si le rendu headless n'est pas configuré/disponible.
      }
    }

    // 3. Repli IA sur le texte restant (un seul appel, quel que soit le nombre de pages)
    let aiProducts: ExtractedProduct[] = [];
    if (leftoverText.trim() && structuredProducts.length < 3) {
      const result = await generateText({
        model: geminiModel(),
        maxOutputTokens: GENEROUS_MAX_TOKENS,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: leftoverText.slice(0, MAX_TEXT_CHARS_FOR_AI) },
        ],
      });
      try {
        const match = result.text.match(/\{[\s\S]*\}/);
        const parsed: { products?: ExtractedProduct[] } = match ? JSON.parse(match[0]) : {};
        aiProducts = parsed.products ?? [];
      } catch {
        aiProducts = [];
      }
    }

    // 4. Fusion + dédoublonnage par nom
    const merged = [...structuredProducts, ...aiProducts]
      .filter((p) => p && typeof p.name === "string" && p.name.trim())
      .map((p) => ({
        name: String(p.name).slice(0, 120),
        price: Number(p.price) || 0,
        category: p.category ?? (p.isService ? "service" : null),
        gender: p.gender ?? null,
        color: p.color ?? null,
        stock: Number(p.stock ?? (p.isService || p.category === "service" ? 999 : 1)) || 0,
        description: p.description ?? null,
        image_url: p.image_url ?? null,
      }));
    const seen = new Set<string>();
    const products = merged.filter((p) => {
      const key = p.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      products,
      pagesScanned: pagesFetched,
      usedSitemap,
      usedHeadless,
      viaStructuredData: structuredProducts.length,
      debug: { urls: urls.slice(0, 5), headlessDebug },
    };
  });
