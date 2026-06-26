import { createServerFn } from "@tanstack/react-start";

export const checkInstall = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string; slug: string }) => {
    const u = String(d.url || "").trim();
    const s = String(d.slug || "").trim();
    if (!u || !s) throw new Error("URL et slug requis");
    return { url: u, slug: s };
  })
  .handler(async ({ data }) => {
    let url = data.url;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "RachidaInstallChecker/1.0" },
        redirect: "follow",
      });
      clearTimeout(t);
      if (!res.ok) {
        return { ok: false, reason: `Le site a répondu HTTP ${res.status}.`, status: res.status };
      }
      const html = await res.text();
      const hasScript = /rachida\.js/i.test(html);
      const hasShop = new RegExp(`data-shop=["']${data.slug}["']`, "i").test(html);
      if (hasScript && hasShop) {
        return { ok: true, message: "Rachida est bien installée et active sur votre site." };
      }
      if (hasScript && !hasShop) {
        return { ok: false, reason: "Le script Rachida est présent mais le slug ne correspond pas à votre boutique." };
      }
      return { ok: false, reason: "Nous n'avons pas trouvé Rachida sur cette page." };
    } catch (e: any) {
      return { ok: false, reason: `Impossible d'accéder au site (${e?.message || "erreur réseau"}).` };
    }
  });
