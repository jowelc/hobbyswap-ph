'use client';

import { useState } from 'react';
import { Location } from '@/types/item';

const LOCATIONS: Location[] = [
  'Pampanga', 'Manila', 'Bulacan', 'Cebu', 'Davao', 'Cavite', 'Laguna', 'Others',
];

interface Props {
  onConfirm: (location: Location) => void;
  onClose: () => void;
}

export default function LocationGate({ onConfirm, onClose }: Props) {
  const [location, setLocation] = useState<Location | ''>('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <h2 className="text-base font-bold text-white mb-1">Where are you located?</h2>
        <p className="text-xs text-slate-400 mb-5">Required so buyers know where to pick up or ship from.</p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className={`px-3 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                location === loc
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!location}
            onClick={() => location && onConfirm(location)}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
