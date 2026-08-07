import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SearchBody = {
  shopSlug: string;
  query: string;
  filters?: { priceMax?: number; priceMin?: number; gender?: string; color?: string; category?: string };
  limit?: number;
};

export const Route = createFileRoute("/api/public/rachida-search")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      POST: async ({ request }) => {
        const body = (await request.json()) as SearchBody;
        if (!body?.shopSlug) {
          return new Response("bad request", { status: 400, headers: corsHeaders });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shops } = await supabaseAdmin
          .from("shops")
          .select("id")
          .eq("slug", body.shopSlug)
          .order("created_at", { ascending: false })
          .limit(1);
        const shop = shops?.[0];
        if (!shop) {
          if (body.shopSlug === "demo") return Response.json({ products: [] }, { headers: corsHeaders });
          return new Response("shop not found", { status: 404, headers: corsHeaders });
        }

        let q = supabaseAdmin
          .from("products")
          .select("id, name, price, category, gender, color, image_url, stock, description")
          .eq("shop_id", shop.id)
          .eq("is_active", true);

        const f = body.filters ?? {};
        if (f.priceMax) q = q.lte("price", f.priceMax);
        if (f.priceMin) q = q.gte("price", f.priceMin);
        if (f.gender) q = q.eq("gender", f.gender);
        if (f.color) q = q.ilike("color", `%${f.color}%`);
        if (f.category) q = q.ilike("category", `%${f.category}%`);

        if (body.query?.trim()) {
          const term = `%${body.query.trim()}%`;
          q = q.or(`name.ilike.${term},description.ilike.${term},category.ilike.${term}`);
        }

        const { data: products } = await q.limit(body.limit ?? 20);

        return new Response(JSON.stringify({ products: products ?? [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      },
    },
  },
});
