import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function extractSiteInfo(html: string, baseUrl: string) {
  const pick = (re: RegExp) => {
    const m = html.match(re);
    return m ? m[1].trim().slice(0, 500) : null;
  };
  const title =
    pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    pick(/<title>([^<]+)<\/title>/i);
  const description =
    pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  let ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImage && !/^https?:\/\//i.test(ogImage)) {
    try { ogImage = new URL(ogImage, baseUrl).toString(); } catch {}
  }
  // JSON-LD products
  const products: Array<{ name: string; price?: number; image?: string; description?: string }> = [];
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = jsonLdRegex.exec(html)) && products.length < 30) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const nodes = item?.["@graph"] || [item];
        for (const node of nodes) {
          const t = node?.["@type"];
          const type = Array.isArray(t) ? t[0] : t;
          if (type === "Product") {
            const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
            const priceRaw = offer?.price ?? node.price;
            const price = priceRaw != null ? Number(String(priceRaw).replace(/[^\d.]/g, "")) : undefined;
            products.push({
              name: String(node.name || "").slice(0, 200),
              price: Number.isFinite(price) ? price : undefined,
              image: typeof node.image === "string" ? node.image : Array.isArray(node.image) ? node.image[0] : undefined,
              description: node.description ? String(node.description).slice(0, 500) : undefined,
            });
          }
        }
      }
    } catch {}
  }
  return { title, description, og_image: ogImage, products };
}

async function scrapeSite(shopSlug: string, parentUrl: string, installId: string) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(parentUrl, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RachidaBot/1.0; +https://rachida.ai)",
        Accept: "text/html",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = (await res.text()).slice(0, 500_000);
    const info = extractSiteInfo(html, parentUrl);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("installations").update({
      title: info.title,
      site_info: info,
      scraped_at: new Date().toISOString(),
    }).eq("id", installId);
  } catch (e) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("installations").update({
      last_error: e instanceof Error ? e.message : "scrape failed",
      scraped_at: new Date().toISOString(),
    }).eq("id", installId);
  }
}

export const Route = createFileRoute("/api/public/rachida-install-ping")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({} as any));
          const shopSlug = String(body.shopSlug || "").trim();
          const parentUrl = String(body.parentUrl || "").trim();
          const userAgent = String(body.userAgent || "").slice(0, 500);
          if (!shopSlug || !parentUrl) {
            return Response.json({ ok: false, error: "missing shopSlug or parentUrl" }, { status: 400, headers: CORS });
          }
          let host = "";
          try { host = new URL(parentUrl).host; } catch {
            return Response.json({ ok: false, error: "invalid url" }, { status: 400, headers: CORS });
          }
          // Ignore localhost pings (dev) & our own preview
          if (/^(localhost|127\.|0\.0\.0\.0)/i.test(host)) {
            return Response.json({ ok: true, ignored: true }, { headers: CORS });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: shopRows } = await supabaseAdmin.from("shops").select("id").eq("slug", shopSlug).limit(1);
          const shop = shopRows?.[0];
          const status = shop ? "active" : "invalid_shop";
          const lastError = shop ? null : `Aucune boutique avec le slug « ${shopSlug} »`;

          const { data: existing } = await supabaseAdmin
            .from("installations")
            .select("id, hits, scraped_at")
            .eq("shop_slug", shopSlug)
            .eq("parent_host", host)
            .limit(1);
          const row = existing?.[0];

          if (row) {
            await supabaseAdmin.from("installations").update({
              last_seen_at: new Date().toISOString(),
              hits: (row.hits || 0) + 1,
              status,
              last_error: lastError,
              parent_url: parentUrl,
              user_agent: userAgent,
              shop_id: shop?.id ?? null,
            }).eq("id", row.id);
            if (!row.scraped_at && shop) {
              void scrapeSite(shopSlug, parentUrl, row.id);
            }
            return Response.json({ ok: true, status }, { headers: CORS });
          }

          const { data: inserted } = await supabaseAdmin.from("installations").insert({
            shop_id: shop?.id ?? null,
            shop_slug: shopSlug,
            parent_url: parentUrl,
            parent_host: host,
            status,
            last_error: lastError,
            user_agent: userAgent,
          }).select("id").limit(1);
          const installId = inserted?.[0]?.id;
          if (installId && shop) {
            void scrapeSite(shopSlug, parentUrl, installId);
          }
          return Response.json({ ok: true, status, first: true }, { headers: CORS });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "unknown" },
            { status: 500, headers: CORS },
          );
        }
      },
    },
  },
});
