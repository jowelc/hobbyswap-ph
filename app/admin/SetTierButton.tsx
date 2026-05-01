'use client';

import { useActionState } from 'react';
import { setUserTier } from './actions';

interface Props {
  userId: string;
  currentTier: string;
}

export default function SetTierButton({ userId, currentTier }: Props) {
  const nextTier = currentTier === 'premium' ? 'verified' : 'premium';

  const [, action, pending] = useActionState(setUserTier, {});

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="tier" value={nextTier} />
      <button
        type="submit"
        disabled={pending}
        className={
          currentTier === 'premium'
            ? 'text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
            : 'text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 border-slate-600 text-slate-400 hover:text-white hover:border-amber-500/40 hover:bg-amber-500/10'
        }
      >
        {currentTier === 'premium' ? '★ Premium' : 'Make Premium'}
      </button>
    </form>
  );
}
