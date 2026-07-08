import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarClock, Plus, Send, Trash2 } from "lucide-react";

type Post = { id: string; platform: string; content: string; scheduled_for: string; status: string };

export function ScheduleTab({ shopId, whatsapp }: { shopId: string; whatsapp: string | null }) {
  const [items, setItems] = useState<Post[]>([]);
  const [platform, setPlatform] = useState("whatsapp");
  const [content, setContent] = useState("");
  const [when, setWhen] = useState("");

  const load = async () => {
    const { data } = await supabase.from("scheduled_posts").select("id,platform,content,scheduled_for,status")
      .eq("shop_id", shopId).order("scheduled_for", { ascending: true });
    setItems((data as Post[]) || []);
  };
  useEffect(() => { void load(); }, [shopId]);

  const add = async () => {
    if (!content.trim() || !when) return toast.error("Contenu et date requis");
    const { error } = await supabase.from("scheduled_posts").insert({
      shop_id: shopId, platform, content, scheduled_for: new Date(when).toISOString(), status: "planned",
    });
    if (error) return toast.error(error.message);
    setContent(""); setWhen("");
    toast.success("Post programmé");
    void load();
  };

  const publish = (p: Post) => {
    if (p.platform === "whatsapp" && whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(p.content)}`, "_blank");
    } else if (p.platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(p.content)}`, "_blank");
    } else {
      navigator.clipboard.writeText(p.content); toast.success("Contenu copié — colle-le sur " + p.platform);
    }
    supabase.from("scheduled_posts").update({ status: "published" }).eq("id", p.id).then(() => load());
  };

  const remove = async (id: string) => {
    await supabase.from("scheduled_posts").delete().eq("id", id);
    setItems((s) => s.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarClock className="size-7 text-cyan-300" /> Agenda de publications</h1>
        <p className="text-white/60 mt-1">Programme tes posts WhatsApp, Facebook, Instagram et TikTok à l'avance.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
        <div className="grid md:grid-cols-3 gap-2">
          <select className="input-neon" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
          <input type="datetime-local" className="input-neon" value={when} onChange={(e) => setWhen(e.target.value)} />
          <button onClick={add} className="btn-neon"><Plus className="size-4" /> Programmer</button>
        </div>
        <textarea rows={3} className="input-neon w-full" placeholder="Contenu du post…" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="font-semibold mb-3">À venir</div>
        {items.length === 0 ? (
          <div className="text-sm text-white/40">Aucun post programmé.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((p) => (
              <li key={p.id} className="p-3 rounded-lg bg-black/30 border border-white/5 flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/50">{new Date(p.scheduled_for).toLocaleString("fr-FR")} • {p.platform} • {p.status}</div>
                  <div className="text-sm whitespace-pre-wrap">{p.content}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => publish(p)} className="btn-ghost"><Send className="size-4" /></button>
                  <button onClick={() => remove(p.id)} className="btn-ghost text-red-300"><Trash2 className="size-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
