import LogoutButton from '@components/LogoutButton';

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-container">
      <header className="app-header">
        <a href="/" className="brand">
          <div className="brand-icon">
            {/* Abstract geometric logo */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>RaineBank</h1>
        </a>
        <nav className="nav-links">
          <a href="/dashboard">Vault</a>
          <a href="/opportunities">Signals</a>
          <a href="/trades">Ledger</a>
          <a href="/approval">Compliance</a>
          <a href="/audit-log">Audit Trail</a>
          <a href="/settings">System</a>
          <div style={{ marginLeft: '12px' }}>
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
