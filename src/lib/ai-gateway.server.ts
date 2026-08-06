// Fournisseur IA Gemini en direct (Google AI Studio), sans intermédiaire.
// Remplace l'ancien gateway Lovable (@lovable.dev) qui n'existe plus une fois le projet indépendant.
//
// Clé requise : GEMINI_API_KEY (variable d'environnement serveur, jamais exposée au client).
// Génère une clé gratuite sur https://aistudio.google.com/app/apikey
//
// IMPORTANT — les identifiants de modèles Gemini changent souvent (nouvelles versions,
// dépréciations). Avant de déployer, vérifie le modèle gratuit recommandé actuel sur
// https://ai.google.dev/gemini-api/docs/models — au besoin, ajuste GEMINI_TEXT_MODEL
// dans les variables d'environnement sans toucher au code.
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Modèle par défaut si GEMINI_TEXT_MODEL n'est pas défini. "gemini-2.5-flash" est un
// identifiant stable au moment de l'écriture ; les modèles "3.x Flash" plus récents
// sont aussi éligibles au niveau gratuit — à confirmer avant mise en prod.
const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";

export function createGeminiProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey });
}

/**
 * Raccourci pratique : renvoie directement un modèle prêt à l'emploi
 * (remplace l'ancien `gateway(model)` de Lovable par un usage identique).
 */
export function geminiModel(modelId: string = DEFAULT_TEXT_MODEL) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY manquant. Ajoute-le dans tes variables d'environnement (clé gratuite sur https://aistudio.google.com/app/apikey).");
  return createGeminiProvider(key)(modelId);
}
