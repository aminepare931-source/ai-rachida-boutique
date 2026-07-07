
DROP POLICY IF EXISTS "public insert abandoned carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "auth insert abandoned carts" ON public.abandoned_carts;
CREATE POLICY "public insert abandoned carts" ON public.abandoned_carts FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = abandoned_carts.shop_id));
CREATE POLICY "auth insert abandoned carts" ON public.abandoned_carts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = abandoned_carts.shop_id));
