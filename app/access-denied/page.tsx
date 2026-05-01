'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-16">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-red-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <Logo size={42} />
        </div>

        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl">
            🚫
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-white">Access Restricted</h1>
          <p className="text-slate-400 leading-relaxed">
            This platform is invite-only. Your account is not on the access list.
          </p>

          {email && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm">
              <p className="text-slate-500 text-xs mb-1">You tried to sign in with</p>
              <p className="text-slate-200 font-mono font-medium break-all">{email}</p>
            </div>
          )}

          <p className="text-slate-400 text-sm leading-relaxed">
            To get access, please ask the platform admin to whitelist your email address.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 text-left space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">How to get access</p>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold flex-shrink-0">1.</span>
              Contact the HobbySwap PH admin and provide your Google email address.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold flex-shrink-0">2.</span>
              Once whitelisted, return here and sign in again.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold flex-shrink-0">3.</span>
              You&apos;ll be able to list your items and start trading!
            </li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try a different account
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors border border-slate-700"
          >
            Browse marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense>
      <AccessDeniedContent />
    </Suspense>
  );
}
