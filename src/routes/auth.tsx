import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Rocket, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import rachidaLogo from "@/assets/rachida-logo.png";

type AuthSearch = { mode?: "login" | "signup" };

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Rachida AI" }] }),
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search.mode === "signup" ? "signup" : "login",
  }),
  component: AuthPage,
});

const BUSINESS_TYPES = ["Boutique", "Restaurant", "Autre"] as const;

function AuthPage() {
  const nav = useNavigate();
  const { mode: initialMode } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"login" | "signup">(initialMode ?? "login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessType, setBusinessType] = useState<(typeof BUSINESS_TYPES)[number]>("Boutique");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !agreed) {
      toast.error("Merci d'accepter les conditions d'utilisation.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { first_name: firstName, last_name: lastName, business_type: businessType },
          },
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

  const isSignup = mode === "signup";

  return (
    <>
      <Toaster />
      <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      {/* Panneau visuel */}
      <div className="relative hidden lg:block overflow-hidden bg-[#0c0a14]">
        <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-gradient-to-br from-[--color-neon-violet] to-transparent opacity-40 blur-3xl" />
        <div className="absolute top-1/3 -right-20 size-[360px] rounded-full bg-gradient-to-br from-[--color-neon-cyan] to-transparent opacity-25 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 size-[300px] rounded-full bg-gradient-to-br from-[--color-neon-violet] to-transparent opacity-30 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-30" />

        <div className="relative h-full flex flex-col justify-between p-10">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-semibold">
            <img src={rachidaLogo} alt="Rachida AI" className="size-8 object-contain" />
            Rachida<span className="text-gradient-neon">.ai</span>
          </Link>

          <div>
            <h2 className="font-display font-bold text-4xl xl:text-5xl leading-[1.05]">
              Discutez.<br />Vendez.<br />Grandissez.
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Une vendeuse IA pensée pour les commerces du Burkina Faso, disponible 24h/24 en français, mooré et
              dioula.
            </p>

            <div className="mt-8 liquid-glass rounded-2xl p-4 max-w-sm flex items-start gap-3">
              <span className="grid place-items-center size-9 rounded-xl bg-white/10 shrink-0">
                <Rocket className="size-4 text-[--color-neon-cyan]" />
              </span>
              <p className="text-sm text-muted-foreground">
                En beta ouverte : gratuit, sans carte bancaire, et vos retours façonnent directement le produit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau formulaire */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 font-display font-semibold mb-8">
            <img src={rachidaLogo} alt="Rachida AI" className="size-7 object-contain" />
            Rachida<span className="text-gradient-neon">.ai</span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-display font-bold text-3xl">
                {isSignup ? "Créer votre compte" : "Bon retour."}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isSignup ? "Activez Rachida — c'est gratuit pendant la beta." : "Connectez-vous à votre tableau de bord."}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="text-xs font-medium text-muted-foreground">Prénom</label>
                  <input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Awa"
                    className="input-neon mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="text-xs font-medium text-muted-foreground">Nom</label>
                  <input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ouédraogo"
                    className="input-neon mt-1.5"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">Adresse email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@boutique.bf"
                className="input-neon mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground">Mot de passe</label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? "Créer un mot de passe" : "••••••••"}
                  className="input-neon pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Type de commerce</div>
                <div className="flex gap-2">
                  {BUSINESS_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBusinessType(t)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition ${
                        businessType === t
                          ? "border-[--color-neon-violet] bg-[--color-neon-violet]/10 text-foreground"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      <Store className="size-3" /> {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSignup && (
              <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 size-3.5 rounded border-white/20 bg-transparent accent-[--color-neon-violet]"
                />
                J'accepte les conditions d'utilisation de Rachida AI.
              </label>
            )}

            <button
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.01] transition disabled:opacity-60"
            >
              {loading ? "Un instant..." : isSignup ? "Créer mon compte" : "Se connecter"}
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <button
              onClick={() => setMode(isSignup ? "login" : "signup")}
              className="text-gradient-neon font-medium"
            >
              {isSignup ? "Se connecter" : "Créer mon compte"}
            </button>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
