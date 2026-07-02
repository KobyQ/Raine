CREATE OR REPLACE FUNCTION rpc_expire_stale_opportunities()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. For PENDING_APPROVAL signals: If older than their timeframe, mark them as REJECTED
    UPDATE trade_opportunities
    SET status = 'REJECTED',
        ai_risks = 'Expired: Not approved within the ' || timeframe || ' timeframe window',
        updated_at = now()
    WHERE status = 'PENDING_APPROVAL'
      AND (
        (timeframe = '1H' AND created_at < now() - interval '1 hour') OR
        (timeframe = '4H' AND created_at < now() - interval '4 hours') OR
        (timeframe = '1D' AND created_at < now() - interval '1 day')
      );

    -- 2. For REJECTED signals (including C-Tier warnings): Auto-archive them to clear the UI
    UPDATE trade_opportunities
    SET is_archived = true,
        updated_at = now()
    WHERE status = 'REJECTED' AND is_archived = false
      AND (
        (timeframe = '1H' AND created_at < now() - interval '1 hour') OR
        (timeframe = '4H' AND created_at < now() - interval '4 hours') OR
        (timeframe = '1D' AND created_at < now() - interval '1 day')
      );
END;
$$;

-- Run the expiration sweep every 15 minutes
select cron.schedule(
  'auto_expire_signals',
  '*/15 * * * *',
  $$ select rpc_expire_stale_opportunities(); $$
);
