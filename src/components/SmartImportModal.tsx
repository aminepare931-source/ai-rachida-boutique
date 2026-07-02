import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, MessageSquareText, X, Loader2, Sparkles, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { smartImportProducts, saveImportedProducts } from "@/lib/products-smart-import.functions";

type Extracted = {
  name: string;
  price: number;
  category?: string | null;
  gender?: string | null;
  color?: string | null;
  stock?: number | null;
  description?: string | null;
  image_url?: string | null;
};

type Mode = "menu" | "photo" | "text" | "voice";

export function SmartImportModal({
  shopId,
  onClose,
  onImported,
}: {
  shopId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const smart = useServerFn(smartImportProducts);
  const save = useServerFn(saveImportedProducts);
  const [mode, setMode] = useState<Mode>("menu");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<Extracted[]>([]);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function runImage(file: File) {
    try {
      setBusy(true);
      const dataUrl = await fileToDataUrl(file);
      const r = await smart({ data: { shopId, mode: "image", imageDataUrl: dataUrl } });
      if (!r.products.length) toast.error("Rachida n'a rien reconnu sur la photo. Réessaie avec une image plus nette.");
      setPreview(r.products);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function runText() {
    if (!text.trim()) return toast.error("Écris ou colle ta liste d'abord.");
    try {
      setBusy(true);
      const r = await smart({ data: { shopId, mode: "text", text } });
      if (!r.products.length) toast.error("Rachida n'a pas trouvé de produits. Ajoute des noms et des prix.");
      setPreview(r.products);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voix non supportée sur ce navigateur. Utilise plutôt la photo ou le texte.");
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = true;
    setListening(true);
    let accum = "";
    rec.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) accum += t + " ";
        else interim += t;
      }
      setText((accum + interim).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }
  function stopVoice() {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }

  async function confirmSave() {
    if (!preview.length) return;
    try {
      setBusy(true);
      const r = await save({ data: { shopId, products: preview } });
      toast.success(`${r.inserted} produits ajoutés à ton catalogue`);
      onImported();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-b from-[#0f0f1e] to-[#05060F] border border-white/10 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="font-bold">Ajouter des produits — sans prise de tête</div>
              <div className="text-xs text-white/40">Rachida s'occupe de tout mettre en forme.</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {mode === "menu" && preview.length === 0 && (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-3 gap-3">
                <ChoiceCard icon={Camera} title="Prendre / envoyer une photo" desc="Photo de tes produits, d'un cahier de prix, d'une étiquette. Rachida lit tout." onClick={() => setMode("photo")} accent="from-violet-500 to-purple-500" />
                <ChoiceCard icon={MessageSquareText} title="Coller un texte" desc="Copie ta liste WhatsApp, ton pense-bête, ou tape simplement les prix." onClick={() => setMode("text")} accent="from-cyan-500 to-blue-500" />
                <ChoiceCard icon={Mic} title="Parler à Rachida" desc="Dicte tes produits à voix haute, dans ta langue. Elle comprend." onClick={() => setMode("voice")} accent="from-emerald-500 to-teal-500" />
              </motion.div>
            )}

            {mode === "photo" && preview.length === 0 && (
              <motion.div key="photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <BackBtn onClick={() => setMode("menu")} />
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-violet-400/40 rounded-2xl p-10 text-center hover:bg-violet-500/5 transition">
                    {busy ? (
                      <div className="flex items-center justify-center gap-2 text-white/70">
                        <Loader2 className="animate-spin" size={18} /> Rachida analyse la photo…
                      </div>
                    ) : (
                      <>
                        <Camera className="mx-auto mb-3 text-violet-300" size={32} />
                        <div className="font-medium">Touche ici pour prendre une photo ou en choisir une</div>
                        <div className="text-xs text-white/40 mt-1">Une liste de prix, une étiquette, une capture WhatsApp… tout marche.</div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void runImage(f); }}
                  />
                </label>
              </motion.div>
            )}

            {(mode === "text" || mode === "voice") && preview.length === 0 && (
              <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <BackBtn onClick={() => setMode("menu")} />
                {mode === "voice" && (
                  <div className="flex items-center gap-2">
                    {!listening ? (
                      <button onClick={startVoice} className="btn-neon"><Mic size={14} /> Parler</button>
                    ) : (
                      <button onClick={stopVoice} className="btn-ghost text-red-300"><Mic size={14} /> Arrêter</button>
                    )}
                    {listening && <span className="text-xs text-emerald-300 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> J'écoute…</span>}
                  </div>
                )}
                <textarea
                  className="input-neon w-full min-h-[180px]"
                  placeholder={
                    mode === "voice"
                      ? "Ce que tu dis apparaîtra ici. Exemple : « J'ai des sacs en cuir à 15 000 francs, du beurre de karité à 2500, boubou wax femme 25000 »"
                      : "Colle ta liste WhatsApp, ou écris librement. Exemple :\n- Sac cuir 15000f\n- Karité 2500\n- Boubou wax femme 25 000 FCFA\n- Chaussures homme taille 42 : 12500"
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button onClick={runText} disabled={busy} className="btn-neon w-full">
                  {busy ? <><Loader2 className="animate-spin" size={14} /> Rachida trie tes produits…</> : <><Sparkles size={14} /> Que Rachida fasse la mise en forme</>}
                </button>
              </motion.div>
            )}

            {preview.length > 0 && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="text-sm text-white/70">
                  ✨ Rachida a préparé <b className="text-white">{preview.length}</b> produit{preview.length > 1 ? "s" : ""}. Vérifie et ajuste si besoin.
                </div>
                <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                  {preview.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 grid grid-cols-12 gap-2 items-center">
                      <input className="input-neon col-span-5" value={p.name} onChange={(e) => setPreview((x) => x.map((q, j) => j === i ? { ...q, name: e.target.value } : q))} />
                      <input type="number" className="input-neon col-span-3" value={p.price} onChange={(e) => setPreview((x) => x.map((q, j) => j === i ? { ...q, price: Number(e.target.value) || 0 } : q))} />
                      <input className="input-neon col-span-3" placeholder="catégorie" value={p.category ?? ""} onChange={(e) => setPreview((x) => x.map((q, j) => j === i ? { ...q, category: e.target.value } : q))} />
                      <button onClick={() => setPreview((x) => x.filter((_, j) => j !== i))} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setPreview([])} className="btn-ghost">Recommencer</button>
                  <button onClick={confirmSave} disabled={busy || !preview.length} className="btn-neon">
                    {busy ? <><Loader2 className="animate-spin" size={14} /> Ajout…</> : <><Check size={14} /> Ajouter au catalogue</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function ChoiceCard({ icon: Icon, title, desc, onClick, accent }: { icon: any; title: string; desc: string; onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick} className="text-left group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-400/40 transition overflow-hidden">
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl group-hover:opacity-40 transition`} />
      <Icon className="mb-3 text-white/80" size={22} />
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-xs text-white/50 leading-snug">{desc}</div>
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="text-xs text-white/50 hover:text-white/80">← Retour</button>;
}
