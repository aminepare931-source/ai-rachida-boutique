
# Rachida AI — Plateforme SaaS pour boutiques du Burkina Faso

Une plateforme où chaque entrepreneur crée un compte, configure sa boutique, importe son catalogue, et obtient un script à coller sur son site. Le widget Rachida (déjà codé dans `rachida.js`) discute avec ses clients, recommande des produits, détecte les émotions, prend des commandes et propose un transfert WhatsApp humain.

## Stack
- **Lovable Cloud** (auth + base de données Postgres + storage images)
- **Lovable AI Gateway** (modèle `google/gemini-3-flash-preview`) — remplace la clé Groq cachée du script original
- **TanStack Start** (déjà en place)
- Widget JS public servable depuis `/widget/rachida.js`

## Phase 1 — MVP (cette itération)

### 1. Landing publique (`/`)
Présentation du produit en français : promesse "une IA vendeuse qui ne dort jamais", démo animée du chat, fonctionnalités (chat vente, détection d'émotions, panier multi-produits, transfert WhatsApp, suivi commandes), CTA "Créer ma boutique gratuitement". Design chaleureux, couleurs adaptées au marché BF.

### 2. Authentification (`/auth`)
Inscription / connexion email + mot de passe via Lovable Cloud.

### 3. Dashboard boutique (`/_authenticated/dashboard`)
- **Onglet Boutique** : nom, logo, WhatsApp, couleur du widget, message d'accueil, remise max, langues.
- **Onglet Catalogue** : 
  - Ajout/édition/suppression manuelle de produits (nom, prix FCFA, catégorie, genre, couleur, image, stock, description)
  - **Import CSV/JSON** d'un catalogue entier
  - (Shopify/WooCommerce reporté en Phase 2)
- **Onglet Conversations** : liste des chats récents, transcripts, émotion détectée, statut commande.
- **Onglet Commandes** : commandes capturées par l'IA avec coordonnées client, panier, statut, bouton "Marquer comme livrée".
- **Onglet Intégration** : snippet `<script src=".../widget/rachida.js" data-shop="SHOP_ID"></script>` à copier-coller.

### 4. Widget embarquable (`/widget/rachida.js`)
Réutilisation directe du `rachida.js` fourni, adapté :
- Charge `RACHIDA_CONFIG` depuis l'API en fonction du `data-shop` du `<script>`
- Pointe `apiEndpoint` vers `/api/public/rachida-chat` (route serveur publique TanStack)
- Conserve : filtrage catalogue, détection émotion, panier multi-produits, demande transfert humain, sauvegarde contact

### 5. Backend IA (`/api/public/rachida-chat`)
Route serveur publique (sans auth — appelée depuis les sites des boutiques, CORS ouvert). Pour chaque message :
1. Identifie la boutique via `shopId`
2. Charge le catalogue filtré (mêmes critères extraits que le JS actuel)
3. Construit le system prompt avec contexte boutique
4. Appelle Lovable AI Gateway en streaming
5. Persiste message, émotion, commande détectée dans Postgres

## Détails techniques

### Schéma base de données
```text
shops          (id, owner_id, name, whatsapp, color, greeting, max_remise, ...)
products       (id, shop_id, name, price, category, gender, color, image_url, stock, description)
conversations  (id, shop_id, client_name, client_contact, emotion, created_at)
messages       (id, conversation_id, role, content, created_at)
orders         (id, shop_id, conversation_id, cart_json, total, status, client_contact)
```
RLS : owner voit uniquement ses propres `shops` et données liées. Une policy `TO anon` lit `shops` + `products` via la route publique (filtrée par `shop_id`).

### Routes
```text
/                                  landing
/auth                              login/signup
/_authenticated/dashboard          shell + onglets
/_authenticated/dashboard/shop
/_authenticated/dashboard/catalog
/_authenticated/dashboard/orders
/_authenticated/dashboard/conversations
/_authenticated/dashboard/integration
/api/public/rachida-chat           POST stream IA (CORS *)
/api/public/shop-config            GET config + catalogue allégé pour widget
/widget/rachida.js                 fichier statique servi depuis /public
```

### Fichiers principaux à créer
- `src/routes/index.tsx` (landing)
- `src/routes/auth.tsx`
- `src/routes/_authenticated/dashboard.tsx` + onglets enfants
- `src/routes/api/public/rachida-chat.ts`
- `src/routes/api/public/shop-config.ts`
- `src/lib/shops.functions.ts`, `products.functions.ts`, `orders.functions.ts`
- `src/lib/ai-gateway.server.ts`
- `public/widget/rachida.js` (adapté depuis l'upload)
- Migration SQL avec tables + GRANTs + RLS

## Phase 2 (plus tard)
- Sync Shopify / WooCommerce
- Abonnement payant (Stripe)
- Multi-langues (Mooré, Dioula, Anglais)
- Relances WhatsApp automatiques (via connector GatewayAPI/Twilio)
- Analytics avancées (taux de conversion par émotion)

## Hors scope de cette itération
- Paiement / facturation des boutiques
- Sync e-commerce externe
- App mobile

Prêt à construire la Phase 1 si tu valides ?
