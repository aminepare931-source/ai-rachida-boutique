// Config Vite standard, sans dépendance à Lovable.
// Remplace l'ancien "@lovable.dev/vite-tanstack-config", qui empaquetait en un seul
// bloc : TanStack Start, le plugin React, Tailwind, tsconfig-paths, Nitro (preset
// Cloudflare par défaut), un "componentTagger" dev-only propre à l'éditeur Lovable,
// l'injection des variables VITE_*, et un logger d'erreurs propriétaire.
// Ici on recompose la même chaîne avec les paquets officiels.
//
// Référence (recette officielle TanStack Start + Nitro sur Vercel) :
// https://vercel.com/docs/frameworks/full-stack/tanstack-start
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // L'ordre compte : tanstackStart() doit précéder viteReact().
    tanstackStart(),
    viteReact(),
    tailwindcss(),
    // Sans "preset" explicite : Vercel est auto-détecté au déploiement (zéro config).
    // En local, Nitro utilise un serveur Node standard.
    nitro(),
  ],
  environments: {
    ssr: {
      build: {
        rollupOptions: { input: "./src/server.ts" },
      },
    },
  },
});
