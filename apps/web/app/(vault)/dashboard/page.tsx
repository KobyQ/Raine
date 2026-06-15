'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@lib/supabase';
import dynamic from 'next/dynamic';

const CheckoutButton = dynamic(() => import('@components/CheckoutButton'), {
  ssr: false,
});

type VaultSignal = {
  id: string;
  symbol: string;
  side: string;
  timeframe: string;
  status: string;
  created_at: string;
  // Proprietary Fields (nullable for FREE users)
  entry_plan_json?: { price: number } | null;
  stop_plan_json?: { stop: number } | null;
  take_profit_json?: { tp: number } | null;
  ai_summary?: string | null;
};

export default function VaultDashboard() {
  const [signals, setSignals] = useState<VaultSignal[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    const loadVaultData = async () => {
      try {
        const [res, metricsRes, { data: authData }] = await Promise.all([
          fetch('/api/vault/signals'),
          fetch('/api/vault/metrics'),
          supabase.auth.getUser()
        ]);

        const data = await res.json();
        const metricsData = await metricsRes.json();

        if (res.ok) {
          setSignals(data.signals || []);
          setIsPro(data.is_pro || false);
        }
        if (authData.user) {
          setUser({ id: authData.user.id, email: authData.user.email || '' });
        }

        if (metricsRes.ok && !metricsData.error) {
          setMetrics(metricsData);
        }
      } catch (err) {
        console.error('Failed to load vault data', err);
      } finally {
        setLoading(false);
      }
    };

    loadVaultData();
  }, []);

  if (loading) return <div>Decrypting Vault...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>The Vault</h2>
        {!isPro && (
          <span style={{
            background: 'linear-gradient(90deg, #ca8a04, #eab308)',
            padding: '4px 12px',
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#000'
          }}>
            TIER 1 (DELAYED)
          </span>
        )}
        {isPro && (
          <span style={{
            background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
            padding: '4px 12px',
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff'
          }}>
            ALPHA UNLOCKED
          </span>
        )}
      </div>

      {metrics && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 'bold' }}>WIN RATE</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: metrics.winRate > 50 ? '#4ade80' : '#f87171' }}>
                {metrics.winRate}%
              </div>
            </div>
            <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 'bold' }}>NET R-MULTIPLE</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: metrics.netR > 0 ? '#4ade80' : '#f87171' }}>
                {metrics.netR > 0 ? '+' : ''}{metrics.netR}R
              </div>
            </div>
            <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 'bold' }}>SYSTEM EXPECTANCY</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: metrics.expectancy > 0 ? '#4ade80' : '#f87171' }}>
                {metrics.expectancy > 0 ? '+' : ''}{metrics.expectancy}R
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', padding: 20, borderRadius: 12, height: 300 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 'bold' }}>CUMULATIVE EQUITY CURVE (R)</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.equityCurve} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                  itemStyle={{ color: '#4ade80', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="cumulative_r" stroke="#4ade80" strokeWidth={2} fillOpacity={1} fill="url(#colorR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!isPro && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          color: '#fef08a',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <strong>Public Access Mode:</strong> Signals are delayed by 4+ hours and proprietary execution logic is hidden.
            Upgrade to <strong>RaineBank Alpha</strong> for real-time market intelligence.
          </div>
          {user && (
            <div style={{ maxWidth: 250 }}>
              <CheckoutButton
                email={user.email}
                userId={user.id}
                planCode="PLN_test_alphaplan" // Replace with actual plan code
                amount={9900} // e.g. $99.00 -> 9900 cents/kobo
              />
            </div>
          )}
        </div>
      )}

      {signals.length === 0 && <p>No signals found in the vault.</p>}

      <div style={{ display: 'grid', gap: 16 }}>
        {signals.map((signal) => (
          <div key={signal.id} style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <strong style={{ fontSize: 18 }}>{signal.symbol}</strong>
                <span style={{
                  color: signal.side === 'LONG' ? '#4ade80' : '#f87171',
                  fontWeight: 'bold'
                }}>
                  {signal.side}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{signal.timeframe}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                {new Date(signal.created_at).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>ENTRY</div>
                {signal.entry_plan_json ? (
                  <strong>{signal.entry_plan_json.price}</strong>
                ) : (
                  <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>0.0000</span>
                )}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>STOP LOSS</div>
                {signal.stop_plan_json ? (
                  <strong>{signal.stop_plan_json.stop}</strong>
                ) : (
                  <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>0.0000</span>
                )}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>TAKE PROFIT</div>
                {signal.take_profit_json ? (
                  <strong>{signal.take_profit_json.tp}</strong>
                ) : (
                  <span style={{ filter: 'blur(4px)', userSelect: 'none' }}>0.0000</span>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>LLM RATIONALE</div>
              {signal.ai_summary ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{signal.ai_summary}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Institutional thesis hidden. Upgrade to Alpha to view LLM Rationale.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}