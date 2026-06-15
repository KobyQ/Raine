-- 0002_outcome_tracking.sql
-- Add outcome tracking columns to trade_opportunities

-- Drop the existing constraint
ALTER TABLE trade_opportunities DROP CONSTRAINT IF EXISTS trade_opportunities_status_check;

-- Add the new status check that includes WON and LOST
ALTER TABLE trade_opportunities ADD CONSTRAINT trade_opportunities_status_check CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED','EXPIRED','WON','LOST'));

-- Add performance tracking columns
ALTER TABLE trade_opportunities ADD COLUMN IF NOT EXISTS r_multiple numeric;
ALTER TABLE trade_opportunities ADD COLUMN IF NOT EXISTS closed_at timestamptz;
