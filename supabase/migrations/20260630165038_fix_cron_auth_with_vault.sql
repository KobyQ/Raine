DO $$
DECLARE
  service_key text;
  edge_url text;
BEGIN
  -- Evaluate these settings AT DEPLOY TIME
  service_key := current_setting('app.settings.service_role_key', true);
  edge_url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://ktezlusdkqlfdwqrldtn.supabase.co');

  -- 4H Research
  PERFORM cron.unschedule('4h_research');
  PERFORM cron.schedule(
    '4h_research',
    '0 0,4,8,12,16,20 * * *',
    format('select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''Authorization'', ''Bearer '' || %L));', edge_url || '/functions/v1/research-run?timeframe=4H', service_key)
  );

  -- Exness Monitor
  PERFORM cron.unschedule('exness_monitor');
  PERFORM cron.schedule(
    'exness_monitor',
    '0 * * * *',
    format('select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''Authorization'', ''Bearer '' || %L));', edge_url || '/functions/v1/exness-monitor', service_key)
  );

  -- Resolve Outcomes
  PERFORM cron.unschedule('resolve_outcomes');
  PERFORM cron.schedule(
    'resolve_outcomes',
    '2,32 * * * *',
    format('select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''Authorization'', ''Bearer '' || %L));', edge_url || '/functions/v1/resolve-outcomes', service_key)
  );

  -- Daily Research
  PERFORM cron.unschedule('daily_research');
  PERFORM cron.schedule(
    'daily_research',
    '30 21 * * 1-5',
    format('select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''Authorization'', ''Bearer '' || %L));', edge_url || '/functions/v1/research-run?timeframe=1D', service_key)
  );
END $$;
