import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Bot, Settings, Package, MessageSquare, ShoppingBag, Code, LogOut, Plus, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Rachida AI" }] }),
  component: Dashboard,
});

type Shop = {
  id: string;
  slug: string;
  name: string;
  whatsapp: string | null;
  color: string;
  greeting: string;
  max_remise: number;
  rachida_name: string;
  currency: string;
  system_prompt_extra: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  gender: string | null;
  color: string | null;
  image_url: string | null;
  stock: number;
  description: string | null;
  is_active: boolean;
};

type Conversation = { id: string; client_name: string | null; client_contact: string | null; emotion: string | null; created_at: string };
type Order = { id: string; client_name: string | null; client_contact: string | null; cart: unknown; total: number; status: string; created_at: string };

const TABS = [
  { key: "shop", label: "Boutique", icon: Settings },
  { key: "catalog", label: "Catalogue", icon: Package },
  { key: "conversations", label: "Conversations", icon: MessageSquare },
  { key: "orders", label: "Commandes", icon: ShoppingBag },
  { key: "integration", label: "Intégration", icon: Code },
] as const;

function Dashboard() {
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("shop");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) nav({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) nav({ to: "/auth" });
    });
    return () => sub.data.subscription.unsubscribe();
  }, [nav]);

  const loadShop = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data, error } = await supabase.from("shops").select("*").eq("owner_id", session.user.id).maybeSingle();
    if (error) toast.error(error.message);
    if (data) setShop(data as Shop);
    else {
      // auto-create
      const slug = "shop-" + Math.random().toString(36).slice(2, 8);
      const { data: created, error: e2 } = await supabase
        .from("shops")
        .insert({ owner_id: session.user.id, slug, name: "Ma Boutique" })
        .select()
        .single();
      if (e2) toast.error(e2.message);
      if (created) setShop(created as Shop);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { void loadShop(); }, [loadShop]);

  if (!session || loading || !shop) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold"><Bot className="text-orange-600" /> Rachida AI</Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-gray-500 hover:text-red-600"><LogOut size={16} /> Déconnexion</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 grid md:grid-cols-[220px_1fr] gap-6">
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${tab === t.key ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-white"}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <main className="bg-white rounded-xl shadow-sm p-6">
          {tab === "shop" && <ShopTab shop={shop} onUpdated={setShop} />}
          {tab === "catalog" && <CatalogTab shopId={shop.id} />}
          {tab === "conversations" && <ConversationsTab shopId={shop.id} />}
          {tab === "orders" && <OrdersTab shopId={shop.id} />}
          {tab === "integration" && <IntegrationTab shop={shop} />}
        </main>
      </div>
    </div>
  );
}

function ShopTab({ shop, onUpdated }: { shop: Shop; onUpdated: (s: Shop) => void }) {
  const [form, setForm] = useState(shop);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const { data, error } = await supabase.from("shops").update({
      name: form.name, whatsapp: form.whatsapp, color: form.color, greeting: form.greeting,
      max_remise: form.max_remise, rachida_name: form.rachida_name, currency: form.currency,
      system_prompt_extra: form.system_prompt_extra, slug: form.slug,
    }).eq("id", shop.id).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (data) { onUpdated(data as Shop); toast.success("Boutique mise à jour"); }
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Réglages de la boutique</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nom de la boutique"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Identifiant URL (slug)"><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })} /></Field>
        <Field label="WhatsApp (avec indicatif, ex: 22670000000)"><input className="input" value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
        <Field label="Nom de l'IA"><input className="input" value={form.rachida_name} onChange={(e) => setForm({ ...form, rachida_name: e.target.value })} /></Field>
        <Field label="Couleur du widget"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20" /></Field>
        <Field label="Devise"><input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
        <Field label="Remise max autorisée (%)"><input type="number" className="input" value={form.max_remise} onChange={(e) => setForm({ ...form, max_remise: parseInt(e.target.value) || 0 })} /></Field>
      </div>
      <Field label="Message d'accueil"><textarea className="input" rows={2} value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} /></Field>
      <Field label="Instructions supplémentaires pour l'IA (optionnel)"><textarea className="input" rows={3} value={form.system_prompt_extra ?? ""} onChange={(e) => setForm({ ...form, system_prompt_extra: e.target.value })} /></Field>
      <button onClick={save} disabled={saving} className="btn-primary">{saving ? "..." : "Enregistrer"}</button>
      <Style />
    </div>
  );
}

function CatalogTab({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    setItems((data ?? []) as Product[]);
  }, [shopId]);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!editing?.name) return;
    const payload = {
      shop_id: shopId,
      name: editing.name,
      price: editing.price ?? 0,
      category: editing.category ?? null,
      gender: editing.gender ?? null,
      color: editing.color ?? null,
      image_url: editing.image_url ?? null,
      stock: editing.stock ?? 0,
      description: editing.description ?? null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Enregistré");
    setEditing(null);
    void load();
  }
  async function del(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id);
    void load();
  }
  async function importCSV(file: File) {
    const txt = await file.text();
    const lines = txt.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",");
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = (cols[i] ?? "").trim(); });
      return {
        shop_id: shopId,
        name: o.name || o.nom || "",
        price: parseFloat(o.price || o.prix || "0") || 0,
        category: o.category || o.categorie || null,
        gender: o.gender || o.genre || null,
        color: o.color || o.couleur || null,
        image_url: o.image_url || o.image || null,
        stock: parseInt(o.stock || "0") || 0,
        description: o.description || null,
      };
    }).filter((r) => r.name);
    if (!rows.length) return toast.error("CSV vide ou sans colonne 'name'");
    const { error } = await supabase.from("products").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} produits importés`);
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Catalogue ({items.length})</h2>
        <div className="flex gap-2">
          <label className="btn-outline cursor-pointer"><Upload size={14} /> Importer CSV
            <input type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
          </label>
          <button onClick={() => setEditing({ is_active: true, stock: 1 })} className="btn-primary"><Plus size={14} /> Produit</button>
        </div>
      </div>
      <p className="text-xs text-gray-500">Format CSV attendu : <code>name,price,category,gender,color,image_url,stock,description</code></p>

      <div className="grid gap-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg">
            {p.image_url ? <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-gray-100 rounded" />}
            <div className="flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.price} · {p.category ?? "—"} · {p.gender ?? "—"} · stock {p.stock}</div>
            </div>
            <button onClick={() => setEditing(p)} className="text-sm text-orange-600">Modifier</button>
            <button onClick={() => del(p.id)} className="text-red-500"><Trash2 size={16} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">Aucun produit. Ajoutes-en un ou importe un CSV.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{editing.id ? "Modifier" : "Nouveau"} produit</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom"><input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Prix"><input type="number" className="input" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) })} /></Field>
              <Field label="Catégorie"><input className="input" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Genre"><input className="input" placeholder="homme/femme/enfant" value={editing.gender ?? ""} onChange={(e) => setEditing({ ...editing, gender: e.target.value })} /></Field>
              <Field label="Couleur"><input className="input" value={editing.color ?? ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} /></Field>
              <Field label="Stock"><input type="number" className="input" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })} /></Field>
            </div>
            <Field label="URL image"><input className="input" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></Field>
            <Field label="Description"><textarea className="input" rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="btn-outline">Annuler</button>
              <button onClick={save} className="btn-primary">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
      <Style />
    </div>
  );
}

function ConversationsTab({ shopId }: { shopId: string }) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string; created_at: string }[]>([]);

  useEffect(() => {
    supabase.from("conversations").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setConvs((data ?? []) as Conversation[]));
  }, [shopId]);

  useEffect(() => {
    if (!selected) return;
    supabase.from("messages").select("role, content, created_at").eq("conversation_id", selected).order("created_at")
      .then(({ data }) => setMessages(data ?? []));
  }, [selected]);

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4 h-[600px]">
      <div className="overflow-y-auto border-r pr-2 space-y-1">
        <h2 className="font-bold mb-2">Conversations</h2>
        {convs.map((c) => (
          <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left p-2 rounded text-sm ${selected === c.id ? "bg-orange-100" : "hover:bg-gray-100"}`}>
            <div className="font-medium">{c.client_name ?? "Anonyme"} · <EmotionBadge e={c.emotion} /></div>
            <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString("fr")}</div>
          </button>
        ))}
        {convs.length === 0 && <p className="text-sm text-gray-500">Pas encore de conversation.</p>}
      </div>
      <div className="overflow-y-auto space-y-2 p-2 bg-gray-50 rounded">
        {selected ? messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-[80%] text-sm ${m.role === "user" ? "bg-blue-100 ml-auto" : "bg-white"}`}>{m.content}</div>
        )) : <p className="text-gray-500 text-center mt-10">Sélectionne une conversation</p>}
      </div>
    </div>
  );
}

function EmotionBadge({ e }: { e: string | null }) {
  const colors: Record<string, string> = { positif: "text-green-600", négatif: "text-red-600", triste: "text-blue-600", questionneur: "text-yellow-600", neutre: "text-gray-500" };
  return <span className={`text-xs ${colors[e ?? "neutre"] ?? "text-gray-500"}`}>{e ?? "neutre"}</span>;
}

function OrdersTab({ shopId }: { shopId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = useCallback(() => {
    supabase.from("orders").select("*").eq("shop_id", shopId).order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as Order[]));
  }, [shopId]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Commandes ({orders.length})</h2>
      {orders.map((o) => (
        <div key={o.id} className="p-4 border rounded-lg">
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{o.client_name ?? "Anonyme"} — {o.client_contact ?? "—"}</div>
              <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString("fr")}</div>
            </div>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="text-sm border rounded px-2">
              <option value="nouvelle">Nouvelle</option>
              <option value="confirmée">Confirmée</option>
              <option value="livrée">Livrée</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>
          <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(o.cart, null, 2)}</pre>
          <div className="text-right font-bold">Total : {o.total}</div>
        </div>
      ))}
      {orders.length === 0 && <p className="text-sm text-gray-500">Aucune commande pour l'instant.</p>}
    </div>
  );
}

function IntegrationTab({ shop }: { shop: Shop }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const snippet = `<script src="${origin}/widget/rachida.js" data-shop="${shop.slug}"></script>`;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Intégration sur votre site</h2>
      <p className="text-sm text-gray-600">Copie ce code juste avant <code>&lt;/body&gt;</code> sur ton site. Rachida apparaîtra en bas à droite.</p>
      <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-sm overflow-x-auto">{snippet}</pre>
      <button onClick={() => { navigator.clipboard.writeText(snippet); toast.success("Copié !"); }} className="btn-primary">Copier le code</button>
      <div className="mt-6 p-4 bg-orange-50 rounded-lg text-sm">
        💡 Astuce : tu peux tester ton widget directement sur cette page :
        <div className="mt-2" dangerouslySetInnerHTML={{ __html: `<iframe srcdoc='<html><body style=\"padding:40px;font-family:sans-serif\"><h2>Aperçu boutique : ${shop.name}</h2><p>Clique sur la bulle en bas à droite.</p><script src=\"${origin}/widget/rachida.js\" data-shop=\"${shop.slug}\"></script></body></html>' style='width:100%;height:600px;border:1px solid #ddd;border-radius:8px'></iframe>` }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-gray-700">{label}</span>{children}</label>;
}

function Style() {
  return (
    <style>{`
      .input { width:100%; margin-top:4px; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; }
      .input:focus { outline:none; border-color:#ea580c; }
      .btn-primary { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; background:#ea580c; color:#fff; border-radius:8px; font-weight:600; font-size:14px; }
      .btn-primary:hover { background:#c2410c; }
      .btn-outline { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:1px solid #d1d5db; border-radius:8px; font-weight:500; font-size:14px; background:#fff; }
    `}</style>
  );
}
