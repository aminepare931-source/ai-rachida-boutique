import { createFileRoute } from "@tanstack/react-router";

/** Public short link: /m/<slug> — renders the mirror directly (no self-fetch). */
export const Route = createFileRoute("/m/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { handleMirror } = await import("@/lib/mirror-handler.server");
        return handleMirror(params.slug, new URL(request.url).origin);
      },
    },
  },
});
