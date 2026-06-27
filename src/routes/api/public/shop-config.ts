import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const Route = createFileRoute("/api/public/shop-config")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: corsHeaders }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("shop");
        if (!slug) {
          return Response.json({ error: "missing shop" }, { status: 400, headers: corsHeaders });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shops, error } = await supabaseAdmin
          .from("shops")
          .select("id, slug, name, whatsapp, color, greeting, max_remise, rachida_name, currency")
          .eq("slug", slug)
          .order("created_at", { ascending: false })
          .limit(1);
        const shop = shops?.[0];
        if (error || !shop) {
          return Response.json({ error: "shop not found" }, { status: 404, headers: corsHeaders });
        }
        return Response.json({ shop: { ...shop, avatar_url: "/rachida-avatar.png" } }, { headers: corsHeaders });
      },
    },
  },
});
