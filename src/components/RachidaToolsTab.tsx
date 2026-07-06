import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Sparkles, Loader2, Wand2, Megaphone, Tag, Star, Lightbulb, Share2 } from "lucide-react";
import {
  generateProductDescription,
  generateSocialPost,
  generatePromo,
  suggestPrice,
  generateReviewReply,
  dailyBusinessTip,
} from "@/lib/rachida-tools.functions";

type ToolKey = "desc" | "social" | "promo" | "price" | "review" | "tip";

const TOOLS: { key: ToolKey; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "desc", label: "Description produit", hint: "Décris un produit → fiche vendeuse prête à publier", icon: Wand2 },
  { key: "social", label: "Post réseaux sociaux", hint: "WhatsApp, Facebook, Insta, TikTok", icon: Megaphone },
  { key: "promo", label: "Promo / campagne", hint: "Une mécanique promo qui marche", icon: Sparkles },
  { key: "price", label: "Conseil prix", hint: "Fourchette de prix conseillée", icon: Tag },
  { key: "review", label: "Répondre à un avis", hint: "Réponse pro à un client mécontent ou content", icon: Star },
  { key: "tip", label: "Conseil du jour", hint: "Une action à faire aujourd'hui", icon: Lightbulb },
];

export function RachidaToolsTab({ shopName, whatsapp, sampleProducts }: { shopName: string; whatsapp?: string | null; sampleProducts: string[] }) {
  const [tool, setTool] = useState<ToolKey>("desc");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Sparkles className="size-7 text-violet-300" /> Outils IA de Rachida</h1>
        <p className="text-white/60 mt-1">Elle écrit, elle vend, elle conseille — pour toi.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const active = tool === t.key;
          return (
            <button key={t.key} onClick={() => setTool(t.key)}
              className={`p-3 rounded-xl border text-left transition ${active ? "bg-violet-500/20 border-violet-400/60 shadow-[0_0_20px_rgba(124,92,255,.25)]" : "bg-white/3 border-white/10 hover:bg-white/5"}`}>
              <Icon className="size-4 text-violet-300" />
              <div className="font-medium text-xs mt-2">{t.label}</div>
              <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{t.hint}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
        {tool === "desc" && <DescForm />}
        {tool === "social" && <SocialForm shopName={shopName} whatsapp={whatsapp || undefined} />}
        {tool === "promo" && <PromoForm shopName={shopName} />}
        {tool === "price" && <PriceForm />}
        {tool === "review" && <ReviewForm shopName={shopName} />}
        {tool === "tip" && <TipForm shopName={shopName} sampleProducts={sampleProducts} />}
      </div>
    </div>
  );
}

function OutputBox({ text, whatsapp }: { text: string; whatsapp?: string }) {
  if (!text) return null;
  const copy = () => { navigator.clipboard.writeText(text); toast.success("Copié !"); };
  const shareWA = () => {
    const num = (whatsapp || "").replace(/\D/g, "");
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };
  return (
    <div className="mt-4 rounded-xl bg-black/40 border border-white/10 p-4">
      <div className="whitespace-pre-wrap text-sm text-white/85 leading-relaxed">{text}</div>
      <div className="flex gap-2 mt-3 flex-wrap">
        <button onClick={copy} className="btn-ghost"><Copy className="size-4" /> Copier</button>
        <button onClick={shareWA} className="btn-ghost"><Share2 className="size-4" /> Partager WhatsApp</button>
      </div>
    </div>
  );
}

function useTool<TArgs, TResult extends { text: string }>(fn: (v: { data: TArgs }) => Promise<TResult>) {
  const call = useServerFn(fn as never);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const run = async (args: TArgs) => {
    setLoading(true); setText("");
    try {
      const r = await (call as unknown as (v: { data: TArgs }) => Promise<TResult>)({ data: args });
      setText(r.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally { setLoading(false); }
  };
  return { run, loading, text };
}

function RunButton({ loading, label = "Générer" }: { loading: boolean; label?: string }) {
  return (
    <button type="submit" disabled={loading} className="btn-neon disabled:opacity-50">
      {loading ? <><Loader2 className="size-4 animate-spin" /> Rachida réfléchit…</> : <><Sparkles className="size-4" /> {label}</>}
    </button>
  );
}

/* ---- Forms ---- */
function DescForm() {
  const { run, loading, text } = useTool(generateProductDescription);
  const [name, setName] = useState(""); const [cat, setCat] = useState(""); const [price, setPrice] = useState(""); const [tone, setTone] = useState<"chaleureux" | "pro" | "fun" | "luxe">("chaleureux");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ name, category: cat || undefined, price: price ? Number(price) : undefined, currency: "FCFA", tone, lang: "fr" }); }} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input required placeholder="Nom du produit" value={name} onChange={(e) => setName(e.target.value)} className="input-neon" />
        <input placeholder="Catégorie (ex : robe, huile, bijou)" value={cat} onChange={(e) => setCat(e.target.value)} className="input-neon" />
        <input placeholder="Prix (FCFA)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-neon" />
        <select value={tone} onChange={(e) => setTone(e.target.value as never)} className="input-neon">
          <option value="chaleureux">Ton chaleureux</option>
          <option value="pro">Ton pro</option>
          <option value="fun">Ton fun</option>
          <option value="luxe">Ton luxe</option>
        </select>
      </div>
      <RunButton loading={loading} />
      <OutputBox text={text} />
    </form>
  );
}

function SocialForm({ shopName, whatsapp }: { shopName: string; whatsapp?: string }) {
  const { run, loading, text } = useTool(generateSocialPost);
  const [platform, setPlatform] = useState<"whatsapp" | "facebook" | "instagram" | "tiktok">("whatsapp");
  const [topic, setTopic] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ platform, topic, shopName, whatsapp }); }} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <select value={platform} onChange={(e) => setPlatform(e.target.value as never)} className="input-neon">
          <option value="whatsapp">WhatsApp Status</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>
        <input required placeholder="Sujet (ex : nouvelle collection wax)" value={topic} onChange={(e) => setTopic(e.target.value)} className="input-neon" />
      </div>
      <RunButton loading={loading} />
      <OutputBox text={text} whatsapp={whatsapp} />
    </form>
  );
}

function PromoForm({ shopName }: { shopName: string }) {
  const { run, loading, text } = useTool(generatePromo);
  const [ctx, setCtx] = useState(""); const [goal, setGoal] = useState<"deblocker_stock" | "attirer_nouveaux" | "fideliser" | "fete">("attirer_nouveaux");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ context: `${shopName} — ${ctx}`, goal }); }} className="space-y-3">
      <textarea required rows={3} placeholder="Décris ta boutique et le contexte (ex : trop de stock de sacs, période creuse)" value={ctx} onChange={(e) => setCtx(e.target.value)} className="input-neon" />
      <select value={goal} onChange={(e) => setGoal(e.target.value as never)} className="input-neon">
        <option value="attirer_nouveaux">Attirer nouveaux clients</option>
        <option value="deblocker_stock">Débloquer du stock</option>
        <option value="fideliser">Fidéliser habitués</option>
        <option value="fete">Opération fête</option>
      </select>
      <RunButton loading={loading} />
      <OutputBox text={text} />
    </form>
  );
}

function PriceForm() {
  const { run, loading, text } = useTool(suggestPrice);
  const [product, setProduct] = useState(""); const [cost, setCost] = useState(""); const [market, setMarket] = useState("Burkina Faso");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ product, cost: cost ? Number(cost) : undefined, currency: "FCFA", market }); }} className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <input required placeholder="Produit" value={product} onChange={(e) => setProduct(e.target.value)} className="input-neon md:col-span-2" />
        <input placeholder="Coût de revient (FCFA)" type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="input-neon" />
      </div>
      <input placeholder="Marché" value={market} onChange={(e) => setMarket(e.target.value)} className="input-neon" />
      <RunButton loading={loading} />
      <OutputBox text={text} />
    </form>
  );
}

function ReviewForm({ shopName }: { shopName: string }) {
  const { run, loading, text } = useTool(generateReviewReply);
  const [review, setReview] = useState(""); const [stars, setStars] = useState(3);
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ review, stars, shopName }); }} className="space-y-3">
      <textarea required rows={3} placeholder="Colle l'avis client ici" value={review} onChange={(e) => setReview(e.target.value)} className="input-neon" />
      <select value={stars} onChange={(e) => setStars(Number(e.target.value))} className="input-neon">
        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}★</option>)}
      </select>
      <RunButton loading={loading} />
      <OutputBox text={text} />
    </form>
  );
}

function TipForm({ shopName, sampleProducts }: { shopName: string; sampleProducts: string[] }) {
  const { run, loading, text } = useTool(dailyBusinessTip);
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">Un clic → un conseil concret pour aujourd'hui, basé sur ta boutique.</p>
      <button onClick={() => run({ shopName, productsSample: sampleProducts })} disabled={loading} className="btn-neon disabled:opacity-50">
        {loading ? <><Loader2 className="size-4 animate-spin" /> …</> : <><Lightbulb className="size-4" /> Conseil du jour</>}
      </button>
      <OutputBox text={text} />
    </div>
  );
}
