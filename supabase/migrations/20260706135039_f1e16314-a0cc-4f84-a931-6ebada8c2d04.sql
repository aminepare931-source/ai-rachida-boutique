CREATE TABLE public.mirrors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  source_url text NOT NULL,
  cached_html text,
  title text,
  status text NOT NULL DEFAULT 'live',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mirrors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mirrors TO authenticated;
GRANT ALL ON public.mirrors TO service_role;
ALTER TABLE public.mirrors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read live mirrors" ON public.mirrors FOR SELECT TO anon USING (status IN ('live','snapshot'));
CREATE POLICY "auth read live mirrors" ON public.mirrors FOR SELECT TO authenticated USING (
  status IN ('live','snapshot') OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
);
CREATE POLICY "owner manages own mirrors" ON public.mirrors FOR ALL TO authenticated
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));
CREATE TRIGGER mirrors_touch_updated_at BEFORE UPDATE ON public.mirrors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX mirrors_shop_idx ON public.mirrors(shop_id);