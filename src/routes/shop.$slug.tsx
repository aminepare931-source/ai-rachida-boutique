import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Truck, ShieldCheck, ArrowLeft } from "lucide-react";
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
  { name: "Sac en cuir cousu main", price: 25000, image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600", description: "Finition Ouagadougou" },
  { name: "Boubou wax édition limitée", price: 32000, image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600", description: "Édition limitée" },
  { name: "Beurre de karité bio 250g", price: 4500, image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600", description: "Soin naturel" },
  { name: "Bijoux dorés artisanaux", price: 12000, image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600", description: "Fabrication artisanale" },
];

type PublicProduct = {
  id?: string;
  name: string;
  price: number;
  image_url?: string | null;
  description?: string | null;
  category?: string | null;
  stock?: number | null;
};

type PublicShop = { name: string; currency: string; whatsapp?: string | null; color?: string | null };

function ShopPage() {
  const { slug } = Route.useParams();
  const fallbackName = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const [shop, setShop] = useState<PublicShop | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>(slug === "demo" ? DEMO_PRODUCTS : []);
  const shopName = shop?.name ?? fallbackName;
  const currency = shop?.currency ?? "FCFA";

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/public/shop-config?shop=${encodeURIComponent(slug)}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/public/rachida-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopSlug: slug, query: "", limit: 80 }),
      }).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([cfg, search]) => {
      if (!alive) return;
      if (cfg?.shop) setShop(cfg.shop);
      if (search?.products?.length) setProducts(search.products);
      else if (slug !== "demo") setProducts([]);
    });
    return () => { alive = false; };
  }, [slug]);

  const openCart = () => (window as any).RachidaOpen?.("Je veux voir mon panier et finaliser ma commande.");

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
          <button onClick={openCart} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass cursor-pointer">
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
              Parcourez le catalogue et discutez avec Rachida en bas à droite — elle conseille, négocie et finalise la commande.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Truck className="size-3.5 text-[--color-neon-cyan]" /> Livraison rapide</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-[--color-neon-cyan]" /> Mobile Money</span>
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
          {products.map((p) => (
            <article key={p.id ?? p.name} className="glass rounded-2xl overflow-hidden group">
              <div className="aspect-square overflow-hidden bg-white/5">
                <img
                  src={p.image_url || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display font-medium text-sm">{p.name}</h3>
                {p.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-[--color-neon-cyan] font-semibold">{Number(p.price).toLocaleString("fr-FR")} {currency}</span>
                  <button
                    onClick={() => {
                      (window as any).RachidaAddToCart?.({ name: p.name, price: Number(p.price) || 0 });
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
          {products.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-4 glass rounded-3xl p-10 text-center">
              <h3 className="font-display text-xl font-semibold">Catalogue en préparation</h3>
              <p className="mt-2 text-sm text-muted-foreground">Cette boutique n'a pas encore ajouté de produits visibles. Discutez avec Rachida pour contacter le vendeur.</p>
              <button onClick={() => (window as any).RachidaOpen?.("Bonjour, je veux avoir plus d'informations sur cette boutique.")} className="mt-5 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold">
                Parler à Rachida
              </button>
            </div>
          )}
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
