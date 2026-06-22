# RACHIDA AI — Refonte Premium 2026 + Extension IA

Le MVP fonctionnel existe déjà (auth, dashboard, catalogue, widget, chat IA, émotions, persistance). Cette phase transforme l'expérience visuelle et étend les capacités IA. Travail découpé en **3 phases livrables séparément** — chaque phase est testable avant de passer à la suivante.

---

## PHASE 1 — Design System Premium + Landing Cinématique

**Objectif** : qu'un investisseur dise "cette plateforme a 2 ans d'avance" dès la landing.

### Design System (`src/styles.css`)
- Palette futuriste : fond `#05060F` (near-black bleuté), néons `#7C5CFF` (violet electric) + `#00E5FF` (cyan), accent or `#F4C95D` pour les CTAs premium
- Typo : **Space Grotesk** (display) + **Inter Tight** (body), monospace **JetBrains Mono** pour les chiffres
- Tokens : gradients néon, glows OKLCH, glassmorphism (backdrop-blur + bordures 1px white/10), shadows multi-couches
- Mode sombre uniquement (le futuriste passe mal en light)

### Dépendances à installer
`framer-motion`, `gsap` + `@gsap/react`, `three`, `@react-three/fiber`, `@react-three/drei`, `lenis` (smooth scroll), `lottie-react`, `recharts`

### Landing (`src/routes/index.tsx`) — refonte complète
- **Hero** : sphère 3D Three.js (réseau de particules formant un visage IA stylisé) qui réagit à la souris, headline en révélation lettre par lettre (GSAP SplitText), CTA glassmorphique avec halo néon
- **Section "Elle parle comme une vraie vendeuse"** : démo chat live animée (messages qui apparaissent en streaming simulé, détection émotion visualisée par halo coloré)
- **Section capacités** : bento grid 3D, cartes qui se soulèvent au hover avec parallax tilt
- **Section "Comment ça marche"** : timeline scroll-driven (ScrollTrigger) — 3 étapes qui s'animent au scroll
- **Section chiffres** : compteurs animés au viewport
- **Section langues** : FR/Mooré/Dioula avec drapeaux animés
- **CTA final** : carte glass + glow pulsant
- Smooth scroll Lenis sur toute la page

### Auth (`src/routes/auth.tsx`) — refonte
- Split-screen : gauche = formulaire glass, droite = animation Three.js (grille néon perspective)

**Livrable Phase 1** : landing + auth visuellement "wow", dashboard inchangé pour l'instant.

---

## PHASE 2 — Dashboard Premium Style Linear/Vercel

### Layout
- Sidebar fixe glass avec icônes Lucide animées, indicateur actif néon coulissant (layoutId Framer)
- Topbar avec recherche command-palette (Cmd+K), avatar, notifications
- Contenu en grille bento

### Pages dashboard refaites
1. **Vue d'ensemble** (nouvelle) : KPIs cards animées (ventes, leads, conversion, sentiment moyen), graphique Recharts area avec gradient néon, heatmap conversations par heure, top produits
2. **Conversations** : liste temps réel (Supabase Realtime), détail conversation avec timeline messages + badges émotion colorés + score lead
3. **Catalogue** : grille produits avec preview cards 3D tilt, modal édition glass, import CSV avec drop-zone animée
4. **Leads** : kanban scoring 1-10 avec drag (dnd-kit), filtres
5. **Configuration IA** : éditeur ton/personnalité avec preview live de Rachida qui répond
6. **Boutique** : color picker live, preview widget en iframe

### Micro-interactions partout
- Hover : scale + glow
- Loading : skeletons shimmer + "Rachida réfléchit..." avec dots animés
- Toasts : slide + glass

**Livrable Phase 2** : dashboard digne de Linear.

---

## PHASE 3 — Extensions IA & Backend

### Nouvelles tables DB
- `customer_profiles` : mémoire persistante par client (prénom, langue, budget, préférences, historique) — clé `(shop_id, customer_phone)` 
- `product_views` : tracking consultations
- `lead_scores` : score 1-10 + raisons
- `faq` : Q/R par boutique (servies sans appel IA)
- `loyalty` : compteur commandes/dépenses par client
- `daily_reports` : rapports générés
- `payment_proofs` : analyses Mobile Money

### Server functions / routes nouvelles
- `/api/public/rachida-chat` — enrichi : mémoire client, FAQ-first (skip IA si match), détection langue auto (FR/Mooré/Dioula), scoring lead temps réel, négociation avec remise max, détection achat → création order, upsell auto
- `/api/public/rachida-vision` — analyse image (capture Mobile Money + photo produit) via Gemini vision
- `/api/public/rachida-search` — recherche catalogue full-text + filtres extraits (RACHIDA_QUERY_PRODUCTS)
- `/api/public/rachida-tts` — text-to-speech (Lovable AI Gateway si dispo, sinon Web Speech côté widget)
- Cron quotidien 08h00 : `/api/public/hooks/daily-report` → génère rapport, log dans `daily_reports`

### Widget (`public/widget/rachida.js`) — extensions
- Bouton micro (STT navigateur)
- Lecture audio des réponses (toggle)
- Affichage "Rachida réfléchit..." avec animation
- Halo coloré selon émotion détectée
- Panier conversationnel persistant (localStorage par shop)
- Upload image (preuve paiement / photo produit)
- Comparateur tableau quand demandé

### Sécurité
- Rate limiting par IP sur `/api/public/*` (table `rate_limits` + check 30 req/min)
- RLS audit complet (script de vérif)
- Validation Zod sur tous les endpoints publics

**Livrable Phase 3** : Rachida = vraie vendeuse 24/7.

---

## Hors scope (à proposer plus tard)
- Paiement Stripe/abonnements (l'utilisateur a dit "pas encore")
- Sync Shopify/WooCommerce
- App mobile native
- Module actualités sport/CAN

---

## Question avant de démarrer

Je commence par **Phase 1 (design landing + auth)** seule, puis tu valides visuellement avant que je passe au dashboard ? Ou tu préfères que j'enchaîne Phase 1+2 d'un coup ?

Confirme aussi : palette néon violet+cyan sur fond near-black OK, ou tu veux une autre direction (ex: or+vert africain, rouge burkinabè, etc.) ?