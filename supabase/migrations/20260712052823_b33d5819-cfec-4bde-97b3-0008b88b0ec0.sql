
DROP POLICY IF EXISTS "auth can read all products" ON public.products;
CREATE POLICY "auth can read active products" ON public.products
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "auth can read all shops public info" ON public.shops;
-- Owned shops are already readable via "owners manage their shops" (FOR ALL).
-- Non-owners no longer receive private shop rows via the authenticated role;
-- public storefront reads continue through the anon policy and server routes.
