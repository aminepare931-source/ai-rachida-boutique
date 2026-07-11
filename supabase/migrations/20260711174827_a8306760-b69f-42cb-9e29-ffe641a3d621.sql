
CREATE TABLE public.installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
  shop_slug text NOT NULL,
  parent_url text NOT NULL,
  parent_host text NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'active',
  last_error text,
  hits integer NOT NULL DEFAULT 1,
  site_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_slug, parent_host)
);

CREATE INDEX installations_shop_id_idx ON public.installations(shop_id);
CREATE INDEX installations_last_seen_idx ON public.installations(last_seen_at DESC);

GRANT SELECT ON public.installations TO authenticated;
GRANT ALL ON public.installations TO service_role;

ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their shop installations"
ON public.installations FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.shops s WHERE s.id = installations.shop_id AND s.owner_id = auth.uid())
);

CREATE TRIGGER touch_installations_updated_at
BEFORE UPDATE ON public.installations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
