'use client';

import { useActionState } from 'react';
import { addEmailToWhitelist } from './actions';

type State = { error?: string; success?: boolean };

const initialState: State = {};

export default function AddToWhitelistForm() {
  const [state, action, pending] = useActionState<State, FormData>(addEmailToWhitelist, initialState);

  return (
    <form action={action} className="flex flex-col sm:flex-row gap-2.5 mt-5 relative">
      <input
        name="email"
        type="email"
        required
        placeholder="Enter email address to whitelist..."
        className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-white text-sm rounded-xl outline-none transition-all placeholder-slate-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap flex-shrink-0"
      >
        {pending ? 'Adding…' : '+ Add to Whitelist'}
      </button>

      {state?.error && (
        <p className="sm:absolute sm:left-0 sm:-bottom-5 text-xs text-red-400 mt-1 sm:mt-0">{state.error}</p>
      )}
      {state?.success && (
        <p className="sm:absolute sm:left-0 sm:-bottom-5 text-xs text-green-400 mt-1 sm:mt-0">Email added to whitelist.</p>
      )}
    </form>
  );
}
