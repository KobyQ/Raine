"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <>
      <div className="bg-mesh"></div>

      {/* Corporate Navigation */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img src="/logo_text_white.png" alt="RaineSoft Solutions" style={{ height: '32px', width: 'auto' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            <Link href="#solutions" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Solutions</Link>
            <Link href="#products" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Products</Link>
            <Link href="#contact" className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>Partner with us</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="container" style={{ paddingTop: '120px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="fade-in-up" style={{ 
            display: 'inline-block', 
            background: 'rgba(14, 165, 233, 0.1)', 
            color: 'var(--accent-primary)', 
            padding: '8px 16px', 
            borderRadius: '100px', 
            fontSize: '13px', 
            fontWeight: 700, 
            marginBottom: '32px',
            border: '1px solid rgba(14, 165, 233, 0.2)'
          }}>
            ENTERPRISE FINANCIAL INFRASTRUCTURE
          </div>
          
          <h1 className="fade-in-up delay-1" style={{ 
            fontSize: 'clamp(48px, 8vw, 80px)', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            letterSpacing: '-2px', 
            marginBottom: '32px',
            maxWidth: '900px'
          }}>
            Engineering the <br/>
            <span className="text-gradient">Future of Finance.</span>
          </h1>
          
          <p className="fade-in-up delay-2" style={{ 
            fontSize: '20px', 
            color: 'var(--text-secondary)', 
            maxWidth: '650px', 
            marginBottom: '48px',
            lineHeight: 1.6 
          }}>
            RaineSoft Solutions specializes in building secure, low-latency fintech ecosystems for microfinances, rural banks, and commercial institutions.
          </p>
          
          <div className="fade-in-up delay-3" style={{ display: 'flex', gap: '16px' }}>
            <Link href="#contact" className="btn-primary">Explore Enterprise Solutions</Link>
            <Link href="https://rainebank.com" className="btn-secondary">View Flagship Product</Link>
          </div>
        </section>

        {/* Target Markets Section */}
        <section id="solutions" className="container" style={{ paddingBottom: '120px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>Institutional Grade Systems</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              We design modular financial technology stacks that scale securely with your institution&apos;s growth.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Box 1 */}
            <div className="glass-panel" style={{ padding: '40px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Commercial Banks</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                High-frequency trading ledgers, automated risk management overlays, and proprietary execution algorithms designed for vast liquidity pools.
              </p>
            </div>

            {/* Box 2 */}
            <div className="glass-panel" style={{ padding: '40px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-secondary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Microfinances</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                Lightweight, highly-available core banking architectures. Streamlined ledger management ensuring zero reconciliation errors.
              </p>
            </div>

            {/* Box 3 */}
            <div className="glass-panel" style={{ padding: '40px' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a855f7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Rural Banks</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                Offline-first infrastructure modules with aggressive latency compensation, allowing continuous operation in low-bandwidth environments.
              </p>
            </div>
          </div>
        </section>

        {/* Flagship Product Showcase */}
        <section id="products" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container" style={{ padding: '120px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '64px' }}>
            
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '16px', letterSpacing: '1px' }}>FLAGSHIP PLATFORM</div>
              <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px' }}>RaineBank Intelligence</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '32px', lineHeight: 1.6 }}>
                Our proprietary B2C platform, RaineBank, demonstrates our technological capabilities. It is an autonomous, AI-driven market intelligence engine that strips emotional bias from trading and strictly enforces a mathematically sound 1:2 Risk/Reward protocol.
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e5e7eb', fontWeight: 500 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Deterministic execution guardrails
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e5e7eb', fontWeight: 500 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Cognitive AI risk evaluations
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e5e7eb', fontWeight: 500 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Immutable tracking ledger
                </li>
              </ul>

              <a href="https://rainebank.com" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', gap: '8px' }}>
                Visit RaineBank.com
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>

            <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center' }}>
              {/* Abstract RaineBank Mockup */}
              <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '450px', transform: 'rotateY(-5deg) rotateX(5deg)', perspective: '1000px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>The Vault</div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '6px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>ALPHA UNLOCKED</div>
                </div>
                <div style={{ background: '#111', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800 }}>XAUUSD</div>
                    <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: 800 }}>LONG</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>ENTRY</div>
                      <div style={{ fontWeight: 700 }}>2345.50</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>STOP LOSS</div>
                      <div style={{ fontWeight: 700, color: '#f87171' }}>2330.00</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>TAKE PROFIT</div>
                      <div style={{ fontWeight: 700, color: '#4ade80' }}>2376.50</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Corporate Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '64px 24px', background: 'var(--bg-primary)' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo_text_white.png" alt="RaineSoft Solutions" style={{ height: '28px', width: 'auto', opacity: 0.9 }} />
          </div>
          
          <div style={{ display: 'flex', gap: '32px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
            <a href="#" style={{ transition: 'color 0.2s' }}>Privacy Policy</a>
            <a href="#" style={{ transition: 'color 0.2s' }}>Terms of Service</a>
            <a href="#" style={{ transition: 'color 0.2s' }}>Enterprise Contact</a>
          </div>
          
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
            © {new Date().getFullYear()} RaineSoft Solutions. All rights reserved. <br/>
            Providing technical infrastructure for the modern financial institution.
          </div>
        </div>
      </footer>
    </>
  );
}
