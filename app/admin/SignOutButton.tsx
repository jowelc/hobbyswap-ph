'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-xs text-slate-500 hover:text-red-400 transition-colors font-medium px-2 py-1.5 rounded-lg hover:bg-slate-800"
    >
      Sign out
    </button>
  );
}
