ALTER TABLE user_risk_settings 
ADD COLUMN IF NOT EXISTS active_broker text DEFAULT 'ALPACA',
ADD COLUMN IF NOT EXISTS alpaca_key text,
ADD COLUMN IF NOT EXISTS alpaca_secret text;
