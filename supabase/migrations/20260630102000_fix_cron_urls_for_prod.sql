-- Fix the cron URLs so they fallback to the production Edge Function URL instead of local kong

SELECT cron.unschedule('4h_research');
SELECT cron.schedule(
  '4h_research',
  '0 0,4,8,12,16,20 * * *',
  $$ select net.http_post(url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://ktezlusdkqlfdwqrldtn.supabase.co') || '/functions/v1/research-run?timeframe=4H', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);

SELECT cron.unschedule('exness_monitor');
SELECT cron.schedule(
  'exness_monitor',
  '0 * * * *',
  $$ select net.http_post(url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://ktezlusdkqlfdwqrldtn.supabase.co') || '/functions/v1/exness-monitor', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);

SELECT cron.unschedule('resolve_outcomes');
SELECT cron.schedule(
  'resolve_outcomes',
  '2,32 * * * *',
  $$ select net.http_post(url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://ktezlusdkqlfdwqrldtn.supabase.co') || '/functions/v1/resolve-outcomes', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);

SELECT cron.unschedule('daily_research');
SELECT cron.schedule(
  'daily_research',
  '30 13 * * 1-5',
  $$ select net.http_post(url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://ktezlusdkqlfdwqrldtn.supabase.co') || '/functions/v1/research-run?timeframe=1D', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);
