'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@components/ThemeProvider';
import { Moon, Sun, ShieldAlert, KeyRound, Save, Activity } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [settings, setSettings] = useState({
    portfolio_capital: 10000,
    risk_per_trade_pct: 0.01,
    max_portfolio_heat_pct: 0.10,
    max_spread_points: 50,
    active_broker: 'ALPACA',
    meta_api_token: '',
    meta_api_account_id: '',
    alpaca_key: '',
    alpaca_secret: '',
    is_live_execution_enabled: false
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings({
            portfolio_capital: data.settings.portfolio_capital || 10000,
            risk_per_trade_pct: data.settings.risk_per_trade_pct || 0.01,
            max_portfolio_heat_pct: data.settings.max_portfolio_heat_pct || 0.10,
            max_spread_points: data.settings.max_spread_points || 50,
            active_broker: data.settings.active_broker || 'ALPACA',
            meta_api_token: data.settings.meta_api_token || '',
            meta_api_account_id: data.settings.meta_api_account_id || '',
            alpaca_key: data.settings.alpaca_key || '',
            alpaca_secret: data.settings.alpaca_secret || '',
            is_live_execution_enabled: data.settings.is_live_execution_enabled || false
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setMessage('An error occurred while saving.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading settings...</div>;
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', background: 'linear-gradient(to right, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vault Settings</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>Configure your personalized risk appetite and execution preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent)', color: '#fff', border: 'none', 
            padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, transition: 'all 0.2s', opacity: saving ? 0.7 : 1
          }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div style={{ padding: '16px', background: message.includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('success') ? '#10b981' : '#ef4444', borderRadius: '8px', marginBottom: '24px', border: `1px solid ${message.includes('success') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Risk Panel */}
        <div style={{ background: 'var(--input-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: '0 0 24px 0' }}>
            <ShieldAlert size={20} color="var(--accent)" />
            Risk Profiling
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Portfolio Capital (USD)</label>
              <input type="number" name="portfolio_capital" value={settings.portfolio_capital} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Risk Per Trade (%) - {Number(settings.risk_per_trade_pct) * 100}%</label>
              <input type="number" step="0.001" name="risk_per_trade_pct" value={settings.risk_per_trade_pct} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Global Portfolio Heat Cap (%) - {Number(settings.max_portfolio_heat_pct) * 100}%</label>
              <input type="number" step="0.01" name="max_portfolio_heat_pct" value={settings.max_portfolio_heat_pct} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Max Spread Tolerance (Points)</label>
              <input type="number" step="1" name="max_spread_points" value={settings.max_spread_points} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>

        {/* Execution & UI Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ background: 'var(--input-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: '0 0 24px 0' }}>
              <KeyRound size={20} color="var(--accent)" />
              Broker Connection
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Broker</label>
                <select name="active_broker" value={settings.active_broker} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="ALPACA" style={{ color: '#000' }}>Alpaca (Equities / Crypto)</option>
                  <option value="METAAPI" style={{ color: '#000' }}>MetaAPI (MT4 / MT5 / Forex)</option>
                </select>
              </div>

              {settings.active_broker === 'METAAPI' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>MetaApi Token</label>
                    <input type="password" name="meta_api_token" value={settings.meta_api_token} onChange={handleChange} placeholder="Enter your secret token" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Account ID</label>
                    <input type="text" name="meta_api_account_id" value={settings.meta_api_account_id} onChange={handleChange} placeholder="MT4/MT5 Account ID from MetaApi" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                </>
              )}

              {settings.active_broker === 'ALPACA' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Alpaca Key</label>
                    <input type="text" name="alpaca_key" value={settings.alpaca_key} onChange={handleChange} placeholder="APCA-API-KEY-ID" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Alpaca Secret</label>
                    <input type="password" name="alpaca_secret" value={settings.alpaca_secret} onChange={handleChange} placeholder="APCA-API-SECRET-KEY" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                </>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Activity size={24} color={settings.is_live_execution_enabled ? '#10b981' : 'var(--text-secondary)'} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px' }}>Live Execution</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Allow AI to place real trades.</p>
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                  <input type="checkbox" name="is_live_execution_enabled" checked={settings.is_live_execution_enabled} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.is_live_execution_enabled ? '#10b981' : '#4b5563', transition: '.4s', borderRadius: '24px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: settings.is_live_execution_enabled ? 'translateX(24px)' : 'translateX(0)' }}></span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div style={{ background: 'var(--input-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 24px 0' }}>UI Preferences</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>Theme Mode</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Toggle between Light and Dark interface.</p>
              </div>
              <button 
                onClick={toggleTheme}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'transparent', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}