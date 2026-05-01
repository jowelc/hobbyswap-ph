'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null);

  async function handleLogin(provider: 'google' | 'facebook') {
    setLoading(provider);
    await signIn(provider, { callbackUrl: '/auth/redirect' });
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="px-6 py-4">
        <Logo size={38} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-purple-600/10 blur-2xl" />
          </div>

          <div className="relative bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-7 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white mb-1.5">Welcome to HobbySwap PH</h1>
              <p className="text-sm text-slate-400">Sign in to start trading cards and collectibles</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleLogin('google')}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 text-slate-800 font-semibold text-sm px-4 py-3.5 rounded-xl transition-colors border border-gray-200"
              >
                {loading === 'google' ? <Spinner className="text-slate-600" /> : <GoogleIcon />}
                Continue with Google
              </button>

              <button
                onClick={() => handleLogin('facebook')}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-semibold text-sm px-4 py-3.5 rounded-xl transition-colors"
              >
                {loading === 'facebook' ? <Spinner className="text-white" /> : <FacebookIcon />}
                Continue with Facebook
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                HobbySwap PH is invite-only. Only verified collectors can access the platform.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-5">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            Your data is safe with HobbySwap PH 🔒
          </p>
        </div>
      </div>
    </div>
  );
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
