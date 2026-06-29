CREATE TABLE IF NOT EXISTS public.user_risk_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    portfolio_capital numeric NOT NULL DEFAULT 10000,
    risk_per_trade_pct numeric NOT NULL DEFAULT 0.01,
    max_portfolio_heat_pct numeric NOT NULL DEFAULT 0.10,
    meta_api_token text,
    meta_api_account_id text,
    is_live_execution_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_trades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id uuid NOT NULL REFERENCES public.trade_opportunities(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    side text NOT NULL,
    volume numeric NOT NULL,
    risk_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'PENDING',
    meta_api_order_id text,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS for user_risk_settings
ALTER TABLE public.user_risk_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own risk settings" 
    ON public.user_risk_settings FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- RLS for user_trades
ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own trades" 
    ON public.user_trades FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);


