import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ParticleSphere } from "@/components/landing/ParticleSphere";
import rachidaLogo from "@/assets/rachida-logo.png";

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
    <div className="relative h-[100svh] min-h-[640px] overflow-hidden bg-background text-foreground grid grid-rows-[auto_1fr_auto]">
      <Toaster />

      {/* Fond plein écran */}
      <div className="fixed inset-0 -z-10">
        <ParticleSphere />
        {/* Scrim : plus sombre à droite, là où vit le panneau */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, transparent 0%, transparent 40%, rgba(10,10,14,0.55) 70%, rgba(10,10,14,0.85) 100%), linear-gradient(to bottom, rgba(10,10,14,0.5) 0%, transparent 25%, transparent 75%, rgba(10,10,14,0.7) 100%)",
          }}
        />
      </div>

      {/* Barre du haut */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-sm tracking-tight">
          <img src={rachidaLogo} alt="Rachida AI" className="size-7 object-contain" />
          Rachida<span className="text-gradient-neon">.ai</span>
        </Link>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition tracking-wide uppercase">
          Retour au site
        </Link>
      </header>

      {/* Corps : panneau aligné à droite */}
      <div className="relative z-10 flex items-center justify-center sm:justify-end px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {mode === "login" ? "Connexion" : "Nouvelle boutique"}
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="mt-6 font-display font-bold text-4xl sm:text-5xl leading-[0.95]">
                {mode === "login" ? "Bon retour." : "Créer ma boutique."}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Reprends là où Rachida s'est arrêtée."
                  : "30 secondes. Pas de carte bancaire."}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={submit} className="mt-9 space-y-4">
            <div>
              <label htmlFor="email" className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@boutique.bf"
                className="w-full mt-2 bg-transparent border-0 border-b border-white/20 focus:border-[--color-neon-cyan] focus:outline-none transition py-2.5 text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-2 bg-transparent border-0 border-b border-white/20 focus:border-[--color-neon-cyan] focus:outline-none transition py-2.5 text-base"
              />
            </div>
            <button
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.01] transition disabled:opacity-60"
            >
              {loading ? "Un instant..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
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

      {/* Pied légal */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          En créant un compte, tu acceptes que Rachida AI stocke tes données de boutique pour faire fonctionner le
          service.
        </p>
      </footer>
    </div>
  );
}
