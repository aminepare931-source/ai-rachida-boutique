import { createFileRoute } from "@tanstack/react-router";
import { handleMirror } from "@/lib/mirror-handler.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/mirror")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");
        if (!slug) return new Response("slug required", { status: 400, headers: CORS });
        return handleMirror(slug, url.origin);
      },
    },
  },
});
