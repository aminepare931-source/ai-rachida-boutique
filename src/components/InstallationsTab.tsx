import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, Package, Globe, AlertTriangle } from "lucide-react";

type Installation = {
  id: string;
  shop_slug: string;
  parent_url: string;
  parent_host: string;
  title: string | null;
  status: string;
  last_error: string | null;
  hits: number;
  site_info: {
    title?: string;
    description?: string;
    og_image?: string;
    products?: Array<{ name: string; price?: number; image?: string; description?: string }>;
  } | null;
  first_seen_at: string;
  last_seen_at: string;
  scraped_at: string | null;
};

export function InstallationsTab({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const [items, setItems] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("installations")
      .select("id, shop_slug, parent_url, parent_host, title, status, last_error, hits, site_info, first_seen_at, last_seen_at, scraped_at")
      .eq("shop_id", shopId)
      .order("last_seen_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as unknown as Installation[]) || []);
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`installations-${shopId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "installations", filter: `shop_id=eq.${shopId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [shopId, load]);

  const active = items.filter((i) => i.status === "active").length;
  const broken = items.filter((i) => i.status !== "active").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Globe className="size-7 text-cyan-300" /> Sites qui utilisent Rachida</h1>
          <p className="text-white/60 mt-1">Chaque fois que quelqu'un colle le script <code className="text-cyan-300">data-shop="{shopSlug}"</code>, ça apparait ici. En vrai temps.</p>
        </div>
        <button onClick={() => void load()} className="btn-ghost"><RefreshCw className="size-4" /> Rafraîchir</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="text-xs text-emerald-200/80">Sites actifs</div>
          <div className="text-3xl font-bold text-emerald-100 flex items-center gap-2"><CheckCircle2 className="size-6" /> {active}</div>
        </div>
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
          <div className="text-xs text-red-200/80">Problèmes détectés</div>
          <div className="text-3xl font-bold text-red-100 flex items-center gap-2"><AlertTriangle className="size-6" /> {broken}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
        {loading ? (
          <div className="text-white/50 text-sm">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-white/50 text-sm py-12 text-center space-y-1">
            <div>Aucun site n'utilise encore Rachida pour cette boutique.</div>
            <div className="text-xs">Va dans <b>Coller sur mon site</b> pour récupérer ton code d'installation.</div>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const isOpen = expanded === it.id;
              const badge = it.status === "active"
                ? { c: "emerald", t: "🟢 Rachida est visible", icon: <CheckCircle2 className="size-4" /> }
                : { c: "red", t: "🔴 Slug invalide / erreur", icon: <XCircle className="size-4" /> };
              const products = it.site_info?.products || [];
              return (
                <li key={it.id} className="rounded-xl bg-black/30 border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : it.id)}
                    className="w-full text-left p-3 flex gap-3 items-start hover:bg-white/5 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{it.site_info?.title || it.title || it.parent_host}</div>
                      <div className="text-xs text-white/50 truncate">{it.parent_url}</div>
                      <div className="text-[11px] text-white/40 mt-1">
                        {it.hits} chargement{it.hits > 1 ? "s" : ""} · dernier {new Date(it.last_seen_at).toLocaleString("fr-FR")}
                      </div>
                      {it.last_error && <div className="text-[11px] text-amber-300 mt-1">⚠️ {it.last_error}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-1 rounded-full bg-${badge.c}-500/15 text-${badge.c}-200 border border-${badge.c}-400/30 inline-flex items-center gap-1`}>
                        {badge.icon} {badge.t}
                      </span>
                      {products.length > 0 && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 inline-flex items-center gap-1">
                          <Package className="size-3" /> {products.length} produit{products.length > 1 ? "s" : ""} détectés
                        </span>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4 border-t border-white/5 space-y-3 bg-black/20">
                      {it.site_info?.description && (
                        <div className="text-sm text-white/70"><b className="text-white/90">Description :</b> {it.site_info.description}</div>
                      )}
                      {it.site_info?.og_image && (
                        <img src={it.site_info.og_image} alt="" className="rounded-lg max-h-40 border border-white/10" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      )}
                      <a href={it.parent_url} target="_blank" rel="noreferrer" className="btn-ghost inline-flex text-sm">
                        <ExternalLink className="size-4" /> Voir le site
                      </a>
                      {products.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold text-white/90 mb-2 flex items-center gap-2"><Package className="size-4 text-cyan-300" /> Produits chargés automatiquement</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {products.slice(0, 12).map((p, i) => (
                              <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-2 text-xs">
                                {p.image && <img src={p.image} alt="" className="w-full h-20 object-cover rounded mb-1" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                                <div className="font-medium truncate">{p.name}</div>
                                {p.price != null && <div className="text-cyan-300">{p.price}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {it.scraped_at && products.length === 0 && !it.site_info?.description && (
                        <div className="text-xs text-white/40">Aucun produit structuré trouvé sur ce site (pas de balises JSON-LD Product).</div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/70 space-y-1">
        <div className="font-semibold text-white/90">💡 Comment ça marche</div>
        <p>Dès que le script Rachida est chargé sur un site avec ton slug, il envoie un signal ici. Si le slug est incorrect, on le marque en rouge et on te dit pourquoi — tu peux dépanner en 2 secondes. On lit aussi le titre, la description et les produits publics du site pour te les afficher.</p>
      </div>
    </div>
  );
}
