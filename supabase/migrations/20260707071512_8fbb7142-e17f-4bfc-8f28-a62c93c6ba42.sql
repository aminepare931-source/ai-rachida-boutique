
-- Extend shops with payment + onboarding config
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '{"orange_money":{"enabled":false,"number":""},"moov_money":{"enabled":false,"number":""},"wave":{"enabled":false,"number":""},"cash_on_delivery":{"enabled":true}}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS delivery_zones jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS business_hours jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  code text NOT NULL,
  kind text NOT NULL DEFAULT 'percent',
  value numeric NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, code)
);
GRANT SELECT ON public.promo_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active promo codes" ON public.promo_codes FOR SELECT TO anon USING (active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "owner manage promo codes" ON public.promo_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = promo_codes.shop_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = promo_codes.shop_id AND s.owner_id = auth.uid()));
CREATE TRIGGER trg_promo_codes_updated BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  referrer_contact text NOT NULL,
  code text NOT NULL,
  invited_contact text,
  reward_points integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manage referrals" ON public.referrals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = referrals.shop_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = referrals.shop_id AND s.owner_id = auth.uid()));
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Abandoned carts
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  conversation_id uuid,
  customer_contact text,
  customer_name text,
  cart jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  reminded_at timestamptz,
  recovered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT INSERT ON public.abandoned_carts TO anon;
GRANT ALL ON public.abandoned_carts TO service_role;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read abandoned carts" ON public.abandoned_carts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = abandoned_carts.shop_id AND s.owner_id = auth.uid()));
CREATE POLICY "owner update abandoned carts" ON public.abandoned_carts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = abandoned_carts.shop_id AND s.owner_id = auth.uid()));
CREATE POLICY "public insert abandoned carts" ON public.abandoned_carts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth insert abandoned carts" ON public.abandoned_carts FOR INSERT TO authenticated WITH CHECK (true);
CREATE TRIGGER trg_abandoned_carts_updated BEFORE UPDATE ON public.abandoned_carts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  message text NOT NULL,
  target_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manage campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = campaigns.shop_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = campaigns.shop_id AND s.owner_id = auth.uid()));
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
