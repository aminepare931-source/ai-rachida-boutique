import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateFlyer, generateVoiceReply } from "@/lib/rachida-media.functions";
import { toast } from "sonner";
import { Download, Image as ImageIcon, Loader2, Mic, Sparkles, Trash2, Wand2 } from "lucide-react";

type Flyer = { id: string; title: string; image_url: string | null; caption: string | null; created_at: string };

export function CreativeTab({ shopId, whatsapp }: { shopId: string; whatsapp: string | null }) {
  const flyerFn = useServerFn(generateFlyer);
  const voiceFn = useServerFn(generateVoiceReply);

  // Flyer state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [style, setStyle] = useState<"moderne" | "africain" | "luxe" | "fun" | "minimal">("moderne");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Flyer[]>([]);

  // Voice state
  const [voiceText, setVoiceText] = useState("");
  const [audio, setAudio] = useState<string | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);

  const loadFlyers = async () => {
    const { data } = await supabase.from("flyers").select("id,title,image_url,caption,created_at")
      .eq("shop_id", shopId).order("created_at", { ascending: false }).limit(20);
    setItems((data as Flyer[]) || []);
  };
  useEffect(() => { void loadFlyers(); }, [shopId]);

  const makeFlyer = async () => {
    if (!title.trim()) return toast.error("Donne un titre");
    setBusy(true); setPreview(null);
    try {
      const r = await flyerFn({ data: { title, subtitle: subtitle || undefined, style, whatsapp: whatsapp || undefined } });
      setPreview(r.image);
      await supabase.from("flyers").insert({ shop_id: shopId, title, prompt: `${style} • ${subtitle}`, image_url: r.image, caption: subtitle });
      void loadFlyers();
      toast.success("Affiche générée ✨");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  };

  const makeVoice = async () => {
    if (!voiceText.trim()) return toast.error("Écris le message");
    setVoiceBusy(true); setAudio(null);
    try {
      const r = await voiceFn({ data: { text: voiceText } });
      setAudio(r.audio);
      toast.success("Audio prêt");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    finally { setVoiceBusy(false); }
  };

  const removeFlyer = async (id: string) => {
    await supabase.from("flyers").delete().eq("id", id);
    setItems((s) => s.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="size-7 text-fuchsia-300" /> Créativité IA
        </h1>
        <p className="text-white/60 mt-1">Génère des affiches promo et des messages vocaux Rachida à partager sur WhatsApp / Insta.</p>
      </div>

      {/* Flyer generator */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <div className="font-semibold flex items-center gap-2"><ImageIcon className="size-4 text-cyan-300" /> Affiche / flyer</div>
          <input className="input-neon w-full" placeholder="Titre (ex: Promo Tabaski -20%)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input-neon w-full" placeholder="Sous-titre / détail (optionnel)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          <select className="input-neon w-full" value={style} onChange={(e) => setStyle(e.target.value as typeof style)}>
            <option value="moderne">Moderne</option>
            <option value="africain">Africain / wax</option>
            <option value="luxe">Luxe</option>
            <option value="fun">Fun / coloré</option>
            <option value="minimal">Minimal</option>
          </select>
          <button onClick={makeFlyer} disabled={busy} className="btn-neon w-full disabled:opacity-50">
            {busy ? <><Loader2 className="size-4 animate-spin" /> Génération…</> : <><Wand2 className="size-4" /> Générer l'affiche</>}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 flex items-center justify-center min-h-[280px]">
          {preview ? (
            <div className="space-y-2">
              <img src={preview} alt="Aperçu affiche" className="max-h-[400px] rounded-lg" />
              <a href={preview} download="affiche.png" className="btn-ghost inline-flex"><Download className="size-4" /> Télécharger</a>
            </div>
          ) : <div className="text-white/40 text-sm">Aperçu apparaîtra ici</div>}
        </div>
      </div>

      {/* Voice */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
        <div className="font-semibold flex items-center gap-2"><Mic className="size-4 text-emerald-300" /> Message vocal Rachida (WhatsApp)</div>
        <textarea rows={3} className="input-neon w-full" placeholder="Écris ce que Rachida doit dire à voix haute…" value={voiceText} onChange={(e) => setVoiceText(e.target.value)} />
        <button onClick={makeVoice} disabled={voiceBusy} className="btn-neon disabled:opacity-50">
          {voiceBusy ? <><Loader2 className="size-4 animate-spin" /> Génération…</> : <><Mic className="size-4" /> Générer l'audio</>}
        </button>
        {audio && (
          <div className="space-y-2">
            <audio controls src={audio} className="w-full" />
            <a href={audio} download="rachida.mp3" className="btn-ghost inline-flex"><Download className="size-4" /> Télécharger MP3</a>
          </div>
        )}
      </div>

      {/* Gallery */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="font-semibold mb-3">Mes affiches</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((f) => (
              <div key={f.id} className="rounded-lg overflow-hidden bg-black/40 border border-white/5 relative group">
                {f.image_url && <img src={f.image_url} alt={f.title} className="w-full aspect-[9/16] object-cover" />}
                <div className="p-2 text-xs truncate">{f.title}</div>
                <button onClick={() => removeFlyer(f.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500/60 rounded p-1"><Trash2 className="size-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
