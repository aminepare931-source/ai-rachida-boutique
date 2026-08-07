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

// Modèle par défaut si GEMINI_TEXT_MODEL n'est pas défini. On utilise la variante
// "Flash-Lite" plutôt que "Flash" : contrairement à Flash, Flash-Lite n'a PAS le
// raisonnement interne ("thinking") activé par défaut, ce qui évite la classe de bug
// "réponse vide" (les jetons de réflexion qui grignotent tout le budget de sortie).
// Reste éligible au niveau gratuit — à reconfirmer sur https://ai.google.dev/gemini-api/docs/models
const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";

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

/**
 * IMPORTANT — Gemini 2.5/3 Flash a le "thinking" (raisonnement interne) activé par
 * défaut. Ces jetons de réflexion consomment le budget de sortie AVANT le texte
 * visible : sans ce réglage, la réponse peut arriver vide (finishReason "MAX_TOKENS",
 * sans erreur). On le désactive ici car un chat de vente n'a pas besoin de raisonnement
 * profond — passe ceci en `providerOptions` sur CHAQUE appel generateText/streamText.
 * Référence : https://ai.google.dev/gemini-api/docs/thinking
 */
export const noThinking = { google: { thinkingConfig: { thinkingBudget: 0 } } };

/**
 * Filet de sécurité supplémentaire : un maxOutputTokens généreux et explicite, pour
 * ne jamais dépendre d'une valeur par défaut trop basse côté fournisseur.
 */
export const GENEROUS_MAX_TOKENS = 2048;
