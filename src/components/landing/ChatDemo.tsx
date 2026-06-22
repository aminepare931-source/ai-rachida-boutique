import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Heart, Sparkles } from "lucide-react";

type Msg = { id: number; role: "user" | "ai"; text: string; emotion?: "positive" | "negative" | "neutral" };

const script: Msg[] = [
  { id: 1, role: "user", text: "Salut, je cherche des chaussures noires homme à moins de 25 000 FCFA", emotion: "neutral" },
  { id: 2, role: "ai", text: "Bonjour ! J'ai 3 modèles qui correspondent. Le plus populaire : Sneakers Urban Noir à 22 500 FCFA. Tu veux que je te montre ?" },
  { id: 3, role: "user", text: "C'est un peu cher, tu peux faire mieux ?", emotion: "negative" },
  { id: 4, role: "ai", text: "Je comprends. Je peux te le faire à 20 500 FCFA (-9%) avec livraison gratuite à Ouaga. On valide ?" },
  { id: 5, role: "user", text: "Parfait, je prends !", emotion: "positive" },
  { id: 6, role: "ai", text: "Excellent choix ✨ Commande créée. Quel numéro WhatsApp pour la livraison ?" },
];

const emotionColor: Record<string, string> = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  neutral: "text-cyan-400",
};

export function ChatDemo() {
  const [shown, setShown] = useState<Msg[]>([]);

  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (i >= script.length) {
        timer = setTimeout(() => {
          setShown([]);
          i = 0;
          tick();
        }, 4000);
        return;
      }
      setShown((prev) => [...prev, script[i]]);
      i++;
      timer = setTimeout(tick, 1600);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="glass-strong rounded-3xl p-5 sm:p-6 w-full max-w-md font-sans">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
        <div className="size-9 rounded-full bg-gradient-to-br from-[--color-neon-violet] to-[--color-neon-cyan] grid place-items-center">
          <Sparkles className="size-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold">Rachida</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 pulse-glow" /> en ligne
          </div>
        </div>
      </div>
      <div className="space-y-2.5 min-h-[280px]">
        <AnimatePresence initial={false}>
          {shown.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] px-3.5 py-2 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm"
                    : "max-w-[85%] text-sm text-foreground"
                }
              >
                {m.role === "user" && m.emotion && (
                  <div className={`flex items-center gap-1 text-[10px] mb-1 ${emotionColor[m.emotion]}`}>
                    <Heart className="size-2.5" /> {m.emotion}
                  </div>
                )}
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
