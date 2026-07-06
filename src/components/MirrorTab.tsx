import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Globe2, Loader2, Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";

type Mirror = {
  id: string;
  slug: string;
  source_url: string;
  status: string;
  title: string | null;
  last_error: string | null;
  updated_at: string;
};

function randSlug() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 5);
}

export function MirrorTab({ shopId }: { shopId: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [items, setItems] = useState<Mirror[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("mirrors")
      .select("id, slug, source_url, status, title, last_error, updated_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Mirror[]) || []);
    setLoading(false);
  }, [shopId]);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    let clean = url.trim();
    if (!clean) { toast.error("Colle l'URL de ton site"); return; }
    if (!/^https?:\/\//i.test(clean)) clean = "https://" + clean;
    try { new URL(clean); } catch { toast.error("URL invalide"); return; }

    setCreating(true);
    const slug = randSlug();
    const { data, error } = await supabase.from("mirrors").insert({
      shop_id: shopId, slug, source_url: clean,
    }).select().limit(1);
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    if (data?.[0]) {
      toast.success("Miroir créé !");
      setUrl("");
      void load();
      window.open(`${origin}/m/${slug}`, "_blank");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce miroir ?")) return;
    const { error } = await supabase.from("mirrors").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé");
    setItems((s) => s.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Globe2 className="size-7 text-cyan-300" /> Site avec Rachida en 1 clic</h1>
        <p className="text-white/60 mt-1">Colle l'URL de ton site (même celui d'un concurrent, d'un catalogue Facebook, ou une page Google Sites) → tu reçois un lien avec Rachida qui vend dedans.</p>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-5">
        <label className="text-sm font-medium text-white/80 block mb-2">URL de ton site actuel</label>
        <div className="flex gap-2 flex-wrap">
          <input type="url" placeholder="https://monsite.com" value={url} onChange={(e) => setUrl(e.target.value)}
            className="input-neon flex-1 min-w-[240px]" onKeyDown={(e) => { if (e.key === "Enter") void create(); }} />
          <button onClick={create} disabled={creating} className="btn-neon disabled:opacity-50">
            {creating ? <><Loader2 className="size-4 animate-spin" /> Création…</> : <><Wand2 className="size-4" /> Ajouter Rachida à ce site</>}
          </button>
        </div>
        <p className="text-xs text-white/50 mt-2">Aucune installation. On charge ton site à la volée et on y injecte Rachida. Si ton site bloque, on utilise automatiquement une copie de secours.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="size-4" /> Mes sites miroirs</h2>
          <button onClick={() => void load()} className="btn-ghost"><RefreshCw className="size-4" /> Rafraîchir</button>
        </div>

        {loading ? (
          <div className="text-white/50 text-sm">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-white/50 text-sm py-8 text-center">Aucun miroir pour l'instant. Colle une URL ci-dessus.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((m) => {
              const link = `${origin}/m/${m.slug}`;
              const badge = m.status === "live" ? { c: "emerald", t: "🟢 Live" }
                          : m.status === "snapshot" ? { c: "amber", t: "🟡 Copie de secours" }
                          : { c: "red", t: "🔴 Cassé" };
              return (
                <li key={m.id} className="p-3 rounded-xl bg-black/30 border border-white/5 flex gap-3 items-start flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="text-sm font-medium truncate">{m.title || m.source_url}</div>
                    <div className="text-xs text-white/50 truncate">{m.source_url}</div>
                    <div className="text-xs text-cyan-300 mt-1 break-all">{link}</div>
                    {m.last_error && <div className="text-[11px] text-amber-300 mt-1">{m.last_error}</div>}
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`text-[10px] px-2 py-1 rounded-full bg-${badge.c}-500/15 text-${badge.c}-200 border border-${badge.c}-400/30`}>{badge.t}</span>
                    <button onClick={() => { navigator.clipboard.writeText(link); toast.success("Lien copié"); }} className="btn-ghost"><Copy className="size-4" /></button>
                    <a href={link} target="_blank" rel="noreferrer" className="btn-ghost"><ExternalLink className="size-4" /></a>
                    <button onClick={() => void remove(m.id)} className="btn-ghost text-red-300"><Trash2 className="size-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6 text-sm text-white/70 space-y-2">
        <div className="font-semibold text-white/90 flex items-center gap-2">💡 Comment ça marche ?</div>
        <ol className="list-decimal list-inside space-y-1 text-white/60">
          <li>Tu colles l'URL de ton site (WordPress, Wix, Shopify, Google Sites, page Linktree, n'importe quoi).</li>
          <li>On génère un lien <code className="text-cyan-300">/m/xxx</code> à partager sur ta bio Insta, ton statut WhatsApp, tes flyers.</li>
          <li>Quand un client ouvre ce lien : il voit ton site normalement, avec Rachida en bas à droite qui répond, prend commande, envoie sur WhatsApp.</li>
          <li>Si ton site bloque les scripts externes, on garde automatiquement une copie hébergée qui continue de marcher.</li>
        </ol>
      </div>
    </div>
  );
}
