import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Star, Truck, ShieldCheck, ArrowLeft } from "lucide-react";
import rachidaAvatar from "@/assets/rachida-avatar.png";
import rachidaLogo from "@/assets/rachida-logo.png";
import { RachidaWidget } from "@/components/RachidaWidget";

export const Route = createFileRoute("/shop/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · Boutique propulsée par Rachida AI` },
      { name: "description", content: "Boutique en ligne offerte par Rachida AI — catalogue, conseil et vente IA 24h/24." },
    ],
  }),
  component: ShopPage,
});

const DEMO_PRODUCTS = [
  { name: "Sac en cuir cousu main", price: "25 000 FCFA", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600" },
  { name: "Boubou wax édition limitée", price: "32 000 FCFA", img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600" },
  { name: "Beurre de karité bio 250g", price: "4 500 FCFA", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600" },
  { name: "Bijoux dorés artisanaux", price: "12 000 FCFA", img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600" },
];

function ShopPage() {
  const { slug } = Route.useParams();
  const shopName = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="size-3.5" /> Rachida.ai
          </Link>
          <div className="flex items-center gap-2 font-display font-semibold">
            <img src={rachidaLogo} alt="" className="size-7" />
            <span>{shopName}</span>
          </div>
          <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass">
            <ShoppingBag className="size-3.5" /> Panier
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
              <span className="size-1.5 rounded-full bg-emerald-400 pulse-glow" /> Boutique propulsée par Rachida AI
            </span>
            <h1 className="mt-5 font-display font-bold text-4xl sm:text-5xl leading-tight">
              Bienvenue chez <span className="text-gradient-neon">{shopName}</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-md">
              Discutez avec Rachida en bas à droite — elle vous conseille, négocie et finalise votre commande en français, mooré ou dioula.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Truck className="size-3.5 text-[--color-neon-cyan]" /> Livraison Ouagadougou</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-[--color-neon-cyan]" /> Mobile Money</span>
              <span className="inline-flex items-center gap-1.5"><Star className="size-3.5 text-[--color-neon-cyan]" /> 4.9/5 clients</span>
            </div>
          </div>
          <div className="relative">
            <img src={rachidaAvatar} alt="Rachida" className="w-full max-w-xs mx-auto drop-shadow-[0_30px_80px_rgba(139,92,246,0.4)]" />
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display font-bold text-2xl mb-6">Notre catalogue</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DEMO_PRODUCTS.map((p) => (
            <article key={p.name} className="glass rounded-2xl overflow-hidden group">
              <div className="aspect-square overflow-hidden bg-white/5">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display font-medium text-sm">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-[--color-neon-cyan] font-semibold">{p.price}</span>
                  <button
                    onClick={() => {
                      const priceNum = parseInt(p.price.replace(/\D/g, ""), 10) || 0;
                      (window as any).RachidaAddToCart?.({ name: p.name, price: priceNum });
                      (window as any).RachidaOpen?.(`Je veux ${p.name}, c'est possible ?`);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-primary/30 hover:bg-primary/40 transition cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        Cette boutique est offerte par{" "}
        <Link to="/" className="text-gradient-neon font-semibold">Rachida AI</Link>
        {" "}— créez la vôtre gratuitement.
      </footer>
      <RachidaWidget shop={slug} mode="storefront" />
    </div>
  );
}
