-- Update the daily research cron schedule to 21:30 UTC

SELECT cron.unschedule('daily_research');
SELECT cron.schedule(
  'daily_research',
  '30 21 * * 1-5',
  $$ select net.http_post(
      url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://ktezlusdkqlfdwqrldtn.supabase.co') || '/functions/v1/research-run?timeframe=1D',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )
  ); $$
);
