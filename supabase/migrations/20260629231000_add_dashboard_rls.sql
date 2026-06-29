-- Enable authenticated operators to read and update trade opportunities
CREATE POLICY "Allow authenticated to read trade opportunities" 
ON public.trade_opportunities 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to update trade opportunities" 
ON public.trade_opportunities 
FOR UPDATE 
TO authenticated 
USING (true);

-- Enable authenticated operators to read trades
CREATE POLICY "Allow authenticated to read trades" 
ON public.trades 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to update trades" 
ON public.trades 
FOR UPDATE 
TO authenticated 
USING (true);
