'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      router.push('/login?registered=1');
    } catch { setError('An error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600')" }}
      />
      <div className="absolute inset-0 bg-slate-950/70" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-400 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <rect x="4" y="4" width="14" height="14" rx="3" fill="#0f172a"/>
              <rect x="22" y="4" width="14" height="14" rx="3" fill="#0f172a"/>
              <rect x="4" y="22" width="14" height="14" rx="3" fill="#0f172a"/>
              <circle cx="29" cy="29" r="7" fill="#0f172a"/>
              <circle cx="29" cy="29" r="3.5" fill="#22d3ee"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-xl tracking-wide leading-none">Smart</p>
            <p className="text-cyan-400 font-black text-xl tracking-wide leading-none">Cataloging</p>
          </div>
        </div>
        <p className="text-white/60 text-sm tracking-widest uppercase">AI-Powered Inventory</p>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-cyan-400 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-slate-900 text-center uppercase leading-tight mb-6">
          Create Your Account
        </h1>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 rounded text-red-700 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-800 text-sm font-medium mb-1">Email Address :</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-slate-800 text-sm font-medium mb-1">Password :</label>
            <input
              type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-slate-800 text-sm font-medium mb-1">Confirm Password :</label>
            <input
              type="password" required value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-slate-800 text-xs">
              Already have an account?{' '}
              <Link href="/login" className="font-bold hover:underline">Sign in</Link>
            </div>
            <button
              type="submit" disabled={loading}
              className="px-6 py-2.5 bg-white text-slate-900 font-black text-sm rounded-full hover:bg-slate-100 disabled:opacity-50 transition-colors uppercase tracking-wide"
            >
              {loading ? '...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
