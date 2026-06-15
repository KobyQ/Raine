import LogoutButton from '@components/LogoutButton';
import Link from 'next/link';
import Logo from '@components/Logo';

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        color: '#e5e7eb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Background Gradients (Matches Landing Page) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.1) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(74, 222, 128, 0.05) 0%, transparent 40%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Floating Header */}
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: '100px',
          padding: '12px 32px', width: '100%', maxWidth: '1200px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Logo />
            </Link>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', color: '#9ca3af', fontSize: '14px', fontWeight: 500 }} className="md-flex hidden-mobile">
              <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Vault</Link>
              <Link href="/opportunities" style={{ color: 'inherit', textDecoration: 'none' }}>Signals</Link>
              <Link href="/trades" style={{ color: 'inherit', textDecoration: 'none' }}>Ledger</Link>
              <Link href="/docs" style={{ color: 'inherit', textDecoration: 'none' }}>API Docs</Link>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <LogoutButton />
          </div>
        </nav>
      </div>

      <main style={{ flex: 1, padding: '24px', zIndex: 10, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
