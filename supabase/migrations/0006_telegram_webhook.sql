-- 0006_telegram_webhook.sql
-- Automates pushing new signals to the Telegram Edge Function

create or replace function public.trigger_telegram_broadcast()
returns trigger as $$
declare
  webhook_url text;
  payload jsonb;
  request_id bigint;
begin
  -- Retrieve the base URL from postgres settings, fallback to local kong gateway
  webhook_url := current_setting('app.settings.edge_functions_base_url', true);
  
  if webhook_url is null then
    webhook_url := 'http://kong:8000/functions/v1';
  end if;

  -- Construct standard Supabase Webhook payload
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', null
  );

  -- Execute asynchronous HTTP POST via pg_net
  select net.http_post(
    url := webhook_url || '/telegram-broadcast',
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) into request_id;

  return NEW;
end;
$$ language plpgsql security definer;

-- Ensure no duplicate triggers exist
drop trigger if exists on_signal_generated on public.trade_opportunities;

-- Attach trigger to trade_opportunities
create trigger on_signal_generated
  after insert on public.trade_opportunities
  for each row
  execute function public.trigger_telegram_broadcast();
