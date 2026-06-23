import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const Route = createFileRoute("/api/public/hooks/daily-report")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || apikey !== expected) {
          return new Response("unauthorized", { status: 401, headers: corsHeaders });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const dayStr = yesterday.toISOString().slice(0, 10);
        const startIso = `${dayStr}T00:00:00Z`;
        const endIso = `${dayStr}T23:59:59Z`;

        const { data: shops } = await supabaseAdmin.from("shops").select("id, name");
        let count = 0;

        for (const shop of shops ?? []) {
          const [{ data: convs }, { data: orders }] = await Promise.all([
            supabaseAdmin
              .from("conversations")
              .select("id, emotion")
              .eq("shop_id", shop.id)
              .gte("created_at", startIso)
              .lte("created_at", endIso),
            supabaseAdmin
              .from("orders")
              .select("id, total, cart")
              .eq("shop_id", shop.id)
              .gte("created_at", startIso)
              .lte("created_at", endIso),
          ]);

          const emotions: Record<string, number> = {};
          (convs ?? []).forEach((c) => {
            const e = c.emotion ?? "neutre";
            emotions[e] = (emotions[e] ?? 0) + 1;
          });

          const revenue = (orders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0);

          // top products from carts
          const productCount: Record<string, number> = {};
          (orders ?? []).forEach((o) => {
            const cart = o.cart as Array<{ name?: string; qty?: number }> | null;
            if (Array.isArray(cart)) {
              cart.forEach((item) => {
                const n = item?.name;
                if (n) productCount[n] = (productCount[n] ?? 0) + (item.qty ?? 1);
              });
            }
          });
          const topProducts = Object.entries(productCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, qty]) => ({ name, qty }));

          const summary = `${convs?.length ?? 0} conversations, ${orders?.length ?? 0} commandes, ${revenue} CFA générés.`;

          await supabaseAdmin
            .from("daily_reports")
            .upsert(
              {
                shop_id: shop.id,
                report_date: dayStr,
                conversations_count: convs?.length ?? 0,
                orders_count: orders?.length ?? 0,
                revenue,
                top_products: topProducts,
                emotions_breakdown: emotions,
                summary,
              },
              { onConflict: "shop_id,report_date" },
            );
          count++;
        }

        return new Response(JSON.stringify({ ok: true, reports_generated: count, date: dayStr }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      },
    },
  },
});
