import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Plus, Trash2, Users } from "lucide-react";

type Customer = {
  id: string; customer_name: string | null; customer_contact: string;
  total_spent: number; orders_count: number; tags: string[];
  last_order_at: string | null; notes: string | null;
};
type Segment = { id: string; name: string; color: string };

export function CrmTab({ shopId, whatsapp }: { shopId: string; whatsapp: string | null }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [newSeg, setNewSeg] = useState("");

  const load = async () => {
    // customer_profiles has no orders_count/total_spent/last_order_at directly; join with loyalty via contact.
    const [{ data: profiles }, { data: loyalty }, { data: segs }] = await Promise.all([
      supabase.from("customer_profiles").select("id,customer_name,customer_contact,tags,notes").eq("shop_id", shopId).limit(300),
      supabase.from("loyalty").select("customer_contact,total_spent,orders_count,last_order_at").eq("shop_id", shopId),
      supabase.from("customer_segments").select("id,name,color").eq("shop_id", shopId),
    ]);
    const byContact = new Map<string, { total_spent: number; orders_count: number; last_order_at: string | null }>();
    for (const l of loyalty || []) byContact.set(l.customer_contact, { total_spent: l.total_spent || 0, orders_count: l.orders_count || 0, last_order_at: l.last_order_at });
    const merged: Customer[] = (profiles || []).map((p) => {
      const stats = byContact.get(p.customer_contact) || { total_spent: 0, orders_count: 0, last_order_at: null };
      return { id: p.id, customer_name: p.customer_name, customer_contact: p.customer_contact, tags: p.tags || [], notes: p.notes, ...stats };
    }).sort((a, b) => b.total_spent - a.total_spent);
    setCustomers(merged);
    setSegments((segs as Segment[]) || []);
  };
  useEffect(() => { void load(); }, [shopId]);

  const addSegment = async () => {
    if (!newSeg.trim()) return;
    const { error } = await supabase.from("customer_segments").insert({ shop_id: shopId, name: newSeg });
    if (error) return toast.error(error.message);
    setNewSeg(""); void load();
  };
  const removeSegment = async (id: string, name: string) => {
    await supabase.from("customer_segments").delete().eq("id", id);
    // Also strip tag from customers
    for (const c of customers.filter((x) => (x.tags || []).includes(name))) {
      await supabase.from("customer_profiles").update({ tags: (c.tags || []).filter((t) => t !== name) }).eq("id", c.id);
    }
    void load();
  };

  const toggleTag = async (c: Customer, tag: string) => {
    const has = (c.tags || []).includes(tag);
    const next = has ? (c.tags || []).filter((t) => t !== tag) : [...(c.tags || []), tag];
    await supabase.from("customer_profiles").update({ tags: next }).eq("id", c.id);
    setCustomers((s) => s.map((x) => x.id === c.id ? { ...x, tags: next } : x));
  };

  const filtered = useMemo(() => customers.filter((c) => {
    if (filter && !(c.tags || []).includes(filter)) return false;
    if (q && !((c.customer_name || "") + " " + (c.customer_contact || "")).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [customers, filter, q]);

  const waSend = (c: Customer) => {
    const phone = (c.customer_contact || "").replace(/\D/g, "") || (whatsapp || "").replace(/\D/g, "");
    if (!phone) return toast.error("Aucun numéro");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="size-7 text-emerald-300" /> Mini-CRM clients</h1>
        <p className="text-white/60 mt-1">Vue 360° de tes clients, avec segments pour cibler tes campagnes.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="font-semibold mb-2">Segments</div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => setFilter(null)} className={`px-3 py-1 rounded-full text-xs border ${!filter ? "bg-white/10 border-white/30" : "border-white/10 text-white/50"}`}>Tous ({customers.length})</button>
          {segments.map((s) => {
            const count = customers.filter((c) => (c.tags || []).includes(s.name)).length;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <button onClick={() => setFilter(s.name)} className={`px-3 py-1 rounded-full text-xs border ${filter === s.name ? "bg-white/10 border-white/30" : "border-white/10 text-white/70"}`}>
                  <span className="inline-block size-2 rounded-full mr-1" style={{ background: s.color }} />
                  {s.name} ({count})
                </button>
                <button onClick={() => removeSegment(s.id, s.name)} className="text-white/30 hover:text-red-300"><Trash2 className="size-3" /></button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input className="input-neon flex-1" placeholder="Nouveau segment (ex: VIP, Prospects, Inactifs)" value={newSeg} onChange={(e) => setNewSeg(e.target.value)} />
          <button onClick={addSegment} className="btn-neon"><Plus className="size-4" /> Créer</button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <input className="input-neon w-full mb-3" placeholder="Rechercher un client…" value={q} onChange={(e) => setQ(e.target.value)} />
        {filtered.length === 0 ? (
          <div className="text-sm text-white/40 py-6 text-center">Aucun client.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-black/30 border border-white/5">
                <div className="flex flex-wrap gap-2 items-start">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium">{c.customer_name || c.customer_contact || "Client anonyme"}</div>
                    <div className="text-xs text-white/50">{c.customer_contact}</div>
                    <div className="text-xs text-white/50 mt-1">
                      {c.orders_count || 0} commandes • {(c.total_spent || 0).toLocaleString()} FCFA
                      {c.last_order_at && " • dernier " + new Date(c.last_order_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <button onClick={() => waSend(c)} className="btn-ghost"><MessageCircle className="size-4" /> WhatsApp</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {segments.map((s) => {
                    const on = (c.tags || []).includes(s.name);
                    return (
                      <button key={s.id} onClick={() => toggleTag(c, s.name)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${on ? "border-white/40 bg-white/10" : "border-white/10 text-white/40"}`}
                        style={on ? { borderColor: s.color, color: s.color } : {}}>
                        {on ? "✓ " : "+ "}{s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
