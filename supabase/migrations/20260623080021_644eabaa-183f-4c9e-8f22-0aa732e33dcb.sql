
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'rachida-daily-report',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--f60803aa-0907-499a-a977-9992f2538ef8.lovable.app/api/public/hooks/daily-report',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_cN3yGbNrpy_NhewHfx29Yg_YOaLZ7II"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
