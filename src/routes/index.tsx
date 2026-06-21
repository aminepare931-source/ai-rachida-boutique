import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Heart, ShoppingCart, Zap, Phone, Bot } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rachida AI — Vendeuse IA pour les entreprises du Burkina Faso" },
      { name: "description", content: "Une IA qui parle à vos clients, comprend votre catalogue, vend, suit les commandes et détecte les émotions. 24h/24 sur votre site." },
      { property: "og:title", content: "Rachida AI — Votre vendeuse IA, 24h/24" },
      { property: "og:description", content: "Installez une IA vendeuse en 2 minutes sur votre site. Pensée pour les entrepreneurs du Burkina Faso." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Bot className="text-orange-600" /> Rachida AI
        </div>
        <nav className="flex gap-3">
          <Link to="/auth" className="px-4 py-2 text-sm font-medium hover:text-orange-600">Connexion</Link>
          <Link to="/auth" className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-full hover:bg-orange-700">Créer ma boutique</Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full mb-4">🇧🇫 Fait pour le Burkina Faso</span>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900">
          Votre <span className="text-orange-600">vendeuse IA</span><br/>qui ne dort jamais.
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Rachida comprend votre catalogue, parle à vos clients en français, détecte leurs émotions, enregistre les commandes et passe la main à un humain sur WhatsApp si besoin. Installation en 2 minutes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/auth" className="px-6 py-3 bg-orange-600 text-white rounded-full font-semibold hover:bg-orange-700 shadow-lg shadow-orange-200">Commencer gratuitement</Link>
          <a href="#fonctions" className="px-6 py-3 border border-gray-300 rounded-full font-semibold hover:bg-white">Voir les fonctions</a>
        </div>
      </section>

      <section id="fonctions" className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: MessageCircle, t: "Chat vente intelligent", d: "Comprend les questions, filtre votre catalogue par prix, couleur, genre, et recommande les bons produits." },
          { icon: Heart, t: "Détection d'émotions", d: "Adapte son ton selon l'humeur du client : rassure si négatif, encourage si positif." },
          { icon: ShoppingCart, t: "Panier multi-produits", d: "Enregistre la commande complète, capte nom et numéro WhatsApp du client." },
          { icon: Phone, t: "Transfert WhatsApp humain", d: "Quand la situation dépasse l'IA, elle propose un contact humain direct." },
          { icon: Zap, t: "Suivi des commandes", d: "Dashboard avec toutes les conversations, émotions détectées, commandes capturées." },
          { icon: Bot, t: "Catalogue volumineux", d: "Filtre intelligent : même avec 10 000 produits, ne charge que ce qui compte pour chaque message." },
        ].map((f) => (
          <div key={f.t} className="p-6 bg-white rounded-2xl shadow-sm border border-orange-100">
            <f.icon className="text-orange-600 mb-3" size={28} />
            <h3 className="font-bold text-lg">{f.t}</h3>
            <p className="text-sm text-gray-600 mt-2">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">3 étapes, c'est tout.</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {["Crée ton compte", "Ajoute ton catalogue", "Colle le script sur ton site"].map((s, i) => (
            <div key={s} className="p-6 bg-white rounded-2xl border border-orange-100">
              <div className="text-orange-600 text-3xl font-bold">{i + 1}</div>
              <p className="mt-2 font-semibold">{s}</p>
            </div>
          ))}
        </div>
        <Link to="/auth" className="mt-10 inline-block px-8 py-4 bg-orange-600 text-white rounded-full font-bold hover:bg-orange-700">Démarrer maintenant →</Link>
      </section>

      <footer className="border-t border-orange-100 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Rachida AI — Conçu pour les entrepreneurs du Burkina Faso 🇧🇫
      </footer>
    </div>
  );
}
