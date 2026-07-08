import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Plus, Save, Trash2 } from "lucide-react";

type Threshold = { points: number; reward: string };

export function LoyaltyTab({ shopId }: { shopId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [rate, setRate] = useState(1);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Array<{ id: string; customer_contact: string; points: number }>>([]);

  useEffect(() => {
    (async () => {
      const { data: shop } = await supabase.from("shops").select("loyalty_enabled, loyalty_points_per_unit, loyalty_thresholds").eq("id", shopId).limit(1);
      const s = shop?.[0];
      let currentRate = 1;
      if (s) {
        setEnabled(!!s.loyalty_enabled);
        currentRate = Number(s.loyalty_points_per_unit) || 1;
        setRate(currentRate);
        setThresholds(Array.isArray(s.loyalty_thresholds) ? (s.loyalty_thresholds as unknown as Threshold[]) : []);
      }
      const { data: l } = await supabase.from("loyalty").select("id, customer_contact, total_spent").eq("shop_id", shopId).order("total_spent", { ascending: false }).limit(50);
      const rows = (l as Array<{ id: string; customer_contact: string; total_spent: number | null }> | null) || [];
      setMembers(rows.map((r) => ({ id: r.id, customer_contact: r.customer_contact, points: Math.floor(((r.total_spent || 0) / 1000) * currentRate) })));
    })();
  }, [shopId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("shops").update({
      loyalty_enabled: enabled,
      loyalty_points_per_unit: rate,
      loyalty_thresholds: thresholds,
    }).eq("id", shopId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Programme sauvegardé");
  };

  const addThreshold = () => setThresholds([...thresholds, { points: 100, reward: "-10% sur la prochaine commande" }]);
  const updT = (i: number, patch: Partial<Threshold>) => setThresholds(thresholds.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  const rmT = (i: number) => setThresholds(thresholds.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Award className="size-7 text-amber-300" /> Fidélité</h1>
        <p className="text-white/60 mt-1">Récompense tes clients fidèles automatiquement. Rachida attribue les points à chaque commande.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-5" />
          <span>Activer le programme de fidélité</span>
        </label>
        <div>
          <label className="text-sm text-white/70">Points gagnés pour 1000 FCFA dépensés</label>
          <input type="number" min={0} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="input-neon w-40 mt-1" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Paliers de récompense</div>
            <button onClick={addThreshold} className="btn-ghost"><Plus className="size-4" /> Ajouter un palier</button>
          </div>
          <div className="space-y-2">
            {thresholds.length === 0 && <div className="text-sm text-white/40">Aucun palier. Ex : à 100 points → livraison offerte.</div>}
            {thresholds.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="number" value={t.points} onChange={(e) => updT(i, { points: Number(e.target.value) })} className="input-neon w-28" placeholder="Points" />
                <input value={t.reward} onChange={(e) => updT(i, { reward: e.target.value })} className="input-neon flex-1" placeholder="Récompense (ex: -10%, livraison offerte, cadeau)" />
                <button onClick={() => rmT(i)} className="btn-ghost text-red-300"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-neon disabled:opacity-50"><Save className="size-4" /> Sauvegarder</button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="font-semibold mb-3">Top clients fidèles</div>
        {members.length === 0 ? (
          <div className="text-sm text-white/40">Aucun membre pour l'instant.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-white/50"><tr><th className="text-left py-2">Client</th><th className="text-right">Points</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-white/5">
                  <td className="py-2">{m.customer_contact}</td>
                  <td className="text-right font-mono text-amber-300">{m.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
