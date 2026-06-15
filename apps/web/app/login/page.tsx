'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@lib/supabase';
import { Terminal, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/dashboard');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Optional: if you have a custom email template or redirect URL, configure it in Supabase dashboard
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (signUpError) throw signUpError;
        // Supabase might require email confirmation, but for now we'll assume they can login or check email
        setError('Check your email to confirm your account (if email confirmation is required), or login directly.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ededed',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Gradients (Glassmorphic vibe) */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '10%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Main Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          backgroundColor: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <Terminal size={32} color="#10b981" />
          </div>
        </div>

        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em',
          }}
        >
          {isLogin ? 'Access the Vault' : 'Initialize Account'}
        </h2>
        <p
          style={{
            color: '#a1a1aa',
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '0.95rem',
          }}
        >
          {isLogin
            ? 'Authenticate to view the immutable ledger.'
            : 'Join RaineBank for real-time alpha signals.'}
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderLeft: '4px solid #ef4444',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#d4d4d8',
              }}
            >
              Institutional Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@fund.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#10b981')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#d4d4d8',
              }}
            >
              Passphrase
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#10b981')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.875rem',
              backgroundColor: '#10b981',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#0ea5e9'; // A nice transition color
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isLogin ? (
              <>
                Unlock Ledger <ArrowRight size={18} />
              </>
            ) : (
              <>
                Initialize Profile <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          >
            {isLogin
              ? "Don't have an account? Create one."
              : 'Already an operator? Authenticate here.'}
          </button>
        </div>
      </div>
    </div>
  );
}
