-- 0008_exness_executor_webhook.sql

create or replace function public.trigger_exness_executor()
returns trigger as $$
declare
  webhook_url text;
  payload jsonb;
  request_id bigint;
begin
  webhook_url := current_setting('app.settings.edge_functions_base_url', true);
  
  if webhook_url is null then
    webhook_url := 'http://kong:8000/functions/v1';
  end if;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', null
  );

  -- Execute asynchronous HTTP POST via pg_net to the execution API
  select net.http_post(
    url := webhook_url || '/exness-executor',
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) into request_id;

  return NEW;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_signal_execute on public.trade_opportunities;

-- Create trigger
create trigger on_signal_execute
  after insert on public.trade_opportunities
  for each row
  execute function public.trigger_exness_executor();
