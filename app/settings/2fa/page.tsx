'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TwoFactorSetupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'idle' | 'scan' | 'done'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/2fa/setup');
    const data = await res.json();
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setStep('scan');
    setLoading(false);
  };

  const verifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/2fa/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Invalid code');
      setLoading(false);
      return;
    }

    await update({ twoFactorEnabled: true });
    setStep('done');
    setLoading(false);
  };

  const disable2FA = async () => {
    setLoading(true);
    await fetch('/api/2fa/setup', { method: 'DELETE' });
    await update({ twoFactorEnabled: false });
    setLoading(false);
    router.refresh();
  };

  const is2FAEnabled = session?.user?.twoFactorEnabled;

  return (
    <div className="min-h-screen bg-background-primary">
      <header className="border-b border-border-default bg-background-secondary">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {step === 'done' ? (
          <div className="text-center space-y-4">
            <div className="text-green-500 text-5xl">✓</div>
            <p className="text-lg font-medium">2FA enabled successfully</p>
            <p className="text-text-secondary text-sm">
              Your account is now protected with two-factor authentication.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-accent-primary hover:bg-accent-primaryHover rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : is2FAEnabled ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
              <p className="text-green-500 font-medium">2FA is currently enabled</p>
              <p className="text-sm text-text-secondary mt-1">
                Your account is protected with an authenticator app.
              </p>
            </div>
            <button
              onClick={disable2FA}
              disabled={loading}
              className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : step === 'idle' ? (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.
            </p>
            <button
              onClick={startSetup}
              disabled={loading}
              className="w-full py-2 px-4 bg-accent-primary hover:bg-accent-primaryHover disabled:opacity-50 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Set up 2FA'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="font-medium mb-2">1. Scan this QR code with your authenticator app</p>
              {qrDataUrl && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
              <p className="text-xs text-text-secondary mt-2 text-center">
                Or enter manually: <span className="font-mono">{secret}</span>
              </p>
            </div>

            <form onSubmit={verifyAndEnable} className="space-y-4">
              <div>
                <p className="font-medium mb-2">2. Enter the 6-digit code to confirm</p>
                {error && (
                  <p className="text-red-500 text-sm mb-2">{error}</p>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2 px-4 bg-accent-primary hover:bg-accent-primaryHover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {loading ? 'Verifying...' : 'Enable 2FA'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
