ALTER TABLE user_risk_settings 
ADD COLUMN IF NOT EXISTS auto_trade_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_trade_tiers text[] DEFAULT '{}';
