import React from 'react';
import Logo from '@components/Logo';
import Link from 'next/link';

export const metadata = {
  title: 'API Documentation | RaineBank',
  description: 'Integration guide for the RaineBank Institutional Alpha feed.',
};

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-black text-gray-200 py-20 px-6 sm:px-12 font-sans selection:bg-green-500/30">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Navigation */}
        <nav className="flex justify-between items-center pb-8 border-b border-gray-800">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
            Back to Vault
          </Link>
        </nav>

        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Institutional API
          </h1>
          <p className="text-lg text-gray-400">
            Programmatic access to the RaineBank Alpha Engine. Consume mathematically verified, AI-evaluated trade setups in real-time.
          </p>
        </header>

        {/* Authentication Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white border-b border-gray-800 pb-2">Authentication</h2>
          <p className="text-gray-400">
            All requests to the RaineBank API must be authenticated via a Bearer token in the <code className="bg-gray-900 text-green-400 px-1.5 py-0.5 rounded">Authorization</code> header. Keys are provisioned securely via our Unkey edge network.
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-gray-300 shadow-xl">
            GET /api/v1/signals HTTP/1.1<br/>
            Host: rainebank.com<br/>
            Authorization: Bearer rb_live_xxxxxxxxxxxxxxxxx
          </div>
        </section>

        {/* Endpoint: Get Signals */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white border-b border-gray-800 pb-2">Retrieve Signals</h2>
          <div className="flex items-center space-x-3">
            <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider">GET</span>
            <code className="text-gray-300 font-mono">/api/v1/signals</code>
          </div>
          <p className="text-gray-400">Fetches the latest evaluated trade opportunities. The feed is ordered chronologically by execution timestamp.</p>
          
          <h3 className="text-lg font-medium text-white pt-4">Query Parameters</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <code className="text-blue-400 w-24 flex-shrink-0">symbol</code>
              <span className="text-gray-400 text-sm"><span className="text-gray-500 italic">(Optional)</span> Filter by specific asset. Valid values: <code className="text-gray-300">XAUUSD</code>, <code className="text-gray-300">BTCUSD</code>.</span>
            </li>
            <li className="flex items-start">
              <code className="text-blue-400 w-24 flex-shrink-0">limit</code>
              <span className="text-gray-400 text-sm"><span className="text-gray-500 italic">(Optional)</span> Number of records to return. Default is 50. Maximum is 100.</span>
            </li>
          </ul>

          <h3 className="text-lg font-medium text-white pt-4">Response Payload</h3>
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto text-green-400 shadow-xl">
            <pre>
{`{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "symbol": "XAUUSD",
      "bias": "bullish",
      "entry_price": 2342.50,
      "stop_loss": 2338.00,
      "take_profit": 2351.50,
      "status": "active",
      "r_multiple": null,
      "institutional_rationale": "Price has swept the previous session liquidity pool. M30 structural alignment is bullish with price > EMA 50 > EMA 200. RSI indicates momentum buildup without overextension. 1:2 RR mandated.",
      "logic_context": {
        "ema_50": 2335.10,
        "ema_200": 2310.45,
        "rsi_14": 58.4
      },
      "created_at": "2026-06-15T14:30:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "timestamp": "2026-06-15T14:31:12Z"
  }
}`}
            </pre>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white border-b border-gray-800 pb-2">Rate Limits & Edge Security</h2>
          <p className="text-gray-400">
            API endpoints are protected by global edge rate-limiting to ensure feed stability. 
            The standard tier allows for <strong className="text-white">60 requests per minute</strong> per API key. Exceeding this limit will result in a <code className="bg-gray-900 text-red-400 px-1.5 py-0.5 rounded">429 Too Many Requests</code> response.
          </p>
        </section>

      </div>
    </div>
  );
}
