import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, Smartphone, Truck, Save, Loader2 } from "lucide-react";

type Methods = {
  orange_money: { enabled: boolean; number: string };
  moov_money: { enabled: boolean; number: string };
  wave: { enabled: boolean; number: string };
  cash_on_delivery: { enabled: boolean };
};

const DEFAULTS: Methods = {
  orange_money: { enabled: false, number: "" },
  moov_money: { enabled: false, number: "" },
  wave: { enabled: false, number: "" },
  cash_on_delivery: { enabled: true },
};

export function PaymentsTab({ shopId }: { shopId: string }) {
  const [m, setM] = useState<Methods>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("shops").select("payment_methods").eq("id", shopId).single();
      if (data?.payment_methods) setM({ ...DEFAULTS, ...(data.payment_methods as Methods) });
      setLoading(false);
    })();
  }, [shopId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("shops").update({ payment_methods: m }).eq("id", shopId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Moyens de paiement enregistrés — Rachida les proposera automatiquement");
  };

  if (loading) return <div className="text-white/50">Chargement…</div>;

  const Card = ({
    title, icon: Icon, color, enabled, onToggle, number, onNumber, note,
  }: {
    title: string; icon: typeof Wallet; color: string; enabled: boolean;
    onToggle: (v: boolean) => void; number?: string; onNumber?: (v: string) => void; note: string;
  }) => (
    <div className={`p-4 rounded-2xl border ${enabled ? "border-emerald-400/40 bg-emerald-500/5" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="size-5" /></div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-xs text-white/50">{note}</div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-emerald-500 transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-5" />
        </label>
      </div>
      {onNumber && enabled && (
        <input type="tel" placeholder="Numéro (ex: 70 12 34 56)" value={number || ""} onChange={(e) => onNumber(e.target.value)}
          className="input-neon mt-3 w-full" />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Wallet className="size-7 text-emerald-300" /> Paiements</h1>
        <p className="text-white/60 mt-1">Active les moyens que tu acceptes. Rachida les proposera au client au moment de la commande, avec ton numéro.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Orange Money" icon={Smartphone} color="bg-orange-500/20 text-orange-300"
          enabled={m.orange_money.enabled} onToggle={(v) => setM({ ...m, orange_money: { ...m.orange_money, enabled: v } })}
          number={m.orange_money.number} onNumber={(v) => setM({ ...m, orange_money: { ...m.orange_money, number: v } })}
          note="Client fait #144# et envoie sur ton numéro" />
        <Card title="Moov Money" icon={Smartphone} color="bg-blue-500/20 text-blue-300"
          enabled={m.moov_money.enabled} onToggle={(v) => setM({ ...m, moov_money: { ...m.moov_money, enabled: v } })}
          number={m.moov_money.number} onNumber={(v) => setM({ ...m, moov_money: { ...m.moov_money, number: v } })}
          note="Client fait *555# et envoie sur ton numéro" />
        <Card title="Wave" icon={Smartphone} color="bg-cyan-500/20 text-cyan-300"
          enabled={m.wave.enabled} onToggle={(v) => setM({ ...m, wave: { ...m.wave, enabled: v } })}
          number={m.wave.number} onNumber={(v) => setM({ ...m, wave: { ...m.wave, number: v } })}
          note="Sans frais, avec l'appli Wave" />
        <Card title="Paiement à la livraison" icon={Truck} color="bg-emerald-500/20 text-emerald-300"
          enabled={m.cash_on_delivery.enabled} onToggle={(v) => setM({ ...m, cash_on_delivery: { enabled: v } })}
          note="Le client paie en cash en recevant sa commande" />
      </div>

      <button onClick={save} disabled={saving} className="btn-neon disabled:opacity-50">
        {saving ? <><Loader2 className="size-4 animate-spin" /> Enregistrement…</> : <><Save className="size-4" /> Enregistrer</>}
      </button>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/60">
        💡 <span className="text-white/80 font-medium">Bientôt :</span> reçus automatiques envoyés par WhatsApp, vérification photo de la capture de paiement, et lien de paiement instantané qui envoie l'argent directement sur ton téléphone.
      </div>
    </div>
  );
}
