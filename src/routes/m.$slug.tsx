import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Public "site miroir" page. We simply redirect (307) to the proxy endpoint
 * that streams the rewritten HTML with Rachida injected. Keeping this as a
 * TanStack route lets us have a clean URL: /m/<slug>.
 */
export const Route = createFileRoute("/m/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ href: `/api/public/mirror?slug=${encodeURIComponent(params.slug)}` });
  },
  component: () => null,
});
