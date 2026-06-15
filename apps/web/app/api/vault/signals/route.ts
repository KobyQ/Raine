import { NextResponse } from 'next/server';
import { supabaseServer } from '@lib/supabase-server';

export async function GET(request: Request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch subscription tier
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('plan_tier, status')
    .eq('user_id', user.id)
    .single();

  const is_pro = sub?.plan_tier === 'alpha' && sub?.status === 'active';

  if (is_pro) {
    // PRO USER: Unrestricted access to real-time opportunities
    const { data, count, error } = await supabase
      .from('trade_opportunities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      signals: data, 
      is_pro: true,
      pagination: { total: count || 0, page, limit }
    });
  } else {
    // FREE USER: 4-hour delay and masked metadata
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data, count, error } = await supabase
      .from('trade_opportunities')
      // Note: intentionally excluding stop_plan_json, take_profit_json, entry_plan_json, and ai_summary
      .select('id, symbol, side, timeframe, status, created_at', { count: 'exact' })
      .lt('created_at', fourHoursAgo)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // We add explicit nulls so the frontend can type-check consistently
    const maskedData = data.map((signal: any) => ({
      ...signal,
      entry_plan_json: null,
      stop_plan_json: null,
      take_profit_json: null,
      ai_summary: null
    }));
    
    return NextResponse.json({ 
      signals: maskedData, 
      is_pro: false,
      pagination: { total: count || 0, page, limit }
    });
  }
}
