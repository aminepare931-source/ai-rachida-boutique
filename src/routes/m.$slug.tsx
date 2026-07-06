import { createFileRoute } from "@tanstack/react-router";

/**
 * Public mirror page: /m/<slug> — a server route that internally delegates to
 * /api/public/mirror. Keeping /m/<slug> nice and short for sharing (bio, QR,
 * WhatsApp status).
 */
export const Route = createFileRoute("/m/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const target = new URL(`/api/public/mirror?slug=${encodeURIComponent(params.slug)}`, request.url);
        // Delegate to the mirror endpoint (same origin, keeps caching + fallback).
        return fetch(target.toString(), { headers: { "User-Agent": "RachidaMirrorRelay/1.0" } });
      },
    },
  },
});
