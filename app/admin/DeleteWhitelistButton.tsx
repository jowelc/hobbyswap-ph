'use client';

import { useActionState, useState } from 'react';
import { removeFromWhitelist } from './actions';

const INIT: { error?: string; success?: boolean } = {};

export default function DeleteWhitelistButton({ email }: { email: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(removeFromWhitelist, INIT);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-[11px] font-semibold text-slate-500 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 px-2.5 py-1 rounded-lg transition-colors"
      >
        Remove
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-slate-400">Sure?</span>
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={pending}
          className="text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
        >
          {pending ? '…' : 'Yes, remove'}
        </button>
      </form>
      <button
        onClick={() => setConfirming(false)}
        className="text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
      >
        Cancel
      </button>
      {state?.error && <span className="text-[11px] text-red-400">{state.error}</span>}
    </div>
  );
}
