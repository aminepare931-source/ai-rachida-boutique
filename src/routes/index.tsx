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
  MapPin,
  Rocket,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ParticleSphere } from "@/components/landing/ParticleSphere";
import { RachidaWidget } from "@/components/RachidaWidget";
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
      <AboutBlock />
      <LogoStrip />
      <MockupSection />
      <CapabilitiesSection />
      <HowItWorksSection />
      <LanguagesSection />
      <NoCodeInstallSection />
      <PricingSection />
      <FinalCta />
      <Footer />
      <RachidaWidget shop="demo" mode="platform" />
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
    <section className="relative min-h-[100svh] pt-36 pb-16 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-0">
        <div className="absolute inset-0 opacity-70">
          <ParticleSphere />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Colonne texte */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400 pulse-glow" />
              Vendeuse IA · faite pour l'Afrique de l'Ouest
            </div>

            <h1 className="mt-6 font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              Votre équipe<br />
              de vente IA,<br />
              <span className="text-shiny-neon">à la demande.</span>
            </h1>

            <p className="mt-6 max-w-md text-base sm:text-lg text-muted-foreground">
              Rachida comprend votre catalogue, conseille en français, mooré et dioula, négocie intelligemment et clôt
              des ventes pendant que vous dormez.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.03] transition"
              >
                Activer Rachida
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#capacites"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold glass hover:bg-white/5 transition"
              >
                Voir les capacités
              </a>
            </div>

            {/* Cartes stats */}
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
              {[
                { v: 24, suffix: "h/24", l: "Disponible" },
                { v: 3, suffix: "", l: "Langues" },
                { v: 2, suffix: " min", l: "Installation" },
              ].map((s) => (
                <div key={s.l} className="liquid-glass rounded-2xl px-3 py-4 text-center">
                  <div className="font-display font-bold text-2xl">
                    <Counter to={s.v} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground uppercase tracking-wide">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Visuel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="size-[70%] rounded-full bg-[--color-neon-violet]/30 blur-[100px]" />
            </div>
            <img
              src={rachidaAvatar}
              alt="Rachida — vendeuse IA"
              width={1024}
              height={1024}
              className="float w-[70vw] max-w-sm lg:max-w-md drop-shadow-[0_40px_100px_rgba(139,92,246,0.5)]"
            />

            {/* Carte flottante — info IA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="hidden sm:block absolute top-2 right-0 liquid-glass rounded-2xl p-4 w-40"
            >
              <Sparkles className="size-4 text-[--color-neon-cyan]" />
              <div className="mt-3 font-display font-bold text-lg">Gemini AI</div>
              <div className="text-[11px] text-muted-foreground">Comprend photo, texte et intention d'achat</div>
            </motion.div>

            {/* Carte flottante — beta */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="hidden sm:block absolute bottom-4 -left-4 liquid-glass rounded-2xl p-4 w-44"
            >
              <Rocket className="size-4 text-[--color-neon-violet]" />
              <div className="mt-3 font-display font-bold text-lg">Beta ouverte</div>
              <div className="text-[11px] text-muted-foreground mb-3">Gratuit, sans carte bancaire</div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[--color-neon-cyan] hover:underline"
              >
                Rejoindre <ArrowRight className="size-3" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-16 text-center text-xs text-muted-foreground/60 tracking-widest uppercase">
          Installation en 2 min · sans code · 100% français
        </div>
      </div>
    </section>
  );
}

function AboutBlock() {
  return (
    <section id="capacites-intro" className="relative py-20 px-6">
      <motion.div {...fadeUp} className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
          <MapPin className="size-3 text-[--color-neon-cyan]" /> Notre mission
        </div>
        <p className="mt-6 font-display font-semibold text-2xl sm:text-4xl leading-tight">
          Nous <span className="text-shiny-neon">concevons</span> une vendeuse{" "}
          <span className="text-shiny-neon">IA</span> pensée pour vos clients, pour que chaque{" "}
          <span className="text-shiny-neon">conversation</span> se termine par une vente.
        </p>
      </motion.div>

      <div className="mt-14 mx-auto max-w-5xl grid md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="liquid-glass rounded-3xl p-8"
        >
          <MapPin className="size-5 text-[--color-neon-cyan]" />
          <h3 className="mt-4 font-display font-bold text-2xl">
            Pensée au <span className="text-shiny-neon">Burkina Faso.</span>
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Conçue pour le marché ouest-africain : Mobile Money, livraison locale, français, mooré et dioula. Pas une
            traduction d'un produit occidental.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:gap-3 transition-all"
          >
            Activer Rachida <ArrowRight className="size-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="liquid-glass rounded-3xl p-8"
        >
          <Rocket className="size-5 text-[--color-neon-violet]" />
          <h3 className="mt-4 font-display font-bold text-2xl">
            En <span className="text-shiny-neon">beta ouverte.</span>
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Le produit se construit encore. Les premiers commerçants qui l'activent façonnent directement les
            prochaines fonctionnalités.
          </p>
          <a href="#demo" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:gap-3 transition-all">
            Voir Rachida en action <ArrowRight className="size-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const items = ["Boutiques", "Restaurants", "Mode", "Cosmétique", "Électronique", "Services"];
  return (
    <section className="relative py-14 border-y border-white/5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground/60 mb-6">
          Pensée pour tous les commerces
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {items.map((i) => (
            <span
              key={i}
              className="glass rounded-full px-4 py-2 text-sm font-display font-medium text-muted-foreground/90"
            >
              {i}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MockupSection() {
  const [tab, setTab] = useState<"chat" | "dashboard">("chat");

  return (
    <section id="demo" className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
            <MessageSquare className="size-3 text-[--color-neon-cyan]" /> En conditions réelles
          </div>
          <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl leading-tight">
            Elle parle comme une <span className="text-shiny-neon">vraie vendeuse.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Pas un chatbot scripté. Rachida lit l'intention, détecte la frustration, propose une remise dans la limite
            que vous fixez, et clôt la vente naturellement — pendant que vous, vous gardez un œil sur vos ventes.
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
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute -inset-10 bg-gradient-to-br from-[--color-neon-violet]/20 via-transparent to-[--color-neon-cyan]/20 blur-3xl -z-10" />
          <div className="liquid-glass rounded-3xl overflow-hidden">
            {/* Barre de titre style macOS */}
            <div className="flex items-center justify-between px-4 h-10 bg-black/30 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-white/50">
                Rachida — {tab === "chat" ? "Conversation" : "Tableau de bord"}
              </span>
              <span className="w-12" aria-hidden />
            </div>

            {/* Onglets */}
            <div className="flex border-b border-white/10 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTab("chat")}
                className={`flex-1 py-2.5 transition ${tab === "chat" ? "text-foreground bg-white/5" : "text-muted-foreground hover:text-foreground"}`}
              >
                Conversation
              </button>
              <button
                type="button"
                onClick={() => setTab("dashboard")}
                className={`flex-1 py-2.5 transition ${tab === "dashboard" ? "text-foreground bg-white/5" : "text-muted-foreground hover:text-foreground"}`}
              >
                Tableau de bord
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 sm:p-7 min-h-[340px] flex flex-col">
              {tab === "chat" ? (
                <div className="flex-1 flex flex-col">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-4">
                    Exemple d'échange
                  </p>
                  <div className="space-y-3 flex-1">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm glass px-4 py-2.5 text-sm">
                      Bonjour, vous avez des sneakers noires pour homme en dessous de 25 000 FCFA ?
                    </div>
                    <div className="max-w-[85%] ml-auto rounded-2xl rounded-tr-sm bg-primary/20 px-4 py-2.5 text-sm">
                      Oui ! J'ai deux modèles à 22 500 et 24 000 FCFA, taille 40 à 44 en stock. Vous voulez que je vous
                      les montre ?
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      window.RachidaOpen?.("Salut, je cherche des chaussures noires homme à moins de 25 000 FCFA")
                    }
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.02] transition"
                  >
                    Continuer la conversation, en vrai <ArrowRight className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-4">
                    Aperçu — données d'exemple
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "Ventes du jour", v: "184 500 FCFA" },
                      { l: "Commandes", v: "12" },
                      { l: "Conversations actives", v: "5" },
                      { l: "Leads chauds", v: "3" },
                    ].map((s) => (
                      <div key={s.l} className="glass rounded-xl p-4">
                        <div className="text-xs text-muted-foreground">{s.l}</div>
                        <div className="mt-1 font-display font-semibold text-xl">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-xs text-muted-foreground">
                    Chiffres illustratifs — votre vrai tableau de bord affiche vos données réelles dès l'activation.
                  </p>
                  <Link
                    to="/auth"
                    className="mt-auto pt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold glass hover:bg-white/5 transition"
                  >
                    Voir le vrai tableau de bord <ArrowRight className="size-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const caps = [
    { icon: Brain, title: "Cerveau commercial", desc: "Analyse budget, besoin, historique. Recommande le bon produit, au bon moment." },
    { icon: HeartHandshake, title: "Négociation intelligente", desc: "Remise plafonnée par boutique. Justifiée à chaque fois." },
    { icon: Eye, title: "Vision IA", desc: "Lit les preuves Mobile Money, identifie un produit par photo." },
    { icon: Languages, title: "FR · Mooré · Dioula", desc: "Détecte la langue du client et répond automatiquement." },
    { icon: ShoppingBag, title: "Panier conversationnel", desc: "Ajoute, modifie, valide — sans quitter le chat." },
    { icon: Zap, title: "Relances & fidélité", desc: "Relance en cas d'absence, suit la fidélité, recommande au bon moment." },
  ];
  return (
    <section id="capacites" className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div {...fadeUp} className="flex flex-wrap items-end justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
              <Sparkles className="size-3 text-[--color-neon-violet]" /> Capacités
            </div>
            <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl max-w-xl">
              Un service complet, <span className="text-shiny-neon">pas un widget de plus.</span>
            </h2>
          </div>
          <p className="max-w-xs text-muted-foreground">
            Pensée comme une commerciale d'élite, capable de tenir une boutique entière du premier message à la
            commande.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {caps.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="liquid-glass rounded-3xl p-7"
            >
              <div className="flex items-start justify-between">
                <div className="grid place-items-center size-11 rounded-xl glass-strong">
                  <c.icon className="size-5 text-[--color-neon-cyan]" />
                </div>
                <span className="font-mono text-xs text-muted-foreground/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 font-display font-semibold text-xl">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: "01", t: "Crée ta boutique", d: "Email + nom. 30 secondes." },
    { n: "02", t: "Ajoute ton catalogue", d: "CSV, manuel ou import en lot. Rachida l'apprend automatiquement." },
    { n: "03", t: "Active sans coder", d: "Partage ta boutique offerte, invite ton webmaster, ou suis le guide Wix/Shopify/WordPress avec diagnostic automatique." },
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

function PricingSection() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex justify-center opacity-[0.05] select-none"
      >
        <span className="font-display font-extrabold text-[16vw] leading-none tracking-tight whitespace-nowrap">
          Rachida.ai
        </span>
      </div>
      <motion.div {...fadeUp} className="relative max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
          <Sparkles className="size-3 text-[--color-neon-violet]" /> Tarifs
        </div>
        <h2 className="mt-4 font-display font-bold text-4xl sm:text-5xl">
          Un seul palier, <span className="text-shiny-neon">pour l'instant.</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          On construit encore. Tant que c'est le cas, c'est gratuit — pas de carte bancaire, pas de surprise.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mt-12 mx-auto max-w-sm liquid-glass rounded-[2rem] p-8 text-center"
      >
        <div className="text-sm text-muted-foreground">Beta</div>
        <div className="mt-2 font-display font-semibold text-5xl">Gratuit</div>
        <p className="mt-3 text-sm text-muted-foreground min-h-10">
          Pour les commerçants qui activent Rachida pendant la phase beta.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-left">
          {[
            "Rachida sur votre site, WhatsApp ou page boutique",
            "Catalogue, panier et commandes illimités",
            "FR · Mooré · Dioula",
            "Tableau de bord temps réel",
          ].map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="mt-0.5 grid place-items-center size-5 rounded-full bg-white/10 shrink-0">
                <Check className="size-3" />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <Link
          to="/auth"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-primary text-primary-foreground glow-violet hover:scale-[1.02] transition"
        >
          Activer Rachida <ArrowRight className="size-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative py-32 px-6">
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-4xl liquid-glass rounded-[2.5rem] p-12 sm:p-20 text-center overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)" }}
        />
        <div className="relative">
          <h2 className="font-display font-bold text-4xl sm:text-6xl leading-tight">
            Donnez à votre boutique<br />
            <span className="text-shiny-neon">une vraie vendeuse.</span>
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
  const [origin, setOrigin] = useState("https://votre-domaine.com");
  useEffect(() => setOrigin(window.location.origin), []);
  const snippet = `<script src="${origin}/widget/rachida.js" data-shop="demo" defer></script>`;
  const waNumber = "22655300868";
  const waText = encodeURIComponent("Bonjour Rachida, je veux activer mon assistante IA pour ma boutique 🙌");
  const waLink = `https://wa.me/${waNumber}?text=${waText}`;
  const shopLink = `${origin}/shop/demo`;

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Code copié ! Collez-le avant </body> de votre site.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Impossible de copier. Sélectionnez et copiez manuellement.");
    }
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
          3 chemins simples : on installe pour vous, vous partagez une page boutique, ou votre plateforme l'ajoute en quelques clics.
        </p>
      </motion.div>
      <div className="mt-14 mx-auto max-w-6xl grid md:grid-cols-3 gap-5">
        {/* 1. Snippet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-6 flex flex-col"
        >
          <div className="size-10 grid place-items-center rounded-xl bg-gradient-to-br from-[--color-neon-violet] to-[--color-neon-cyan] font-display font-bold">1</div>
          <h3 className="mt-4 font-display font-semibold text-lg">Installation guidée</h3>
          <p className="mt-2 text-sm text-muted-foreground flex-1">
            WordPress, Wix, Shopify ou autre : le tableau de bord donne les étapes exactes et vérifie automatiquement si Rachida est bien installée.
          </p>
          <div className="mt-4">
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 font-mono text-[11px] text-cyan-200 overflow-x-auto select-all">
              {snippet}
            </div>
            <button
              onClick={copy}
              className="mt-2 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
              {copied ? "Copié !" : "Copier si un technicien le demande"}
            </button>
          </div>
        </motion.div>

        {/* 2. WhatsApp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-3xl p-6 flex flex-col"
        >
          <div className="size-10 grid place-items-center rounded-xl bg-gradient-to-br from-[--color-neon-violet] to-[--color-neon-cyan] font-display font-bold">2</div>
          <h3 className="mt-4 font-display font-semibold text-lg">Activation par WhatsApp</h3>
          <p className="mt-2 text-sm text-muted-foreground flex-1">
            Écrivez-nous sur WhatsApp et notre équipe connecte Rachida à votre boutique, sans configuration technique de votre côté.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm px-3 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition"
          >
            <MessageSquare className="size-4" /> Ouvrir WhatsApp
          </a>
        </motion.div>

        {/* 3. Page boutique */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass rounded-3xl p-6 flex flex-col"
        >
          <div className="size-10 grid place-items-center rounded-xl bg-gradient-to-br from-[--color-neon-violet] to-[--color-neon-cyan] font-display font-bold">3</div>
          <h3 className="mt-4 font-display font-semibold text-lg">Page boutique offerte</h3>
          <p className="mt-2 text-sm text-muted-foreground flex-1">
            Pas de site ? Votre lien de vente est prêt dans le tableau de bord : catalogue, panier et Rachida intégrée. Vous le partagez sur WhatsApp, Facebook ou Instagram.
          </p>
          <a
            href={shopLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm px-3 py-2.5 rounded-xl bg-primary/30 hover:bg-primary/40 transition"
          >
            <ShoppingBag className="size-4" /> Voir une page démo
          </a>
        </motion.div>
      </div>
      <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto">
        Besoin d'aide ? Notre équipe installe Rachida pour vous gratuitement —
        {" "}
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
          envoyez-nous un message WhatsApp
        </a>.
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
