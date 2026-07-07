import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Ticket, Users2, ShoppingCart, Send, Trash2, Plus, Copy, Loader2, RefreshCw } from "lucide-react";

type Promo = { id: string; code: string; kind: string; value: number; max_uses: number | null; used_count: number; expires_at: string | null; active: boolean };
type Referral = { id: string; referrer_contact: string; code: string; invited_contact: string | null; reward_points: number; status: string };
type Abandoned = { id: string; customer_contact: string | null; customer_name: string | null; total: number; cart: unknown; created_at: string; recovered: boolean };
type Campaign = { id: string; name: string; channel: string; message: string; sent_count: number; status: string; created_at: string };

const rand = (n = 6) => Math.random().toString(36).toUpperCase().slice(2, 2 + n).replace(/[01OI]/g, "X");

export function MarketingTab({ shopId, whatsapp }: { shopId: string; whatsapp: string | null }) {
  const [sub, setSub] = useState<"promo" | "referral" | "abandoned" | "campaign">("promo");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Megaphone className="size-7 text-pink-300" /> Marketing</h1>
        <p className="text-white/60 mt-1">Fais revenir tes clients et attire les nouveaux — sans y penser tous les jours.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { k: "promo", l: "Codes promo", i: Ticket },
          { k: "referral", l: "Parrainage", i: Users2 },
          { k: "abandoned", l: "Paniers oubliés", i: ShoppingCart },
          { k: "campaign", l: "Campagnes WhatsApp", i: Send },
        ] as const).map(({ k, l, i: I }) => (
          <button key={k} onClick={() => setSub(k)}
            className={`whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${sub === k ? "bg-pink-500/20 text-white border border-pink-400/40" : "text-white/60 border border-white/10 hover:bg-white/5"}`}>
            <I className="size-4" /> {l}
          </button>
        ))}
      </div>

      {sub === "promo" && <PromoSection shopId={shopId} />}
      {sub === "referral" && <ReferralSection shopId={shopId} whatsapp={whatsapp} />}
      {sub === "abandoned" && <AbandonedSection shopId={shopId} whatsapp={whatsapp} />}
      {sub === "campaign" && <CampaignSection shopId={shopId} whatsapp={whatsapp} />}
    </div>
  );
}

/* ------------------------- Promo codes ------------------------- */
function PromoSection({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("promo_codes").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    setItems((data as Promo[]) || []);
    setLoading(false);
  }, [shopId]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    const c = (code || rand()).toUpperCase();
    const { error } = await supabase.from("promo_codes").insert({ shop_id: shopId, code: c, kind, value });
    if (error) return toast.error(error.message);
    toast.success(`Code ${c} créé`);
    setCode(""); setValue(10);
    void load();
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer ce code ?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    void load();
  };
  const toggle = async (p: Promo) => {
    await supabase.from("promo_codes").update({ active: !p.active }).eq("id", p.id);
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5 space-y-3">
        <div className="font-semibold">Créer un code promo</div>
        <div className="grid gap-2 md:grid-cols-4">
          <input placeholder="CODE (auto si vide)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input-neon" />
          <select value={kind} onChange={(e) => setKind(e.target.value as "percent" | "fixed")} className="input-neon">
            <option value="percent">% Pourcentage</option>
            <option value="fixed">Montant fixe (FCFA)</option>
          </select>
          <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="input-neon" />
          <button onClick={create} className="btn-neon"><Plus className="size-4" /> Créer</button>
        </div>
        <div className="text-xs text-white/50">Rachida propose ces codes automatiquement pour convaincre les clients qui hésitent.</div>
      </div>

      {loading ? <div className="text-white/50">Chargement…</div> : items.length === 0 ? (
        <div className="text-white/50 text-sm text-center py-6">Aucun code pour l'instant.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-mono font-bold text-cyan-300">{p.code}</div>
                <div className="text-xs text-white/50">
                  {p.kind === "percent" ? `-${p.value}%` : `-${p.value} FCFA`} • Utilisé {p.used_count} fois
                </div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(p.code); toast.success("Copié"); }} className="btn-ghost"><Copy className="size-4" /></button>
              <button onClick={() => toggle(p)} className={`text-xs px-3 py-1.5 rounded-lg border ${p.active ? "border-emerald-400/40 text-emerald-300" : "border-white/10 text-white/50"}`}>
                {p.active ? "Actif" : "Inactif"}
              </button>
              <button onClick={() => remove(p.id)} className="btn-ghost text-red-300"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------- Referrals ------------------------- */
function ReferralSection({ shopId, whatsapp }: { shopId: string; whatsapp: string | null }) {
  const [items, setItems] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("referrals").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    setItems((data as Referral[]) || []);
    setLoading(false);
  }, [shopId]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!contact) return toast.error("Numéro du parrain requis");
    const code = "PARR-" + rand(5);
    const { error } = await supabase.from("referrals").insert({ shop_id: shopId, referrer_contact: contact, code });
    if (error) return toast.error(error.message);
    setContact("");
    toast.success("Lien de parrainage créé");
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="font-semibold">Nouveau parrain</div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Numéro WhatsApp du parrain" value={contact} onChange={(e) => setContact(e.target.value)} className="input-neon flex-1 min-w-[200px]" />
          <button onClick={create} className="btn-neon"><Plus className="size-4" /> Créer un code</button>
        </div>
        <div className="text-xs text-white/50">Chaque parrain gagne 100 points quand un filleul commande. Partage le lien par WhatsApp.</div>
      </div>

      {loading ? <div className="text-white/50">Chargement…</div> : items.length === 0 ? (
        <div className="text-white/50 text-sm text-center py-6">Aucun parrainage.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const link = `${origin}/?ref=${r.code}`;
            const share = whatsapp ? `https://wa.me/?text=${encodeURIComponent(`Salut ! Utilise mon code ${r.code} sur cette boutique et on gagne un cadeau : ${link}`)}` : link;
            return (
              <li key={r.id} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-mono font-bold text-pink-300">{r.code}</div>
                  <div className="text-xs text-white/50">Parrain : {r.referrer_contact} • {r.status}</div>
                </div>
                <a href={share} target="_blank" rel="noreferrer" className="btn-ghost">Partager WhatsApp</a>
                <button onClick={() => { navigator.clipboard.writeText(link); toast.success("Copié"); }} className="btn-ghost"><Copy className="size-4" /></button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------- Abandoned carts ------------------------- */
function AbandonedSection({ shopId, whatsapp }: { shopId: string; whatsapp: string | null }) {
  const [items, setItems] = useState<Abandoned[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("abandoned_carts").select("*").eq("shop_id", shopId).eq("recovered", false).order("created_at", { ascending: false }).limit(50);
    setItems((data as Abandoned[]) || []);
    setLoading(false);
  }, [shopId]);
  useEffect(() => { void load(); }, [load]);

  const markRecovered = async (id: string) => {
    await supabase.from("abandoned_carts").update({ recovered: true }).eq("id", id);
    setItems((s) => s.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-white/60">Clients qui ont hésité mais pas commandé. Un petit message et beaucoup reviennent.</div>
        <button onClick={() => void load()} className="btn-ghost"><RefreshCw className="size-4" /></button>
      </div>
      {loading ? <div className="text-white/50">Chargement…</div> : items.length === 0 ? (
        <div className="text-white/50 text-sm text-center py-6">Aucun panier oublié — bravo !</div>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => {
            const cart = Array.isArray(a.cart) ? a.cart : [];
            const msg = `Bonjour ${a.customer_name || ""} 👋 Tu as regardé chez nous mais tu n'as pas finalisé. Je te fais -10% si tu commandes aujourd'hui ! 💝`;
            const wa = a.customer_contact ? `https://wa.me/${a.customer_contact.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}` : "#";
            return (
              <li key={a.id} className="p-3 rounded-xl bg-black/30 border border-white/5">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div>
                    <div className="font-medium">{a.customer_name || "Client anonyme"} <span className="text-white/50 text-xs">• {a.customer_contact || "sans contact"}</span></div>
                    <div className="text-xs text-white/50">{new Date(a.created_at).toLocaleString("fr-FR")} — {cart.length} article(s) • {a.total} FCFA</div>
                  </div>
                  <div className="flex gap-2">
                    {a.customer_contact && <a href={wa} target="_blank" rel="noreferrer" className="btn-neon"><Send className="size-4" /> Relancer</a>}
                    <button onClick={() => markRecovered(a.id)} className="btn-ghost">Archiver</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!whatsapp && <div className="text-xs text-amber-300">Ajoute un numéro WhatsApp à ta boutique pour utiliser les relances.</div>}
    </div>
  );
}

/* ------------------------- Campaigns ------------------------- */
function CampaignSection({ shopId, whatsapp: _whatsapp }: { shopId: string; whatsapp: string | null }) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    setItems((data as Campaign[]) || []);
    setLoading(false);
  }, [shopId]);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!name || !message) return toast.error("Nom et message requis");
    const { error } = await supabase.from("campaigns").insert({ shop_id: shopId, name, message, channel: "whatsapp" });
    if (error) return toast.error(error.message);
    setName(""); setMessage("");
    toast.success("Campagne enregistrée. Ouvre-la pour envoyer sur WhatsApp.");
    void load();
  };

  const send = async (c: Campaign) => {
    const { data: customers } = await supabase.from("customer_profiles").select("customer_contact, customer_name").eq("shop_id", shopId).not("customer_contact", "is", null);
    if (!customers?.length) return toast.error("Aucun client avec numéro enregistré");
    let opened = 0;
    for (const cu of customers) {
      const phone = (cu.customer_contact || "").replace(/\D/g, "");
      if (!phone) continue;
      const text = c.message.replace("{nom}", cu.customer_name || "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
      opened++;
      await new Promise((r) => setTimeout(r, 300));
    }
    await supabase.from("campaigns").update({ status: "sent", sent_at: new Date().toISOString(), sent_count: opened }).eq("id", c.id);
    toast.success(`${opened} fenêtres WhatsApp ouvertes`);
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="font-semibold">Nouvelle campagne</div>
        <input placeholder="Nom (ex: Promo Tabaski)" value={name} onChange={(e) => setName(e.target.value)} className="input-neon w-full" />
        <textarea rows={4} placeholder="Message. Astuce : {nom} sera remplacé par le prénom du client." value={message} onChange={(e) => setMessage(e.target.value)} className="input-neon w-full" />
        <button onClick={create} className="btn-neon"><Plus className="size-4" /> Créer la campagne</button>
        <div className="text-xs text-white/50">Ça ouvre WhatsApp Web pour chaque client — tu cliques Envoyer. Zéro spam, 100 % dans les règles.</div>
      </div>

      {loading ? <div className="text-white/50">Chargement…</div> : items.length === 0 ? (
        <div className="text-white/50 text-sm text-center py-6">Aucune campagne encore.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-white/60 mt-1 whitespace-pre-wrap">{c.message}</div>
                  <div className="text-xs text-white/40 mt-1">Statut : {c.status} • Envoyé à {c.sent_count} personnes</div>
                </div>
                <button onClick={() => send(c)} className="btn-neon"><Send className="size-4" /> Envoyer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
