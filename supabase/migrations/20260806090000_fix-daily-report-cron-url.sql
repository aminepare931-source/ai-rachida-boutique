-- L'ancien cron ("rachida-daily-report", migration 20260623080021) appelait un domaine
-- *.lovable.app, propre à l'hébergement Lovable. On le reprogramme vers le domaine de
-- déploiement indépendant (Vercel).
--
-- ⚠️ AVANT D'APPLIQUER CETTE MIGRATION :
--   1. Remplace <TON-DOMAINE-VERCEL> ci-dessous par ton vrai domaine (ex: rachida-boutique.vercel.app)
--   2. Remplace <TA-CLE-PUBLISHABLE> par la clé publishable (anon) du NOUVEAU projet Supabase
--      (visible dans Project Settings > API du nouveau projet, pas l'ancienne clé Lovable)

SELECT cron.unschedule('rachida-daily-report');

SELECT cron.schedule(
  'rachida-daily-report',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<TON-DOMAINE-VERCEL>/api/public/hooks/daily-report',
    headers := '{"Content-Type":"application/json","apikey":"<TA-CLE-PUBLISHABLE>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
