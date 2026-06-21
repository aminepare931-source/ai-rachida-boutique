
DROP POLICY IF EXISTS "public can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "public can update own conversation by id" ON public.conversations;
DROP POLICY IF EXISTS "public can read own conversation by id" ON public.conversations;
DROP POLICY IF EXISTS "public can insert messages" ON public.messages;
DROP POLICY IF EXISTS "public can read messages" ON public.messages;
DROP POLICY IF EXISTS "public can create orders" ON public.orders;
REVOKE INSERT, UPDATE, SELECT ON public.conversations FROM anon;
REVOKE INSERT, SELECT ON public.messages FROM anon;
REVOKE INSERT ON public.orders FROM anon;
