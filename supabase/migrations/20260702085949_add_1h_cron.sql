DO $$
DECLARE
  edge_url text;
BEGIN
  -- Evaluate edge URL at deploy time
  edge_url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://ktezlusdkqlfdwqrldtn.supabase.co');

  -- 1H Research
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = '1h_research';
  PERFORM cron.schedule(
    '1h_research',
    '0 * * * *',
    format('select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''x-cron-secret'', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''cron_webhook_secret'' LIMIT 1)), timeout_milliseconds := 300000);', edge_url || '/functions/v1/research-run?timeframe=1H')
  );
END $$;
