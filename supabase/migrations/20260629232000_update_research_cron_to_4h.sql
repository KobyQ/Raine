-- Unschedule the previous hourly research job
SELECT cron.unschedule('hourly_research');

-- Schedule the new 4-Hour research job using the optimal algorithmic swing trading timeframe
SELECT cron.schedule(
  '4h_research',
  '0 0,4,8,12,16,20 * * *',
  $$ select net.http_post(url := coalesce(current_setting('app.settings.edge_function_url', true), 'http://kong:8000') || '/functions/v1/research-run?timeframe=4H', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);
