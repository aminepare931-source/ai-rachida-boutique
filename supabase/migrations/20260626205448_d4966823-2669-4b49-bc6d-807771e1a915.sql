
-- Create a public demo shop reusing the first existing owner for FK validity
INSERT INTO public.shops (slug, name, owner_id, whatsapp, color, greeting, rachida_name, currency)
SELECT 'demo', 'Boutique Démo Rachida', (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
       '22670000000', '#7c5cfc',
       'Salut ! Je suis Rachida 👋 Demande-moi ce que tu cherches, je te conseille en direct.',
       'Rachida', 'FCFA'
WHERE EXISTS (SELECT 1 FROM auth.users)
ON CONFLICT (slug) DO NOTHING;

-- Seed a few demo products
INSERT INTO public.products (shop_id, name, description, price, category, image_url, stock, is_active)
SELECT s.id, p.name, p.description, p.price, p.category, p.image_url, 25, true
FROM public.shops s
CROSS JOIN (VALUES
  ('Sac en cuir cousu main', 'Cuir véritable, finition artisanale Ouagadougou.', 25000, 'mode', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'),
  ('Boubou wax édition limitée', 'Coton 100%, motif exclusif.', 32000, 'mode', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600'),
  ('Beurre de karité bio 250g', 'Karité pur, pressé à froid.', 4500, 'beaute', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600'),
  ('Bijoux dorés artisanaux', 'Plaqué or, fait main par nos artisans.', 12000, 'mode', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600')
) AS p(name, description, price, category, image_url)
WHERE s.slug = 'demo'
  AND NOT EXISTS (SELECT 1 FROM public.products WHERE shop_id = s.id AND name = p.name);
