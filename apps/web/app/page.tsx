import Link from 'next/link';
import Logo from '@components/Logo';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#050505',
      color: '#e5e7eb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Background Gradients */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.1) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(74, 222, 128, 0.05) 0%, transparent 40%)',
        zIndex: -1, pointerEvents: 'none'
      }} />

      {/* Floating Inset Navigation (Finorio Style) */}
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: '100px',
          padding: '12px 32px', width: '100%', maxWidth: '1200px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
            <Logo />
            <div style={{ display: 'none', gap: '24px', alignItems: 'center', color: '#9ca3af', fontSize: '14px', fontWeight: 500 }} className="md-flex">
              <span style={{ cursor: 'pointer', transition: 'color 0.2s', ':hover': { color: '#fff' } } as any}>Features</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s', ':hover': { color: '#fff' } } as any}>Pricing</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s', ':hover': { color: '#fff' } } as any}>API Docs</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Log in</Link>
            <Link href="/dashboard" style={{
              background: '#fff', color: '#000', padding: '10px 24px', borderRadius: '100px',
              textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'opacity 0.2s'
            }}>Get Started</Link>
          </div>
        </nav>
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>

        {/* Hero Section (Side-by-Side Finorio Style) */}
        <section style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '64px', marginBottom: '120px' }}>

          {/* Left Column: Copy & CTA */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8',
              padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, marginBottom: '24px',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              New | Live Execution Engine V2
            </div>
            <h1 style={{
              fontSize: 'clamp(48px, 6vw, 72px)', lineHeight: 1.05, fontWeight: 800, marginBottom: '24px',
              color: '#fff', letterSpacing: '-1.5px'
            }}>
              Market Intelligence. <br />
              <span style={{ color: '#9ca3af' }}>Now Accessible.</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#9ca3af', lineHeight: 1.6, marginBottom: '40px', maxWidth: '500px' }}>
              RaineBank processes market structure, eliminates emotional bias, and provides mathematically verified trade setups. Stop guessing. Start executing.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/dashboard" style={{
                background: '#fff', color: '#000', padding: '16px 32px', borderRadius: '100px',
                textDecoration: 'none', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                Enter the Vault
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/docs" style={{
                background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '16px 32px', borderRadius: '100px',
                textDecoration: 'none', fontSize: '16px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)'
              }}>
                View API Docs
              </Link>
            </div>
          </div>

          {/* Right Column: Dynamic Mockup */}
          <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'linear-gradient(145deg, rgba(30,30,30,0.8) 0%, rgba(15,15,15,0.8) 100%)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              width: '100%', maxWidth: '450px', transform: 'rotateX(5deg) rotateY(-10deg)', perspective: '1000px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 600 }}>LIVE SIGNAL</div>
                <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>ACTIVE</div>
              </div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-1px' }}>XAUUSD</div>
              <div style={{ fontSize: '24px', color: '#38bdf8', fontWeight: 600, marginBottom: '32px' }}>BUY LIMIT @ 2345.50</div>

              <div style={{ background: '#0a0a0a', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>INSTITUTIONAL RATIONALE</div>
                <p style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: 1.5, margin: 0 }}>
                  Price has swept the previous session liquidity pool. M30 structural alignment is bullish with price {'>'} EMA 50.
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Bento Box Feature Grid (Finorio Style) */}
        <section style={{ maxWidth: '1200px', width: '100%', marginBottom: '120px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-1px' }}>The Immutable Ledger</h2>
            <p style={{ color: '#9ca3af', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
              Retail bots sell promises; we sell transparency. Our execution loop is mathematically defined and entirely autonomous.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

            {/* Bento Box 1: Trade Lifecycle Pipeline */}
            <div style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px',
              gridColumn: '1 / -1'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>The Complete Institutional Lifecycle</h3>
              <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '40px', maxWidth: '800px' }}>
                We replaced black-box "trading bots" with a transparent, highly-disciplined Proprietary Trading Firm workflow. Track an idea from inception to realized profit.
              </p>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', background: '#000', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>1. INTELLIGENCE DESK</div>
                  <div style={{ fontSize: '15px', color: '#fff', lineHeight: 1.5 }}>Trigger the Alpha engine to run deterministic mathematical research on market conditions in real-time.</div>
                </div>
                <div style={{ flex: 1, minWidth: '200px', background: '#000', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>2. SIGNAL APPROVAL</div>
                  <div style={{ fontSize: '15px', color: '#fff', lineHeight: 1.5 }}>Review the AI Risk Officer's full institutional rationale and exact boundaries before authorizing exposure.</div>
                </div>
                <div style={{ flex: 1, minWidth: '200px', background: '#000', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>3. THE VAULT</div>
                  <div style={{ fontSize: '15px', color: '#fff', lineHeight: 1.5 }}>Monitor your live inventory and active capital exposure across all currently executing trades.</div>
                </div>
                <div style={{ flex: 1, minWidth: '200px', background: '#000', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>4. THE LEDGER</div>
                  <div style={{ fontSize: '15px', color: '#fff', lineHeight: 1.5 }}>The immutable accounting journal of closed positions, allowing you to audit the long-term effectiveness of the AI.</div>
                </div>
              </div>
            </div>

            {/* Bento Box 2: Deterministic Math & Kill Switch */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px' }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>The Mathematical Sandbox</h3>
              <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: 1.6 }}>
                LLMs are terrible at math. We don't let them do it. Our Layer A deterministic code strictly pre-calculates safe volatility boundaries. If a trade violates the hardcoded 1:2 R:R constraints, our Layer C Kill Switch ruthlessly rejects it.
              </p>
            </div>

            {/* Bento Box 3: Cognitive AI Risk Evaluation */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px' }}>
              <div style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Cognitive Risk Officer</h3>
              <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: 1.6 }}>
                Once inside the sandbox, our AI Risk Officer evaluates structural alignment, intermarket correlations, and if/then confluence scenarios, providing you with deep institutional logic before you pull the trigger.
              </p>
            </div>

          </div>
        </section>

        {/* Pricing Grid (Finorio Tabular Layout) */}
        <section style={{ maxWidth: '1000px', width: '100%', marginBottom: '120px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-1px' }}>Institutional Access</h2>
            <p style={{ color: '#9ca3af', fontSize: '18px' }}>Choose your tier. Powered by globally secure Paystack architecture.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>

            {/* Free Tier */}
            <div style={{
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Public Vault</div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-2px' }}>$0<span style={{ fontSize: '18px', color: '#9ca3af', fontWeight: 500, letterSpacing: '0' }}>/mo</span></div>
              <p style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '32px' }}>Perfect for monitoring system performance.</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px', color: '#e5e7eb', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Delayed Signals (4+ Hours)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Historical Ledger Access
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4b5563' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  Real-time Execution Data
                </li>
              </ul>

              <Link href="/login" style={{
                background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '16px', borderRadius: '100px',
                textDecoration: 'none', fontSize: '15px', fontWeight: 600, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)'
              }}>Get Started for Free</Link>
            </div>

            {/* Alpha Tier */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(37,99,235,0.1) 0%, rgba(10,10,10,1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '24px', padding: '40px',
              display: 'flex', flexDirection: 'column', position: 'relative',
              boxShadow: '0 24px 64px rgba(37, 99, 235, 0.15)'
            }}>
              <div style={{
                position: 'absolute', top: '-16px', right: '40px', background: '#38bdf8', color: '#000',
                padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 700
              }}>
                POPULAR
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8', marginBottom: '16px' }}>Alpha Intelligence</div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-2px' }}>$99<span style={{ fontSize: '18px', color: '#9ca3af', fontWeight: 500, letterSpacing: '0' }}>/mo</span></div>
              <p style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '32px' }}>Direct integration for professional execution.</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '16px', color: '#e5e7eb', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Real-time Live Signals
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Full Execution Parameters
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Institutional LLM Rationale
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  Direct API Access via Unkey
                </li>
              </ul>

              <Link href="/dashboard" style={{
                background: '#fff', color: '#000', padding: '16px', borderRadius: '100px',
                textDecoration: 'none', fontSize: '15px', fontWeight: 600, textAlign: 'center'
              }}>Upgrade to Alpha</Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: '24px', color: '#9ca3af', fontSize: '14px', fontWeight: 500 }}>
          <Link href="/docs" style={{ color: 'inherit', textDecoration: 'none' }}>API Documentation</Link>
          <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Client Login</Link>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <div style={{ color: '#4b5563', fontSize: '13px', marginTop: '24px' }}>
          © {new Date().getFullYear()} RaineBank Intelligence. Built on institutional math.
        </div>
      </footer>
    </div>
  );
}