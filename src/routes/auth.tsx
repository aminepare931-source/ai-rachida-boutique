import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ParticleSphere } from "@/components/landing/ParticleSphere";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Rachida AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Compte créé. Bienvenue dans Rachida.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen grid md:grid-cols-2 overflow-hidden">
      <Toaster />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" aria-hidden />

      <div className="relative flex items-center justify-center px-6 py-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> retour
          </Link>

          <div className="mt-6 flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-[--color-neon-violet] to-[--color-neon-cyan] glow-violet">
              <Sparkles className="size-4 text-white" />
            </span>
            Rachida<span className="text-gradient-neon">.ai</span>
          </div>

          <h1 className="mt-8 font-display font-bold text-4xl">
            {mode === "login" ? "Bon retour." : "Créer ma boutique."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Reprends là où Rachida s'est arrêtée."
              : "30 secondes. Pas de carte bancaire."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@boutique.bf"
                className="w-full mt-2 px-4 py-3 rounded-xl glass border border-white/10 focus:border-[--color-neon-violet] focus:outline-none transition bg-transparent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-2 px-4 py-3 rounded-xl glass border border-white/10 focus:border-[--color-neon-violet] focus:outline-none transition bg-transparent"
              />
            </div>
            <button
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.01] transition disabled:opacity-60"
            >
              {loading ? "Connexion..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground w-full text-center"
          >
            {mode === "login" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
            <span className="text-gradient-neon font-medium">
              {mode === "login" ? "Créer ma boutique →" : "Se connecter →"}
            </span>
          </button>
        </motion.div>
      </div>

      <div className="relative hidden md:block overflow-hidden border-l border-white/5">
        <div className="absolute inset-0">
          <ParticleSphere />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-background/20" />
        <div className="relative h-full flex flex-col justify-end p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="glass-strong rounded-2xl p-6 max-w-sm"
          >
            <div className="text-xs uppercase tracking-widest text-[--color-neon-cyan]">Pilotes</div>
            <p className="mt-3 font-display text-xl leading-snug">
              "Rachida a vendu pendant que je dormais. +34% de conversions en 3 semaines."
            </p>
            <div className="mt-4 text-xs text-muted-foreground">— Aminata, boutique mode à Ouaga</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
