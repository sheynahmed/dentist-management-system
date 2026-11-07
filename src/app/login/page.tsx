'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    const session = localStorage.getItem('dentist_session');
    if (session) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('dentist_session', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password'); // mock password
    // Automatically trigger login on state change
    setTimeout(() => {
      const btn = document.getElementById('login-submit-btn');
      if (btn) btn.click();
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-700/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-800/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-2">
            <Stethoscope className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">DentoCare Portal</h2>
          <p className="text-sm text-slate-400">Clinic Management & Billing Console</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@dentocare.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-emerald-500 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-emerald-500 rounded-xl text-white placeholder-slate-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Quick Logins Widget */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Quick Login</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => triggerQuickLogin('dr.reehana@dentocare.com')}
                className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-emerald-950/20 border border-slate-850 hover:border-emerald-500/30 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Dr. Reehana Mundodan</p>
                    <p className="text-[10px] text-slate-400">Dentist (Doctor)</p>
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => triggerQuickLogin('shaheen@dentocare.com')}
                className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-emerald-950/20 border border-slate-850 hover:border-emerald-500/30 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Shaheen Admin</p>
                    <p className="text-[10px] text-slate-400">Tech Support (Admin)</p>
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => triggerQuickLogin('dr.rivera@dentocare.com')}
                className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-emerald-950/20 border border-slate-850 hover:border-emerald-500/30 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Dr. Alex Rivera</p>
                    <p className="text-[10px] text-slate-400">Dentist (Doctor)</p>
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
