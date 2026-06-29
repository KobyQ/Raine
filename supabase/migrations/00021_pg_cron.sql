-- 0002_pg_cron.sql
-- Schedule pg_cron jobs for market hours expressed in GMT (UTC)

-- Ensure pg_cron extension is available
create extension if not exists pg_cron;

-- Run daily research roughly 60 minutes before the U.S. market opens
select cron.schedule(
  'daily_research',
  '30 13 * * 1-5',
  $$ select net.http_post(url := 'http://kong:8000/functions/v1/research-run?timeframe=1D', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);

-- Optional: run hourly research at the top of each hour
select cron.schedule(
  'hourly_research',
  '0 * * * *',
  $$ select net.http_post(url := 'http://kong:8000/functions/v1/research-run?timeframe=1H', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);

-- Trailing stop check on Exness via MetaApi every hour
select cron.schedule(
  'exness_monitor',
  '0 * * * *',
  $$ select net.http_post(url := 'http://kong:8000/functions/v1/exness-monitor', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);

-- Outcome Resolution Loop (Self-Learning) at 2 and 32 minutes past the hour
select cron.schedule(
  'resolve_outcomes',
  '2,32 * * * *',
  $$ select net.http_post(url := 'http://kong:8000/functions/v1/resolve-outcomes', headers := '{"Content-Type": "application/json"}'::jsonb); $$
);

-- Monitor open trades during the regular session (14:30-21:00 GMT)
-- 14:30-14:59 every minute
select cron.schedule(
  'monitor_trades_open',
  '30-59 14 * * 1-5',
  $$ select rpc_monitor_open_trades(); $$
);
-- 15:00-20:59 every minute
select cron.schedule(
  'monitor_trades_session',
  '0-59 15-20 * * 1-5',
  $$ select rpc_monitor_open_trades(); $$
);
-- Run once at the close 21:00
select cron.schedule(
  'monitor_trades_close',
  '0 21 * * 1-5',
  $$ select rpc_monitor_open_trades(); $$
);
