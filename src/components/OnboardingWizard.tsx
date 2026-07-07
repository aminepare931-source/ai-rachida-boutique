import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, X, Sparkles, Rocket, Store, Wallet, Package } from "lucide-react";

type Shop = { id: string; name: string; whatsapp: string | null; slug: string };

export function OnboardingWizard({ shop, onDone }: { shop: Shop; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(shop.name || "Ma Boutique");
  const [whatsapp, setWhatsapp] = useState(shop.whatsapp || "");
  const [orangeNum, setOrangeNum] = useState("");
  const [waveNum, setWaveNum] = useState("");
  const [saving, setSaving] = useState(false);

  const steps = [
    { icon: Store, title: "Nom de ta boutique" },
    { icon: Sparkles, title: "Ton WhatsApp" },
    { icon: Wallet, title: "Paiements" },
    { icon: Rocket, title: "C'est parti !" },
  ];
  const Icon = steps[step].icon;

  const next = async () => {
    if (step === 0 && !name.trim()) return toast.error("Donne un nom à ta boutique");
    if (step === 1 && !whatsapp.trim()) return toast.error("Ton numéro WhatsApp est essentiel");
    if (step < steps.length - 1) return setStep(step + 1);
    setSaving(true);
    const { error } = await supabase.from("shops").update({
      name, whatsapp,
      payment_methods: {
        orange_money: { enabled: !!orangeNum, number: orangeNum },
        moov_money: { enabled: false, number: "" },
        wave: { enabled: !!waveNum, number: waveNum },
        cash_on_delivery: { enabled: true },
      },
      onboarding_done: true,
    }).eq("id", shop.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Rachida est prête !");
    onDone();
  };

  const skip = async () => {
    await supabase.from("shops").update({ onboarding_done: true }).eq("id", shop.id);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0b0c1a] border border-violet-400/30 rounded-3xl p-6 md:p-8 relative shadow-2xl shadow-violet-500/20">
        <button onClick={skip} className="absolute top-4 right-4 text-white/40 hover:text-white/80"><X className="size-5" /></button>

        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-violet-500" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/40">
          <Icon className="size-7" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm">Le nom que tes clients verront quand Rachida leur parle.</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boutique Awa" className="input-neon w-full text-lg" />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm">Numéro où tu reçois les commandes. Sans ça, Rachida ne peut envoyer personne chez toi.</p>
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+226 70 12 34 56" className="input-neon w-full text-lg" />
            <div className="text-xs text-white/40">Format international avec l'indicatif du pays.</div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm">Comment tes clients peuvent te payer. Tu peux tout modifier plus tard.</p>
            <div>
              <label className="text-xs text-orange-300 mb-1 block">Orange Money (optionnel)</label>
              <input value={orangeNum} onChange={(e) => setOrangeNum(e.target.value)} placeholder="70 12 34 56" className="input-neon w-full" />
            </div>
            <div>
              <label className="text-xs text-cyan-300 mb-1 block">Wave (optionnel)</label>
              <input value={waveNum} onChange={(e) => setWaveNum(e.target.value)} placeholder="70 12 34 56" className="input-neon w-full" />
            </div>
            <div className="text-xs text-emerald-300">✓ Paiement à la livraison activé par défaut</div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-white/70">Rachida connaît maintenant l'essentiel. Prochaine étape recommandée :</p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2 items-start"><Package className="size-4 text-violet-300 mt-0.5 shrink-0" /> Ajoute tes produits avec <b>Ajout intelligent</b> (photo, texte, voix)</li>
              <li className="flex gap-2 items-start"><CheckCircle2 className="size-4 text-emerald-300 mt-0.5 shrink-0" /> Partage ta boutique par WhatsApp ou colle ton site actuel dans <b>Site 1-clic</b></li>
              <li className="flex gap-2 items-start"><Sparkles className="size-4 text-cyan-300 mt-0.5 shrink-0" /> Demande à Rachida des <b>descriptions</b> et <b>posts sociaux</b> dans l'onglet Outils IA</li>
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center gap-3">
          <button onClick={skip} className="text-sm text-white/40 hover:text-white/70">Passer</button>
          <button onClick={next} disabled={saving} className="btn-neon disabled:opacity-50">
            {saving ? "…" : step === steps.length - 1 ? <>Ouvrir mon tableau de bord <ArrowRight className="size-4" /></> : <>Suivant <ArrowRight className="size-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
