import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Brain,
  ShoppingBag,
  Languages,
  HeartHandshake,
  Eye,
  Zap,
  MessageSquare,
  TrendingUp,
  Check,
  Copy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ParticleSphere } from "@/components/landing/ParticleSphere";
import { ChatDemo } from "@/components/landing/ChatDemo";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Counter } from "@/components/landing/Counter";
import rachidaAvatar from "@/assets/rachida-avatar.png";
import rachidaLogo from "@/assets/rachida-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rachida AI — La vendeuse IA des boutiques africaines" },
      {
        name: "description",
        content:
          "Rachida est une IA commerciale qui parle français, mooré et dioula. Elle conseille, négocie, vend et fidélise vos clients 24h/24.",
      },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-foreground">
      <SmoothScroll />
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" aria-hidden />
      <Nav />
      <Hero />
      <LogoStrip />
      <DemoSection />
      <CapabilitiesSection />
      <HowItWorksSection />
      <StatsSection />
      <LanguagesSection />
      <NoCodeInstallSection />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4">
      <div className="mx-auto max-w-6xl glass rounded-2xl px-5 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="relative grid place-items-center size-9 rounded-xl overflow-hidden">
            <img src={rachidaLogo} alt="Rachida AI" className="size-9 object-contain" />
            <span className="absolute inset-0 rounded-xl glow-violet opacity-60" aria-hidden />
          </span>
          <span>Rachida<span className="text-gradient-neon">.ai</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#capacites" className="hover:text-foreground transition">Capacités</a>
          <a href="#demo" className="hover:text-foreground transition">Démo</a>
          <a href="#comment" className="hover:text-foreground transition">Comment ça marche</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
            Connexion
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:scale-[1.02] transition glow-violet"
          >
            Démarrer <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100svh] flex items-center pt-32 pb-20 px-6">
      <div className="absolute inset-0 -z-0">
        <div className="absolute inset-0 opacity-90">
          <ParticleSphere />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 pulse-glow" />
          Nouvelle génération · IA commerciale 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-6 font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight"
        >
          La vendeuse IA<br />
          qui <span className="text-gradient-neon">ne dort jamais.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground"
        >
          Rachida comprend votre catalogue, conseille en français, mooré et dioula, négocie intelligemment,
          détecte les émotions et clôt des ventes pendant que vous dormez.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.03] transition"
          >
            Activer Rachida sur mon site
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold glass hover:bg-white/5 transition"
          >
            Voir la démo live
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-14 text-xs text-muted-foreground/60 tracking-widest uppercase"
        >
          Installation en 2 min · sans code · 100% français
        </motion.div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const items = ["Boutiques", "Restaurants", "Mode", "Cosmétique", "Électronique", "Services"];
  return (
    <section className="relative py-10 border-y border-white/5">
      <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground/70">
        <span className="text-xs uppercase tracking-widest">Pensé pour</span>
        {items.map((i) => (
          <span key={i} className="font-display font-medium">{i}</span>
        ))}
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-center">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
            <MessageSquare className="size-3 text-[--color-neon-cyan]" /> Démo live
          </div>
          <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl leading-tight">
            Elle parle comme une <span className="text-gradient-neon">vraie vendeuse.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Pas un chatbot scripté. Rachida lit l'intention, détecte la frustration, propose une remise dans la limite
            que vous fixez, et clôt la vente naturellement.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              { icon: Brain, text: "Mémoire persistante par client" },
              { icon: HeartHandshake, text: "Négociation dans vos règles de remise" },
              { icon: TrendingUp, text: "Scoring lead et détection d'achat automatique" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid place-items-center size-7 rounded-lg glass">
                  <Icon className="size-3.5 text-[--color-neon-cyan]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute -inset-10 bg-gradient-to-br from-[--color-neon-violet]/20 via-transparent to-[--color-neon-cyan]/20 blur-3xl -z-10" />
          <div className="float">
            <ChatDemo />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const caps = [
    {
      icon: Brain,
      title: "Cerveau commercial",
      desc: "Analyse budget, besoin, historique. Recommande le bon produit, au bon moment.",
      span: "md:col-span-2 md:row-span-2",
      glow: "from-[--color-neon-violet]/30",
    },
    { icon: HeartHandshake, title: "Négociation intelligente", desc: "Remise plafonnée par boutique. Justifiée à chaque fois.", glow: "from-[--color-neon-cyan]/30" },
    { icon: Eye, title: "Vision IA", desc: "Lit les preuves Mobile Money, identifie un produit par photo.", glow: "from-[--color-neon-pink]/30" },
    { icon: Languages, title: "FR · Mooré · Dioula", desc: "Détecte la langue du client et répond automatiquement.", glow: "from-[--color-neon-gold]/30" },
    { icon: ShoppingBag, title: "Panier conversationnel", desc: "Ajoute, modifie, valide — sans quitter le chat.", glow: "from-[--color-neon-violet]/30" },
    { icon: Zap, title: "Relances & fidélité", desc: "Relance en cas d'absence, suit la fidélité, recommande au bon moment.", glow: "from-[--color-neon-cyan]/30" },
  ];
  return (
    <section id="capacites" className="relative py-32 px-6">
      <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
          <Sparkles className="size-3 text-[--color-neon-violet]" /> Capacités
        </div>
        <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl">
          Une plateforme, <span className="text-gradient-neon">douze talents.</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Pensée comme une commerciale d'élite. Pas comme un widget de plus.
        </p>
      </motion.div>

      <div className="mt-14 mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[180px]">
        {caps.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className={`group relative glass rounded-3xl p-6 overflow-hidden ${c.span ?? ""}`}
          >
            <div className={`absolute -inset-x-10 -top-20 h-40 bg-gradient-to-b ${c.glow} to-transparent blur-2xl opacity-50 group-hover:opacity-90 transition`} />
            <div className="relative">
              <div className="grid place-items-center size-11 rounded-xl glass-strong">
                <c.icon className="size-5 text-[--color-neon-cyan]" />
              </div>
              <h3 className="mt-4 font-display font-semibold text-xl">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: "01", t: "Crée ta boutique", d: "Email + nom. 30 secondes." },
    { n: "02", t: "Ajoute ton catalogue", d: "CSV, manuel ou import en lot. Rachida l'apprend automatiquement." },
    { n: "03", t: "Colle le script", d: "Une ligne sur ton site. Rachida est en ligne 24h/24." },
  ];
  return (
    <section id="comment" className="relative py-32 px-6">
      <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
        <h2 className="font-display font-bold text-4xl sm:text-5xl">
          3 étapes. <span className="text-gradient-neon">Pas une de plus.</span>
        </h2>
      </motion.div>
      <div className="mt-14 mx-auto max-w-5xl grid md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="relative glass rounded-3xl p-7"
          >
            <div className="font-mono text-5xl font-bold text-gradient-neon">{s.n}</div>
            <h3 className="mt-4 font-display font-semibold text-xl">{s.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { v: 24, suffix: "h/24", l: "Disponibilité" },
    { v: 3, suffix: "", l: "Langues parlées" },
    { v: 92, suffix: "%", l: "Satisfaction pilotes" },
    { v: 2, suffix: " min", l: "Pour installer" },
  ];
  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-6xl glass-strong rounded-3xl p-10 sm:p-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="font-display font-bold text-4xl sm:text-5xl text-gradient-neon">
              <Counter to={s.v} suffix={s.suffix} />
            </div>
            <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LanguagesSection() {
  const langs = [
    { code: "FR", name: "Français", sample: "Bonjour, je peux vous aider à choisir ?" },
    { code: "MOS", name: "Mooré", sample: "Ne y windga, m tõe n sõng-y la ?" },
    { code: "DYU", name: "Dioula", sample: "I ni ce, ne bɛ se ka i dɛmɛ wa ?" },
  ];
  return (
    <section className="relative py-24 px-6">
      <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
        <h2 className="font-display font-bold text-4xl sm:text-5xl">
          Elle parle <span className="text-gradient-neon">la langue de vos clients.</span>
        </h2>
      </motion.div>
      <div className="mt-12 mx-auto max-w-5xl grid md:grid-cols-3 gap-5">
        {langs.map((l, i) => (
          <motion.div
            key={l.code}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 grid place-items-center rounded-xl bg-gradient-to-br from-[--color-neon-violet]/40 to-[--color-neon-cyan]/40 font-mono text-xs font-bold">
                {l.code}
              </div>
              <div className="font-display font-semibold">{l.name}</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground italic">"{l.sample}"</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative py-32 px-6">
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-4xl glass-strong rounded-[2.5rem] p-12 sm:p-20 text-center overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] bg-[--color-neon-violet]/20 blur-[120px] rounded-full" />
        <div className="relative">
          <h2 className="font-display font-bold text-4xl sm:text-6xl leading-tight">
            Donnez à votre boutique<br />
            <span className="text-gradient-neon">une vraie vendeuse.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto">
            Gratuit pendant la beta. Aucune carte bancaire requise.
          </p>
          <Link
            to="/auth"
            className="mt-9 inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.03] transition"
          >
            Activer Rachida <ArrowRight className="size-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function NoCodeInstallSection() {
  const snippet = `<script src="https://rachida.ai/widget/rachida.js" data-shop="VOTRE-ID"></script>`;
  const methods = [
    {
      icon: "1",
      title: "Copier-coller (site web)",
      desc: "Ajoutez cette ligne avant </body> de votre site Wix, Shopify, WordPress ou autre. Aucune compétence requise.",
      action: "snippet" as const,
    },
    {
      icon: "2",
      title: "Lien WhatsApp prêt",
      desc: "On vous génère un numéro WhatsApp connecté à Rachida. Partagez-le sur vos statuts, votre bio Instagram, vos affiches.",
      action: "wa" as const,
    },
    {
      icon: "3",
      title: "Page boutique offerte",
      desc: "Pas de site ? On vous donne un lien rachida.ai/votre-boutique avec votre catalogue et Rachida intégrée.",
      action: "page" as const,
    },
  ];
  const copy = () => {
    navigator.clipboard?.writeText(snippet);
  };
  return (
    <section className="relative py-24 px-6">
      <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-5">
          <Zap className="size-3 text-[--color-neon-cyan]" /> Pour tout le monde
        </div>
        <h2 className="font-display font-bold text-4xl sm:text-5xl">
          Vous ne savez pas coder ? <span className="text-gradient-neon">Aucun problème.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          3 façons d'installer Rachida en moins de 2 minutes — choisissez celle qui vous ressemble.
        </p>
      </motion.div>
      <div className="mt-14 mx-auto max-w-6xl grid md:grid-cols-3 gap-5">
        {methods.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass rounded-3xl p-6 flex flex-col"
          >
            <div className="size-10 grid place-items-center rounded-xl bg-gradient-to-br from-[--color-neon-violet] to-[--color-neon-cyan] font-display font-bold">
              {m.icon}
            </div>
            <h3 className="mt-4 font-display font-semibold text-lg">{m.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground flex-1">{m.desc}</p>
            {m.action === "snippet" && (
              <div className="mt-4">
                <div className="rounded-xl bg-black/40 border border-white/10 p-3 font-mono text-[11px] text-cyan-200 overflow-x-auto">
                  {snippet}
                </div>
                <button
                  onClick={copy}
                  className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  Copier le code
                </button>
              </div>
            )}
            {m.action === "wa" && (
              <Link
                to="/auth"
                className="mt-4 text-xs px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition text-center"
              >
                Activer le WhatsApp
              </Link>
            )}
            {m.action === "page" && (
              <Link
                to="/auth"
                className="mt-4 text-xs px-3 py-2 rounded-lg bg-primary/30 hover:bg-primary/40 transition text-center"
              >
                Créer ma page
              </Link>
            )}
          </motion.div>
        ))}
      </div>
      <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto">
        Besoin d'aide ? Notre équipe installe Rachida pour vous gratuitement — envoyez-nous votre lien boutique sur WhatsApp.
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-10 px-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Rachida AI · Pensé au Burkina Faso, conçu pour toute l'Afrique.
    </footer>
  );
}
