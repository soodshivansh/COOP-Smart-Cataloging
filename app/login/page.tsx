'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        totpCode: step === 'totp' ? totpCode : '',
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin' && step === 'credentials') {
          // Could be pending 2FA — try fetching session to check
          const res = await fetch('/api/auth/session');
          const session = await res.json();
          if (session?.user?.pendingTwoFactor) {
            setStep('totp');
            setLoading(false);
            return;
          }
        }
        setError(step === 'totp' ? 'Invalid 2FA code' : 'Invalid email or password');
      } else {
        // Check if 2FA pending
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (session?.user?.pendingTwoFactor) {
          setStep('totp');
          setLoading(false);
          return;
        }
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Smart AI Cataloging</h1>
          <p className="mt-2 text-text-secondary">
            {step === 'totp' ? 'Enter your 2FA code' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="totp" className="block text-sm font-medium mb-2">
                Authenticator Code
              </label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <p className="mt-2 text-sm text-text-secondary text-center">
                Open your authenticator app and enter the 6-digit code
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-accent-primary hover:bg-accent-primaryHover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? 'Please wait...' : step === 'totp' ? 'Verify' : 'Sign in'}
          </button>

          {step === 'totp' && (
            <button
              type="button"
              onClick={() => { setStep('credentials'); setTotpCode(''); setError(''); }}
              className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to login
            </button>
          )}
        </form>

        {step === 'credentials' && (
          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-accent-primary hover:underline">
              Register
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
