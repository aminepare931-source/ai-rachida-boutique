-- Crée la boutique "demo" utilisée partout où le widget Rachida a besoin d'un contexte
-- de boutique (widget en mode "platform" sur la landing page, bouton "Discuter avec
-- Rachida", page /shop/demo). Sans cette ligne, ces appels échouent en 404 sur une
-- base tout juste créée.
--
-- ⚠️ PRÉREQUIS : tu dois avoir créé au moins un compte via /auth avant d'exécuter ceci
-- (la boutique doit appartenir à un utilisateur existant). Si l'insertion échoue avec
-- une erreur de contrainte "owner_id", crée d'abord ton compte, puis relance.

insert into public.shops (owner_id, slug, name, whatsapp, greeting, rachida_name, currency)
select id, 'demo', 'Boutique Démo', null,
       'Bonjour ! Comment puis-je vous aider ? 😊', 'Rachida', 'FCFA'
from auth.users
order by created_at asc
limit 1
on conflict (slug) do nothing;

insert into public.products (shop_id, name, description, price, category, image_url, stock)
select s.id, p.name, p.description, p.price, p.category, p.image_url, p.stock
from public.shops s
cross join (values
  ('Sac en cuir cousu main', 'Finition Ouagadougou', 25000, 'Accessoires', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', 12),
  ('Boubou wax édition limitée', 'Édition limitée', 32000, 'Mode', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600', 8),
  ('Beurre de karité bio 250g', 'Soin naturel', 4500, 'Cosmétique', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 30),
  ('Bijoux dorés artisanaux', 'Fabrication artisanale', 12000, 'Accessoires', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', 15)
) as p(name, description, price, category, image_url, stock)
where s.slug = 'demo'
on conflict do nothing;
