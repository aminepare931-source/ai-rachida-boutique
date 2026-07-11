import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Bot, Settings, Package, MessageSquare, ShoppingBag, Code, LogOut, Plus, Trash2, Upload,
  LayoutDashboard, Users, HelpCircle, Sparkles, TrendingUp, Flame,
  CheckCircle2, XCircle, Loader2, Mail, Globe, Globe2, Copy, ExternalLink, QrCode, Share2, Wand2,
  Wallet, Megaphone, Image as ImageIcon, Award, CalendarClock,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { checkInstall } from "@/lib/install-checker.functions";
import { retouchProductPhoto } from "@/lib/rachida-photo.functions";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { RachidaWidget } from "@/components/RachidaWidget";
import { SmartImportModal } from "@/components/SmartImportModal";
import { RachidaToolsTab } from "@/components/RachidaToolsTab";
import { MirrorTab } from "@/components/MirrorTab";
import { PaymentsTab } from "@/components/PaymentsTab";
import { MarketingTab } from "@/components/MarketingTab";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { CreativeTab } from "@/components/CreativeTab";
import { LoyaltyTab } from "@/components/LoyaltyTab";
import { ScheduleTab } from "@/components/ScheduleTab";
import { CrmTab } from "@/components/CrmTab";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Rachida AI" }] }),
  component: Dashboard,
});

type Shop = {
  id: string; slug: string; name: string; whatsapp: string | null; color: string;
  greeting: string; max_remise: number; rachida_name: string; currency: string;
  system_prompt_extra: string | null;
  onboarding_done?: boolean;
};
type Product = {
  id: string; name: string; price: number; category: string | null; gender: string | null;
  color: string | null; image_url: string | null; stock: number; description: string | null; is_active: boolean;
};
type Conversation = { id: string; client_name: string | null; client_contact: string | null; emotion: string | null; created_at: string };
type Order = { id: string; client_name: string | null; client_contact: string | null; cart: unknown; total: number; status: string; created_at: string };
type LeadScore = { id: string; conversation_id: string; score: number; reasons: string | null; status: string | null };
type Faq = { id: string; question: string; answer: string; keywords: string | null };

const TAB_GROUPS = [
  {
    title: "Accueil",
    items: [
      { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    ],
  },
  {
    title: "Mes ventes",
    items: [
      { key: "conversations", label: "Conversations", icon: MessageSquare },
      { key: "leads", label: "Clients chauds", icon: Flame },
      { key: "orders", label: "Commandes", icon: ShoppingBag },
      { key: "crm", label: "Mes clients", icon: Users },
    ],
  },
  {
    title: "Ma boutique",
    items: [
      { key: "catalog", label: "Produits", icon: Package },
      { key: "shop", label: "Rachida & boutique", icon: Sparkles },
      { key: "faq", label: "Questions fréquentes", icon: HelpCircle },
      { key: "payments", label: "Paiements", icon: Wallet },
    ],
  },
  {
    title: "Faire grandir mes ventes",
    items: [
      { key: "marketing", label: "Promos & pubs", icon: Megaphone },
      { key: "loyalty", label: "Fidélité", icon: Award },
      { key: "creative", label: "Affiches & voix IA", icon: ImageIcon },
      { key: "schedule", label: "Agenda posts", icon: CalendarClock },
      { key: "tools", label: "Autres outils IA", icon: Wand2 },
    ],
  },
  {
    title: "Installer Rachida",
    items: [
      { key: "mirror", label: "Site prêt en 1 clic", icon: Globe2 },
      { key: "integration", label: "Coller sur mon site", icon: Code },
    ],
  },
] as const;

const TABS = TAB_GROUPS.flatMap((g) => g.items);
type TabKey = (typeof TABS)[number]["key"];

function Dashboard() {
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
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
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const existing = data?.[0] as Shop | undefined;
    if (existing) setShop(existing);
    else {
      const slug = "shop-" + Math.random().toString(36).slice(2, 8);
      const { data: created, error: e2 } = await supabase
        .from("shops").insert({ owner_id: session.user.id, slug, name: "Ma Boutique" })
        .select().limit(1);
      if (e2) toast.error(e2.message);
      if (created?.[0]) setShop(created[0] as Shop);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { void loadShop(); }, [loadShop]);

  if (!session || loading || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060F] text-white/60">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Chargement de Rachida...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060F] text-white relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      <Toaster theme="dark" />

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[240px] h-screen sticky top-0 flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-xl">
          <Link to="/" className="px-6 py-5 flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/50">
              <Bot size={18} />
            </div>
            Rachida
          </Link>

          <nav className="flex-1 px-3 space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? "text-white" : "text-white/50 hover:text-white/90 hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 to-cyan-500/10 border border-violet-400/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="text-xs text-white/40 truncate mb-2">{session.user.email}</div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 text-xs text-white/60 hover:text-red-400 transition"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </aside>

        {/* Mobile top tabs */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#05060F]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 overflow-x-auto">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${tab === t.key ? "bg-violet-500/20 text-white border border-violet-400/30" : "text-white/50"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 min-w-0 p-6 md:p-10 pt-20 md:pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "overview" && <OverviewTab shopId={shop.id} currency={shop.currency} />}
              {tab === "shop" && <ShopTab shop={shop} onUpdated={setShop} />}
              {tab === "catalog" && <CatalogTab shopId={shop.id} />}
              {tab === "conversations" && <ConversationsTab shopId={shop.id} />}
              {tab === "leads" && <LeadsTab shopId={shop.id} />}
              {tab === "faq" && <FaqTab shopId={shop.id} />}
              {tab === "orders" && <OrdersTab shopId={shop.id} currency={shop.currency} />}
              {tab === "integration" && <IntegrationTab shop={shop} />}
              {tab === "tools" && <ToolsTabWrapper shop={shop} />}
              {tab === "mirror" && <MirrorTab shopId={shop.id} />}
              {tab === "payments" && <PaymentsTab shopId={shop.id} />}
              {tab === "marketing" && <MarketingTab shopId={shop.id} whatsapp={shop.whatsapp} />}
              {tab === "creative" && <CreativeTab shopId={shop.id} whatsapp={shop.whatsapp} />}
              {tab === "loyalty" && <LoyaltyTab shopId={shop.id} />}
              {tab === "schedule" && <ScheduleTab shopId={shop.id} whatsapp={shop.whatsapp} />}
              {tab === "crm" && <CrmTab shopId={shop.id} whatsapp={shop.whatsapp} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {shop.onboarding_done === false && (
        <OnboardingWizard shop={shop} onDone={() => setShop({ ...shop, onboarding_done: true })} />
      )}
      <Style />
      <RachidaWidget shop={shop.slug} mode="admin" />
    </div>
  );
}

/* ---------- Tools wrapper: loads a small product sample for context ---------- */
function ToolsTabWrapper({ shop }: { shop: Shop }) {
  const [sample, setSample] = useState<string[]>([]);
  useEffect(() => {
    supabase.from("products").select("name").eq("shop_id", shop.id).eq("is_active", true).limit(8)
      .then(({ data }) => setSample((data || []).map((p) => p.name).filter(Boolean) as string[]));
  }, [shop.id]);
  return <RachidaToolsTab shopName={shop.name} whatsapp={shop.whatsapp} sampleProducts={sample} />;
}


/* ---------- Overview ---------- */
function OverviewTab({ shopId, currency }: { shopId: string; currency: string }) {
  const [stats, setStats] = useState({ convs: 0, orders: 0, revenue: 0, hotLeads: 0 });
  const [chartData, setChartData] = useState<{ day: string; convs: number; orders: number }[]>([]);
  const [emotions, setEmotions] = useState<Record<string, number>>({});
  const [topProducts, setTopProducts] = useState<{ name: string; views: number }[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: convs }, { data: orders }, { data: leads }, { data: views }] = await Promise.all([
        supabase.from("conversations").select("id, emotion, created_at").eq("shop_id", shopId).gte("created_at", since),
        supabase.from("orders").select("id, total, created_at").eq("shop_id", shopId).gte("created_at", since),
        supabase.from("lead_scores").select("score").eq("shop_id", shopId).gte("score", 7),
        supabase.from("product_views").select("product_id, products(name)").eq("shop_id", shopId).gte("created_at", since).limit(500),
      ]);
      const revenue = (orders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0);
      setStats({ convs: convs?.length ?? 0, orders: orders?.length ?? 0, revenue, hotLeads: leads?.length ?? 0 });

      const em: Record<string, number> = {};
      (convs ?? []).forEach((c) => { const e = c.emotion ?? "neutre"; em[e] = (em[e] ?? 0) + 1; });
      setEmotions(em);

      const days: Record<string, { convs: number; orders: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(5, 10);
        days[d] = { convs: 0, orders: 0 };
      }
      (convs ?? []).forEach((c) => { const k = c.created_at.slice(5, 10); if (days[k]) days[k].convs++; });
      (orders ?? []).forEach((o) => { const k = o.created_at.slice(5, 10); if (days[k]) days[k].orders++; });
      setChartData(Object.entries(days).map(([day, v]) => ({ day, ...v })));

      const counts: Record<string, number> = {};
      type V = { product_id: string | null; products: { name: string } | { name: string }[] | null };
      (views as V[] | null ?? []).forEach((v) => {
        const prod = Array.isArray(v.products) ? v.products[0] : v.products;
        const name = prod?.name;
        if (name) counts[name] = (counts[name] ?? 0) + 1;
      });
      setTopProducts(
        Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, views]) => ({ name, views }))
      );
    })();
  }, [shopId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h1>
        <p className="text-white/40 text-sm">14 derniers jours · données temps réel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Conversations" value={stats.convs} icon={MessageSquare} accent="from-violet-500 to-purple-500" />
        <KpiCard label="Commandes" value={stats.orders} icon={ShoppingBag} accent="from-cyan-500 to-blue-500" />
        <KpiCard label={`Revenu (${currency})`} value={stats.revenue.toLocaleString()} icon={TrendingUp} accent="from-emerald-500 to-teal-500" />
        <KpiCard label="Leads chauds" value={stats.hotLeads} icon={Flame} accent="from-orange-500 to-red-500" />
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-4">Activité quotidienne</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#7c5cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,.3)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,.3)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(10,10,20,.95)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="convs" stroke="#7c5cff" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="orders" stroke="#00e5ff" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-semibold mb-4">Émotions des clients</h3>
          <div className="space-y-2">
            {Object.entries(emotions).length === 0 && <p className="text-white/40 text-sm">Pas encore de données.</p>}
            {Object.entries(emotions).map(([e, n]) => {
              const total = Object.values(emotions).reduce((a, b) => a + b, 0);
              const pct = total ? (n / total) * 100 : 0;
              return (
                <div key={e}>
                  <div className="flex justify-between text-xs mb-1"><span className="capitalize">{e}</span><span className="text-white/40">{n}</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full ${emotionColor(e)}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Top produits consultés</h3>
          <div className="space-y-2">
            {topProducts.length === 0 && <p className="text-white/40 text-sm">Pas encore de données.</p>}
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                <div className="flex-1 truncate">{p.name}</div>
                <div className="text-white/40 text-xs">{p.views} vues</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function emotionColor(e: string) {
  return ({ positif: "bg-emerald-500", négatif: "bg-red-500", triste: "bg-blue-500", questionneur: "bg-amber-500", neutre: "bg-violet-500" }[e]) ?? "bg-violet-500";
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: typeof MessageSquare; accent: string }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden group">
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl group-hover:opacity-40 transition`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/50">{label}</span>
          <Icon size={16} className="text-white/40" />
        </div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </div>
    </motion.div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl ${className}`}>{children}</div>;
}

/* ---------- Conversations (Realtime) ---------- */
function ConversationsTab({ shopId }: { shopId: string }) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string; created_at: string }[]>([]);

  useEffect(() => {
    const load = () => supabase.from("conversations").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setConvs((data ?? []) as Conversation[]));
    load();
    const channel = supabase.channel("convs-" + shopId).on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `shop_id=eq.${shopId}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  useEffect(() => {
    if (!selected) return;
    const load = () => supabase.from("messages").select("role, content, created_at").eq("conversation_id", selected).order("created_at")
      .then(({ data }) => setMessages(data ?? []));
    load();
    const channel = supabase.channel("msgs-" + selected).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Conversations <span className="text-white/30 text-lg ml-2">temps réel</span></h1>
      <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[640px]">
        <GlassCard className="overflow-y-auto !p-3 space-y-1">
          {convs.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`w-full text-left p-3 rounded-xl text-sm transition ${selected === c.id ? "bg-violet-500/20 border border-violet-400/30" : "hover:bg-white/5 border border-transparent"}`}>
              <div className="flex justify-between items-center">
                <div className="font-medium truncate">{c.client_name ?? "Anonyme"}</div>
                <EmotionBadge e={c.emotion} />
              </div>
              <div className="text-xs text-white/40 mt-1">{new Date(c.created_at).toLocaleString("fr")}</div>
            </button>
          ))}
          {convs.length === 0 && <p className="text-sm text-white/40 p-3">Pas encore de conversation.</p>}
        </GlassCard>
        <GlassCard className="overflow-y-auto !p-4 space-y-2">
          {selected ? messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.role === "user" ? "bg-violet-500/20 ml-auto border border-violet-400/20" : "bg-white/5 border border-white/10"}`}>{m.content}</div>
          )) : <p className="text-white/40 text-center mt-10">Sélectionne une conversation</p>}
        </GlassCard>
      </div>
    </div>
  );
}

function EmotionBadge({ e }: { e: string | null }) {
  const map: Record<string, string> = { positif: "bg-emerald-500/20 text-emerald-300", négatif: "bg-red-500/20 text-red-300", triste: "bg-blue-500/20 text-blue-300", questionneur: "bg-amber-500/20 text-amber-300", neutre: "bg-white/10 text-white/60" };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${map[e ?? "neutre"] ?? "bg-white/10 text-white/60"}`}>{e ?? "neutre"}</span>;
}

/* ---------- Leads ---------- */
function LeadsTab({ shopId }: { shopId: string }) {
  const [leads, setLeads] = useState<(LeadScore & { conv: Conversation })[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("lead_scores")
        .select("id, conversation_id, score, reasons, status, conversations(id, client_name, client_contact, emotion, created_at)")
        .eq("shop_id", shopId).order("score", { ascending: false }).limit(100);
      type Row = LeadScore & { conversations: Conversation | Conversation[] | null };
      const mapped = (data as Row[] | null ?? []).map((r) => ({
        ...r,
        conv: (Array.isArray(r.conversations) ? r.conversations[0] : r.conversations) as Conversation,
      })).filter((r) => r.conv);
      setLeads(mapped);
    })();
  }, [shopId]);

  const groups = useMemo(() => ({
    chaud: leads.filter((l) => l.score >= 7),
    tiede: leads.filter((l) => l.score >= 4 && l.score < 7),
    froid: leads.filter((l) => l.score < 4),
  }), [leads]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Leads <span className="text-white/30 text-lg ml-2">scoring 1-10</span></h1>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { key: "chaud" as const, label: "🔥 Chauds (7-10)", color: "from-orange-500/30 to-red-500/20", border: "border-orange-400/30" },
          { key: "tiede" as const, label: "🌡️ Tièdes (4-6)", color: "from-amber-500/20 to-yellow-500/10", border: "border-amber-400/20" },
          { key: "froid" as const, label: "❄️ Froids (1-3)", color: "from-blue-500/15 to-cyan-500/10", border: "border-blue-400/20" },
        ].map((g) => (
          <div key={g.key} className={`p-4 rounded-2xl bg-gradient-to-b ${g.color} border ${g.border} backdrop-blur-xl space-y-3 min-h-[300px]`}>
            <div className="font-semibold text-sm">{g.label} <span className="text-white/40">· {groups[g.key].length}</span></div>
            {groups[g.key].map((l) => (
              <div key={l.id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{l.conv.client_name ?? "Anonyme"}</span>
                  <span className="text-xs font-bold text-violet-300">{l.score}/10</span>
                </div>
                <div className="text-xs text-white/40 mt-1">{l.conv.client_contact ?? "—"}</div>
                {l.reasons && <div className="text-xs text-white/50 mt-1 italic">{l.reasons}</div>}
              </div>
            ))}
            {groups[g.key].length === 0 && <p className="text-xs text-white/30">Aucun lead.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- FAQ ---------- */
function FaqTab({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<Faq[]>([]);
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);

  const load = useCallback(() => {
    supabase.from("faq").select("*").eq("shop_id", shopId).order("created_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Faq[]));
  }, [shopId]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing?.question || !editing.answer) return;
    const payload = { shop_id: shopId, question: editing.question, answer: editing.answer, keywords: editing.keywords ?? null };
    const { error } = editing.id
      ? await supabase.from("faq").update(payload).eq("id", editing.id)
      : await supabase.from("faq").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Enregistré");
    setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("faq").delete().eq("id", id); load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">FAQ <span className="text-white/30 text-lg ml-2">réponses instantanées</span></h1>
        <button onClick={() => setEditing({})} className="btn-neon"><Plus size={14} /> Question</button>
      </div>
      <p className="text-white/40 text-sm">Quand un client pose une question qui matche, Rachida répond instantanément sans appeler l'IA (plus rapide, gratuit).</p>
      <div className="space-y-2">
        {items.map((f) => (
          <GlassCard key={f.id} className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="font-medium">{f.question}</div>
              <div className="text-sm text-white/60 mt-1">{f.answer}</div>
              {f.keywords && <div className="text-xs text-violet-300 mt-2">Mots-clés : {f.keywords}</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(f)} className="text-sm text-violet-300 hover:text-violet-200">Modifier</button>
              <button onClick={() => del(f.id)} className="text-red-400"><Trash2 size={16} /></button>
            </div>
          </GlassCard>
        ))}
        {items.length === 0 && <p className="text-white/40 text-sm">Aucune FAQ. Ajoute tes questions les plus fréquentes (livraison, paiement, horaires...)</p>}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 className="font-bold text-lg">{editing.id ? "Modifier" : "Nouvelle"} FAQ</h3>
          <Field label="Question"><input className="input-neon" value={editing.question ?? ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} placeholder="Quels sont vos horaires ?" /></Field>
          <Field label="Réponse"><textarea className="input-neon" rows={4} value={editing.answer ?? ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} placeholder="Nous sommes ouverts de 8h à 18h, du lundi au samedi." /></Field>
          <Field label="Mots-clés (séparés par espaces ou virgules)"><input className="input-neon" value={editing.keywords ?? ""} onChange={(e) => setEditing({ ...editing, keywords: e.target.value })} placeholder="horaire ouvert fermeture heures" /></Field>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="btn-ghost">Annuler</button>
            <button onClick={save} className="btn-neon">Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Shop ---------- */
function ShopTab({ shop, onUpdated }: { shop: Shop; onUpdated: (s: Shop) => void }) {
  const [form, setForm] = useState(shop);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const { data, error } = await supabase.from("shops").update({
      name: form.name, whatsapp: form.whatsapp, color: form.color, greeting: form.greeting,
      max_remise: form.max_remise, rachida_name: form.rachida_name, currency: form.currency,
      system_prompt_extra: form.system_prompt_extra, slug: form.slug,
    }).eq("id", shop.id).select().limit(1);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (data?.[0]) { onUpdated(data[0] as Shop); toast.success("Boutique mise à jour"); }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">IA & Boutique</h1>
      <GlassCard>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nom de la boutique"><input className="input-neon" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Identifiant URL (slug)"><input className="input-neon" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })} /></Field>
          <Field label="WhatsApp (ex: 22670000000)"><input className="input-neon" value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
          <Field label="Nom de l'IA"><input className="input-neon" value={form.rachida_name} onChange={(e) => setForm({ ...form, rachida_name: e.target.value })} /></Field>
          <Field label="Couleur du widget"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20 rounded-lg bg-transparent border border-white/10" /></Field>
          <Field label="Devise"><input className="input-neon" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
          <Field label="Remise max (%)"><input type="number" className="input-neon" value={form.max_remise} onChange={(e) => setForm({ ...form, max_remise: parseInt(e.target.value) || 0 })} /></Field>
        </div>
        <Field label="Message d'accueil"><textarea className="input-neon" rows={2} value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} /></Field>
        <Field label="Personnalité & instructions supplémentaires"><textarea className="input-neon" rows={4} value={form.system_prompt_extra ?? ""} onChange={(e) => setForm({ ...form, system_prompt_extra: e.target.value })} placeholder="Ex : Tu es spécialisée en mode féminine, sois enthousiaste et propose toujours des coordonnés." /></Field>
        <button onClick={save} disabled={saving} className="btn-neon mt-4">{saving ? "..." : "Enregistrer"}</button>
      </GlassCard>
    </div>
  );
}

/* ---------- Catalog ---------- */
function CatalogTab({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [smartOpen, setSmartOpen] = useState(false);
  const [showCsv, setShowCsv] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    setItems((data ?? []) as Product[]);
  }, [shopId]);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!editing?.name) return;
    const payload = {
      shop_id: shopId, name: editing.name, price: editing.price ?? 0,
      category: editing.category ?? null, gender: editing.gender ?? null, color: editing.color ?? null,
      image_url: editing.image_url ?? null, stock: editing.stock ?? 0,
      description: editing.description ?? null, is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Enregistré"); setEditing(null); void load();
  }
  async function del(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id); void load();
  }
  async function importCSV(file: File) {
    const txt = await file.text();
    const lines = txt.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(","); const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = (cols[i] ?? "").trim(); });
      return {
        shop_id: shopId, name: o.name || o.nom || "",
        price: parseFloat(o.price || o.prix || "0") || 0,
        category: o.category || o.categorie || null, gender: o.gender || o.genre || null,
        color: o.color || o.couleur || null, image_url: o.image_url || o.image || null,
        stock: parseInt(o.stock || "0") || 0, description: o.description || null,
      };
    }).filter((r) => r.name);
    if (!rows.length) return toast.error("Fichier vide ou sans colonne 'name'");
    const { error } = await supabase.from("products").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} produits importés`); void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Catalogue <span className="text-white/30 text-lg ml-2">{items.length}</span></h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSmartOpen(true)} className="btn-neon">
            <Sparkles size={14} /> Ajout intelligent
          </button>
          <button onClick={() => setEditing({ is_active: true, stock: 1 })} className="btn-ghost"><Plus size={14} /> Un par un</button>
          <button onClick={() => setShowCsv((v) => !v)} className="text-xs text-white/40 hover:text-white/70 px-2">
            {showCsv ? "Masquer" : "Import avancé (fichier)"}
          </button>
        </div>
      </div>
      <p className="text-sm text-white/50">
        Prends une photo de tes produits, colle une liste WhatsApp, ou parle à Rachida — elle range tout pour toi. Pas besoin de connaître Excel.
      </p>
      {showCsv && (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/50 flex flex-wrap items-center gap-3">
          <label className="btn-ghost cursor-pointer !text-xs"><Upload size={14} /> Fichier CSV / Excel exporté
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
          </label>
          <span>Colonnes : <code className="text-violet-300">name,price,category,gender,color,image_url,stock,description</code></span>
        </div>
      )}

      {smartOpen && (
        <SmartImportModal shopId={shopId} onClose={() => setSmartOpen(false)} onImported={() => void load()} />
      )}


      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => (
          <motion.div key={p.id} whileHover={{ y: -3 }} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="flex gap-3">
              {p.image_url ? <img src={p.image_url} alt="" className="w-16 h-16 object-cover rounded-xl" /> : <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 rounded-xl" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-white/40 mt-0.5">{p.price} · {p.category ?? "—"} · stock {p.stock}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditing(p)} className="text-xs text-violet-300 hover:text-violet-200">Modifier</button>
                  <button onClick={() => del(p.id)} className="text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-sm text-white/40 col-span-full">Aucun produit. Ajoutes-en un ou importe un CSV.</p>}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 className="font-bold text-lg">{editing.id ? "Modifier" : "Nouveau"} produit</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom"><input className="input-neon" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Prix"><input type="number" className="input-neon" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) })} /></Field>
            <Field label="Catégorie"><input className="input-neon" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
            <Field label="Genre"><input className="input-neon" placeholder="homme/femme/enfant" value={editing.gender ?? ""} onChange={(e) => setEditing({ ...editing, gender: e.target.value })} /></Field>
            <Field label="Couleur"><input className="input-neon" value={editing.color ?? ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} /></Field>
            <Field label="Stock"><input type="number" className="input-neon" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="URL image"><input className="input-neon" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></Field>
          <PhotoRetoucher current={editing.image_url ?? ""} productName={editing.name ?? "produit"} onDone={(url) => setEditing({ ...editing, image_url: url })} />
          <Field label="Description"><textarea className="input-neon" rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="btn-ghost">Annuler</button>
            <button onClick={save} className="btn-neon">Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Orders ---------- */
function OrdersTab({ shopId, currency }: { shopId: string; currency: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = useCallback(() => {
    supabase.from("orders").select("*").eq("shop_id", shopId).order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as Order[]));
  }, [shopId]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id); load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Commandes <span className="text-white/30 text-lg ml-2">{orders.length}</span></h1>
      {orders.map((o) => (
        <GlassCard key={o.id}>
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <div className="font-medium">{o.client_name ?? "Anonyme"} — <span className="text-white/60">{o.client_contact ?? "—"}</span></div>
              <div className="text-xs text-white/40">{new Date(o.created_at).toLocaleString("fr")}</div>
            </div>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="input-neon !py-1 !text-sm !w-auto">
              <option value="nouvelle">Nouvelle</option><option value="confirmée">Confirmée</option>
              <option value="livrée">Livrée</option><option value="annulée">Annulée</option>
            </select>
          </div>
          <pre className="text-xs mt-2 bg-black/30 p-2 rounded overflow-auto text-white/70">{JSON.stringify(o.cart, null, 2)}</pre>
          <div className="text-right font-bold mt-1">Total : {o.total} {currency}</div>
        </GlassCard>
      ))}
      {orders.length === 0 && <p className="text-sm text-white/40">Aucune commande pour l'instant.</p>}
    </div>
  );
}

/* ---------- Integration ---------- */
const PLATFORMS: Record<string, { label: string; emoji: string; steps: string[]; link?: { label: string; url: string } }> = {
  wordpress: {
    label: "WordPress",
    emoji: "🟦",
    steps: [
      "Installez le plugin gratuit « Insert Headers and Footers » (ou WPCode).",
      "Allez dans Réglages → Insert Headers and Footers.",
      "Collez le script dans la zone « Scripts in Footer ».",
      "Cliquez sur Enregistrer. Rachida apparaît en bas à droite immédiatement.",
    ],
    link: { label: "Voir le plugin", url: "https://wordpress.org/plugins/insert-headers-and-footers/" },
  },
  wix: {
    label: "Wix",
    emoji: "🟧",
    steps: [
      "Dans Wix : Paramètres → Avancé → Code personnalisé.",
      "Cliquez sur + Ajouter du code.",
      "Collez le script, choisissez « Corps - fin », et appliquez à toutes les pages.",
      "Publiez votre site Wix.",
    ],
    link: { label: "Aide Wix", url: "https://support.wix.com/fr/article/code-personnalise" },
  },
  shopify: {
    label: "Shopify",
    emoji: "🟩",
    steps: [
      "Boutique en ligne → Thèmes → Actions → Modifier le code.",
      "Ouvrez le fichier theme.liquid.",
      "Collez le script juste avant </body>.",
      "Enregistrez.",
    ],
  },
  squarespace: {
    label: "Squarespace",
    emoji: "⬛",
    steps: [
      "Réglages → Avancé → Injection de code.",
      "Collez le script dans le champ « Pied de page ».",
      "Enregistrez.",
    ],
  },
  webflow: {
    label: "Webflow",
    emoji: "🟪",
    steps: [
      "Project Settings → Custom Code → Footer Code.",
      "Collez le script et Save Changes.",
      "Publiez le site.",
    ],
  },
  other: {
    label: "Site fait main / autre",
    emoji: "🌐",
    steps: ["Collez le script juste avant la balise </body> de votre HTML."],
  },
};

function IntegrationTab({ shop }: { shop: Shop }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const snippet = `<script src="${origin}/widget/rachida.js" data-shop="${shop.slug}" async defer onerror="console.warn('Rachida widget indisponible')"></script>`;
  const safeSnippet = `<script>(function(){try{var s=document.createElement('script');s.src='${origin}/widget/rachida.js';s.async=true;s.defer=true;s.setAttribute('data-shop','${shop.slug}');s.onerror=function(){console.warn('Rachida widget indisponible')};document.body.appendChild(s)}catch(e){console.warn('Rachida non chargée',e)}})();</script>`;
  const [platform, setPlatform] = useState<string>("wordpress");
  const plat = PLATFORMS[platform];

  const copy = () => { navigator.clipboard.writeText(snippet); toast.success("Code copié !"); };

  /* Diagnostic */
  const runCheck = useServerFn(checkInstall);
  const [siteUrl, setSiteUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ ok: boolean; reason?: string; message?: string } | null>(null);
  const doCheck = async () => {
    if (!siteUrl.trim()) { toast.error("Entrez l'URL de votre site"); return; }
    setChecking(true); setCheckResult(null);
    try {
      const r = await runCheck({ data: { url: siteUrl, slug: shop.slug } });
      setCheckResult(r);
      r.ok ? toast.success("Rachida est active !") : toast.error("Rachida non détectée");
    } catch (e: any) {
      setCheckResult({ ok: false, reason: e?.message || "Erreur" });
    } finally { setChecking(false); }
  };

  /* Webmaster invite */
  const [techEmail, setTechEmail] = useState("");
  const inviteWebmaster = () => {
    if (!techEmail.trim()) { toast.error("Email du technicien requis"); return; }
    const subject = encodeURIComponent(`Installation du widget Rachida AI sur ${shop.name}`);
    const body = encodeURIComponent(
`Bonjour,

Je vous demande d'installer le widget Rachida AI (assistante de vente intelligente) sur le site de ${shop.name}.

C'est très simple : collez le code ci-dessous juste avant la balise </body> de toutes les pages du site.

------ CODE À COLLER ------
${snippet}
---------------------------

Plus d'infos : ${origin}
Page boutique de démonstration : ${origin}/shop/${shop.slug}

Une fois installé, je pourrai vérifier que tout fonctionne depuis mon tableau de bord Rachida.

Merci !`
    );
    window.location.href = `mailto:${encodeURIComponent(techEmail)}?subject=${subject}&body=${body}`;
    toast.success("Mail prêt à envoyer");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Intégration</h1>
        <Link to="/shop/$slug" params={{ slug: shop.slug }} target="_blank" className="btn-ghost">
          <ExternalLink className="size-4" /> Ma page boutique offerte
        </Link>
      </div>

      {/* Sélecteur de plateforme */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Globe className="size-4 text-cyan-300" /> Quelle est votre plateforme ?</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          {Object.entries(PLATFORMS).map(([k, p]) => (
            <button
              key={k}
              onClick={() => setPlatform(k)}
              className={`p-3 rounded-xl border text-sm transition text-left ${
                platform === k
                  ? "bg-violet-500/20 border-violet-400/60 shadow-[0_0_20px_rgba(124,92,255,.3)]"
                  : "bg-white/3 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="text-xl">{p.emoji}</div>
              <div className="font-medium text-xs mt-1">{p.label}</div>
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-black/30 border border-white/5 p-4 space-y-3">
          <div className="text-sm font-medium text-white/90">{plat.emoji} Installer sur {plat.label}</div>
          <ol className="text-sm text-white/70 space-y-1.5 list-decimal list-inside">
            {plat.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          {plat.link && (
            <a href={plat.link.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 hover:underline inline-flex items-center gap-1">
              <ExternalLink className="size-3" /> {plat.link.label}
            </a>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs text-white/50 mb-2">Code à copier :</p>
          <pre className="bg-black/40 p-3 rounded-xl text-xs overflow-x-auto text-cyan-300 border border-white/5 whitespace-pre-wrap break-all">{snippet}</pre>
          <button onClick={copy} className="btn-neon mt-3"><Copy className="size-4" /> Copier le code simple</button>
          <details className="mt-3 text-xs text-white/60">
            <summary className="cursor-pointer text-cyan-200">Version ultra-sécurisée si votre site bloque les scripts</summary>
            <pre className="mt-2 bg-black/40 p-3 rounded-xl overflow-x-auto text-cyan-300 border border-white/5 whitespace-pre-wrap break-all">{safeSnippet}</pre>
          </details>
        </div>
      </GlassCard>

      {/* Diagnostic */}
      <GlassCard>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" /> Diagnostic d'installation</h3>
        <p className="text-sm text-white/60 mb-3">Vérifiez que Rachida est bien active sur votre site.</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="url"
            placeholder="https://monsite.com"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            className="input-neon flex-1 min-w-[200px]"
          />
          <button onClick={doCheck} disabled={checking} className="btn-neon disabled:opacity-50">
            {checking ? <><Loader2 className="size-4 animate-spin" /> Vérification…</> : <>Vérifier</>}
          </button>
        </div>
        {checkResult && (
          <div className={`mt-3 p-3 rounded-xl text-sm flex items-start gap-2 ${
            checkResult.ok ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-200"
                            : "bg-amber-500/10 border border-amber-400/30 text-amber-100"
          }`}>
            {checkResult.ok ? <CheckCircle2 className="size-5 shrink-0 mt-0.5" /> : <XCircle className="size-5 shrink-0 mt-0.5" />}
            <div>
              <div className="font-medium">{checkResult.ok ? checkResult.message : checkResult.reason}</div>
              {!checkResult.ok && <div className="text-xs opacity-80 mt-1">Choisissez votre plateforme ci-dessus, ou demandez à votre technicien (section suivante).</div>}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Inviter le webmaster */}
      <GlassCard>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Mail className="size-4 text-violet-300" /> Inviter mon webmaster</h3>
        <p className="text-sm text-white/60 mb-3">Pas envie de toucher au code ? Envoyez les instructions à la personne qui s'occupe de votre site.</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="email"
            placeholder="technicien@exemple.com"
            value={techEmail}
            onChange={(e) => setTechEmail(e.target.value)}
            className="input-neon flex-1 min-w-[200px]"
          />
          <button onClick={inviteWebmaster} className="btn-neon"><Mail className="size-4" /> Envoyer les instructions</button>
        </div>
        <p className="text-xs text-white/40 mt-2">Un mail prêt à envoyer s'ouvrira avec le code et les étapes claires.</p>
      </GlassCard>

      {/* Pas de site */}
      <GlassCard>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="size-4 text-pink-300" /> Pas de site web ?</h3>
        <p className="text-sm text-white/60 mb-3">
          Ta boutique en ligne offerte est déjà prête, avec Rachida intégrée. Partage simplement le lien :
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          <code className="flex-1 min-w-[200px] bg-black/40 p-2.5 rounded-lg text-xs text-cyan-300 border border-white/5 break-all">
            {origin}/shop/{shop.slug}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(`${origin}/shop/${shop.slug}`); toast.success("Lien copié !"); }}
            className="btn-ghost"
          ><Copy className="size-4" /> Copier</button>
          <Link to="/shop/$slug" params={{ slug: shop.slug }} target="_blank" className="btn-neon">
            <ExternalLink className="size-4" /> Ouvrir
          </Link>
        </div>
      </GlassCard>

      {/* QR code + partage rapide */}
      <GlassCard>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><QrCode className="size-4 text-cyan-300" /> QR code & partage rapide</h3>
        <p className="text-sm text-white/60 mb-3">Imprime-le sur ton étal, ta carte de visite, un flyer. Un scan → ta boutique s'ouvre avec Rachida.</p>
        <div className="flex gap-4 flex-wrap items-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(`${origin}/shop/${shop.slug}`)}`}
            alt="QR code boutique"
            className="w-40 h-40 rounded-xl bg-white p-2"
          />
          <div className="flex-1 min-w-[200px] space-y-2">
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=20&data=${encodeURIComponent(`${origin}/shop/${shop.slug}`)}`}
              download={`rachida-qr-${shop.slug}.png`}
              target="_blank"
              rel="noreferrer"
              className="btn-neon inline-flex"
            ><QrCode className="size-4" /> Télécharger QR haute qualité</a>
            {shop.whatsapp && (
              <a
                href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Salut 👋 Voici ma boutique : ${origin}/shop/${shop.slug}`)}`}
                target="_blank" rel="noreferrer" className="btn-ghost inline-flex"
              ><Share2 className="size-4" /> Partager sur WhatsApp</a>
            )}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${origin}/shop/${shop.slug}`)}`}
              target="_blank" rel="noreferrer" className="btn-ghost inline-flex"
            ><Share2 className="size-4" /> Partager sur Facebook</a>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold mb-2">Capacités du widget</h3>
        <ul className="text-sm text-white/70 space-y-1.5">
          <li>✨ Chat streaming temps réel</li>
          <li>🎤 Reconnaissance vocale (parle au lieu d'écrire)</li>
          <li>🔊 Lecture vocale des réponses</li>
          <li>📷 Upload image (preuve paiement Mobile Money, photo produit)</li>
          <li>🛒 Panier persistant côté client</li>
          <li>💜 Halo coloré selon l'émotion détectée</li>
          <li>🔥 Score lead temps réel</li>
          <li>💬 Bouton transfert WhatsApp humain</li>
          <li>🛡️ Chargement async — n'affecte jamais la vitesse de votre site</li>
        </ul>
      </GlassCard>
    </div>
  );
}

/* ---------- Primitives ---------- */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0a0b1a] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-3 backdrop-blur-xl shadow-2xl shadow-violet-500/20"
        onClick={(e) => e.stopPropagation()}>
        {children}
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-medium text-white/60">{label}</span>{children}</label>;
}

function Style() {
  return (
    <style>{`
      .input-neon { width: 100%; padding: 8px 12px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; color: #fff; font-size: 14px; outline: none; transition: all .15s; }
      .input-neon:focus { border-color: rgba(124,92,255,.6); box-shadow: 0 0 0 3px rgba(124,92,255,.15); }
      .btn-neon { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: linear-gradient(135deg, #7c5cff, #00e5ff); color: #fff; border: none; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 4px 20px rgba(124,92,255,.4); transition: transform .15s; }
      .btn-neon:hover { transform: translateY(-1px); }
      .btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,.05); color: #fff; border: 1px solid rgba(255,255,255,.1); border-radius: 10px; font-weight: 500; font-size: 13px; cursor: pointer; }
      .btn-ghost:hover { background: rgba(255,255,255,.08); }
    `}</style>
  );
}

function PhotoRetoucher({ current, productName, onDone }: { current: string; productName: string; onDone: (url: string) => void }) {
  const retouch = useServerFn(retouchProductPhoto);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => rej(new Error("Lecture impossible"));
        r.readAsDataURL(file);
      });
      const out = await retouch({ data: { imageBase64: b64, productName } });
      onDone(out.image);
      toast.success("Photo retouchée ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur retouche");
    } finally { setBusy(false); }
  };

  const retouchExisting = async () => {
    if (!current) return toast.error("Ajoute une image d'abord");
    setBusy(true);
    try {
      const out = await retouch({ data: { imageBase64: current, productName } });
      onDone(out.image);
      toast.success("Photo retouchée ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur retouche");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <label className="btn-ghost cursor-pointer !text-xs">
        <ImageIcon size={14} /> {busy ? "…" : "Photo → belle photo IA"}
        <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </label>
      {current && (
        <button type="button" onClick={retouchExisting} disabled={busy} className="btn-ghost !text-xs disabled:opacity-50">
          <Sparkles size={14} /> Retoucher l'image actuelle
        </button>
      )}
    </div>
  );
}
