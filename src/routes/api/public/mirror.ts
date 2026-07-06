import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function serverClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Rewrite relative URLs in an HTML string so they resolve against the original origin. */
function rebaseHtml(html: string, sourceUrl: string): { html: string; title: string } {
  const base = new URL(sourceUrl);
  const origin = base.origin;
  const dir = base.pathname.replace(/[^/]*$/, "");

  const absolutize = (u: string): string => {
    if (!u) return u;
    const trimmed = u.trim();
    if (/^(https?:|data:|mailto:|tel:|blob:|#|javascript:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("//")) return base.protocol + trimmed;
    if (trimmed.startsWith("/")) return origin + trimmed;
    return origin + dir + trimmed;
  };

  // 1. Inject/replace <base> so relative URLs resolve upstream, and strip meta CSP that blocks scripts.
  let out = html
    .replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, "")
    .replace(/<base\s[^>]*>/gi, "");
  out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${origin + dir}">`);

  // 2. Absolutize src/href/action/srcset/poster/data-* on tags. Cheap regex pass is enough for a proxy.
  out = out.replace(/\s(src|href|action|poster|data-src|data-href)\s*=\s*"([^"]+)"/gi, (_m, a, u) => ` ${a}="${absolutize(u)}"`);
  out = out.replace(/\s(src|href|action|poster|data-src|data-href)\s*=\s*'([^']+)'/gi, (_m, a, u) => ` ${a}='${absolutize(u)}'`);
  out = out.replace(/\ssrcset\s*=\s*"([^"]+)"/gi, (_m, list) => {
    const rewritten = String(list).split(",").map((part) => {
      const t = part.trim();
      const sp = t.indexOf(" ");
      const url = sp === -1 ? t : t.slice(0, sp);
      const rest = sp === -1 ? "" : t.slice(sp);
      return absolutize(url) + rest;
    }).join(", ");
    return ` srcset="${rewritten}"`;
  });

  const titleMatch = out.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : base.hostname;
  return { html: out, title };
}

function injectWidget(html: string, origin: string, shopSlug: string): string {
  const tag = `\n<script src="${origin}/widget/rachida.js" data-shop="${shopSlug}" async defer></script>\n<style>[data-rachida-hidden]{display:none!important}</style>\n`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, tag + "</body>");
  return html + tag;
}

async function fetchHtml(url: string): Promise<{ html: string; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RachidaMirror/1.0; +https://rachida.ai)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error(`Statut ${res.status}`);
    if (!/text\/html|application\/xhtml/i.test(ct)) throw new Error(`Type non HTML (${ct || "inconnu"})`);
    const html = await res.text();
    return { html, contentType: ct };
  } finally {
    clearTimeout(timer);
  }
}

export const Route = createFileRoute("/api/public/mirror")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");
        const origin = url.origin;
        if (!slug) return new Response("slug required", { status: 400, headers: CORS });

        const supabase = serverClient();
        const { data: mirrors } = await supabase
          .from("mirrors")
          .select("id, shop_id, source_url, cached_html, status, shops(slug)")
          .eq("slug", slug)
          .limit(1);
        const mirror = mirrors?.[0];
        if (!mirror) {
          return new Response(errorPage("Miroir introuvable", "Ce lien n'existe pas ou a été supprimé."), {
            status: 404,
            headers: { ...CORS, "Content-Type": "text/html; charset=utf-8" },
          });
        }
        const shopSlug = (mirror.shops as { slug: string } | null)?.slug || "demo";

        // Try live proxy first
        try {
          const { html } = await fetchHtml(mirror.source_url);
          const rebased = rebaseHtml(html, mirror.source_url);
          const final = injectWidget(rebased.html, origin, shopSlug);

          // Refresh snapshot in the background (best-effort)
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          void supabaseAdmin.from("mirrors").update({
            cached_html: rebased.html, title: rebased.title, status: "live", last_error: null,
          }).eq("id", mirror.id);

          return new Response(final, {
            status: 200,
            headers: {
              ...CORS,
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=60, s-maxage=300",
              "X-Robots-Tag": "noindex",
            },
          });
        } catch (err) {
          const reason = err instanceof Error ? err.message : "erreur inconnue";
          // Fallback: cached snapshot
          if (mirror.cached_html) {
            const final = injectWidget(mirror.cached_html, origin, shopSlug);
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            void supabaseAdmin.from("mirrors").update({ status: "snapshot", last_error: reason }).eq("id", mirror.id);
            return new Response(final, {
              status: 200,
              headers: { ...CORS, "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
            });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          void supabaseAdmin.from("mirrors").update({ status: "broken", last_error: reason }).eq("id", mirror.id);
          return new Response(errorPage("Impossible de charger ce site", reason), {
            status: 502,
            headers: { ...CORS, "Content-Type": "text/html; charset=utf-8" },
          });
        }
      },
    },
  },
});

function errorPage(title: string, detail: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;background:#0b0c1a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}.c{max-width:480px;text-align:center}h1{font-size:22px;margin:0 0 8px}p{color:#a1a3b5}</style></head><body><div class="c"><h1>${title}</h1><p>${detail}</p><p style="margin-top:24px;font-size:13px">Rachida AI</p></div></body></html>`;
}
