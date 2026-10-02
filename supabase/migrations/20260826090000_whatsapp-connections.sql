-- Connexion WhatsApp Business (Cloud API Meta) par boutique.
--
-- Table SÉPARÉE de "shops" volontairement : "shops" est lisible publiquement (anon)
-- pour que la boutique en ligne fonctionne, donc on ne peut PAS y stocker un jeton
-- d'accès WhatsApp — n'importe qui pourrait le lire via l'API publique.
-- Ici : aucun accès anonyme du tout, seulement le propriétaire de la boutique et le
-- service_role (utilisé côté serveur par le webhook).

CREATE TABLE public.whatsapp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE UNIQUE,
  phone_number_id TEXT NOT NULL UNIQUE,
  waba_id TEXT,
  display_phone_number TEXT,
  access_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_connections TO authenticated;
GRANT ALL ON public.whatsapp_connections TO service_role;
-- Pas de GRANT pour "anon" : aucun accès public, volontairement.

ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage their whatsapp connection" ON public.whatsapp_connections FOR ALL TO authenticated
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
