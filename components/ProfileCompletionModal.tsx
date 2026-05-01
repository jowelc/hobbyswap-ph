'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

export interface PaymentMethod {
  name: string;
  type: string;
  number: string;
}

export interface ProfileFields {
  location: string;
  lookingFor: string;
  paymentDetails: string; // JSON string of PaymentMethod[]
}

interface FullProfile extends ProfileFields {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
}

interface Props {
  initial: ProfileFields;
  onClose: () => void;
  onSaved: (updated: ProfileFields) => void;
}

export const PAYMENT_TYPES = [
  'GCash', 'Maya', 'BDO', 'BPI', 'Metrobank', 'UnionBank',
  'Security Bank', 'PNB', 'Landbank', 'RCBC', 'EastWest Bank', 'Others',
];

const PH_LOCATIONS = [
  'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Manila',
  'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig',
  'Quezon City', 'San Juan', 'Taguig', 'Valenzuela',
  'Angeles City', 'Antipolo', 'Bacoor', 'Baguio', 'Batangas City',
  'Bulacan', 'Cabanatuan', 'Calamba', 'Cavite City', 'Dasmariñas',
  'General Trias', 'Imus', 'Lipa', 'Lucena', 'Malolos', 'Meycauayan',
  'Olongapo', 'Pampanga', 'San Fernando', 'San Jose del Monte',
  'Santa Rosa', 'Tarlac City', 'Tuguegarao', 'Zambales',
  'Bacolod', 'Cebu City', 'Dumaguete', 'Iloilo City', 'Lapu-Lapu',
  'Mandaue', 'Ormoc', 'Tacloban',
  'Butuan', 'Cagayan de Oro', 'Cotabato City', 'Davao City',
  'General Santos', 'Iligan', 'Pagadian', 'Zamboanga City',
].sort();

export function parsePaymentMethods(raw: string): PaymentMethod[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function isLocationEmpty(v: string)   { return !v || v === 'Philippines'; }
function isLookingForEmpty(v: string) { return !v || v === 'No preference'; }

const BLANK_PAYMENT: PaymentMethod = { name: '', type: 'GCash', number: '' };

export default function ProfileCompletionModal({ initial, onClose, onSaved }: Props) {
  const [fullProfile,     setFullProfile]     = useState<FullProfile | null>(null);
  const [location,        setLocation]        = useState(isLocationEmpty(initial.location) ? '' : initial.location);
  const [lookingFor,      setLookingFor]      = useState(isLookingForEmpty(initial.lookingFor) ? '' : initial.lookingFor);
  const [paymentMethods,  setPaymentMethods]  = useState<PaymentMethod[]>(parsePaymentMethods(initial.paymentDetails));
  const [addingPayment,   setAddingPayment]   = useState(false);
  const [draft,           setDraft]           = useState<PaymentMethod>(BLANK_PAYMENT);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.ok ? r.json() : null)
      .then((u) => {
        if (!u) return;
        setFullProfile({
          username:       u.username       || '',
          displayName:    u.displayName    || u.username || '',
          avatarUrl:      u.avatarUrl      || '',
          bio:            u.bio            || '',
          location:       u.location       || '',
          lookingFor:     u.lookingFor     || '',
          paymentDetails: u.paymentDetails || '',
        });
      })
      .catch(() => {});
  }, []);

  const locationMissing   = isLocationEmpty(initial.location);
  const lookingForMissing = isLookingForEmpty(initial.lookingFor);
  const paymentMissing    = parsePaymentMethods(initial.paymentDetails).length === 0;
  const missingCount      = [locationMissing, lookingForMissing, paymentMissing].filter(Boolean).length;
  const filledNow         = [
    !isLocationEmpty(location),
    !isLookingForEmpty(lookingFor),
    paymentMethods.length > 0,
  ].filter(Boolean).length;
  const completionPct = Math.round((filledNow / 3) * 100);

  function addPayment() {
    if (!draft.name.trim() || !draft.number.trim()) return;
    setPaymentMethods((p) => [...p, { ...draft }]);
    setDraft(BLANK_PAYMENT);
    setAddingPayment(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const updated: ProfileFields = {
      location,
      lookingFor,
      paymentDetails: JSON.stringify(paymentMethods),
    };
    try {
      const res = await fetch('/api/users/me', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      onSaved(updated);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputBase = 'w-full px-3 py-2.5 bg-slate-800 border text-white text-sm rounded-xl outline-none transition-all placeholder-slate-600';
  const inputNormal = `${inputBase} border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`;
  const inputAmber  = `${inputBase} border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20`;

  function Badge({ missing, filled }: { missing: boolean; filled: boolean }) {
    if (!missing) return <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Set</span>;
    if (filled)   return <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Added</span>;
    return <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Missing</span>;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 px-6 pt-6 pb-5 border-b border-slate-700/60">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 ring-2 ring-slate-700">
              {fullProfile?.avatarUrl ? (
                <Image src={fullProfile.avatarUrl} alt={fullProfile.displayName} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                  {(fullProfile?.displayName || '?')[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white truncate">{fullProfile?.displayName || '—'}</p>
              <p className="text-sm text-slate-400 truncate">@{fullProfile?.username || '…'}</p>
              {fullProfile?.bio && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{fullProfile.bio}</p>}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-slate-300">Profile completeness</p>
              <p className="text-xs font-bold text-white">{completionPct}%</p>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionPct === 100 ? 'bg-green-500' : completionPct >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              {missingCount === 0
                ? 'All set — other traders can reach you'
                : `${missingCount} field${missingCount !== 1 ? 's' : ''} missing — traders need this to trade with you`}
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSave} className="p-5 space-y-5">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Location */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">📍 Location</label>
              <Badge missing={locationMissing} filled={!isLocationEmpty(location)} />
            </div>
            {!locationMissing && initial.location && (
              <p className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5">
                Current: <span className="text-slate-300">{initial.location}</span>
              </p>
            )}
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={locationMissing && isLocationEmpty(location) ? `${inputAmber} appearance-none cursor-pointer text-slate-500` : `${inputNormal} appearance-none cursor-pointer`}
            >
              <option value="" disabled className="bg-slate-900 text-slate-500">Select your city…</option>
              {PH_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">{loc}</option>
              ))}
            </select>
          </div>

          {/* Looking For */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">🔍 Looking For</label>
              <Badge missing={lookingForMissing} filled={!isLookingForEmpty(lookingFor)} />
            </div>
            {!lookingForMissing && initial.lookingFor && (
              <p className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5">
                Current: <span className="text-slate-300">{initial.lookingFor}</span>
              </p>
            )}
            <input
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g. PSA 10 LeBron, Charizard VMAX, raw rookies"
              className={lookingForMissing && isLookingForEmpty(lookingFor) ? inputAmber : inputNormal}
            />
          </div>

          {/* Payment Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">💳 Payment Details</label>
              <Badge missing={paymentMissing} filled={paymentMethods.length > 0} />
            </div>

            {/* Existing entries */}
            {paymentMethods.length > 0 && (
              <div className="space-y-2">
                {paymentMethods.map((pm, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{pm.name}</p>
                      <p className="text-[11px] text-slate-400">{pm.type} · {pm.number}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentMethods((p) => p.filter((_, idx) => idx !== i))}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10 flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            {addingPayment ? (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Account name (e.g. Juan Dela Cruz)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-sm rounded-lg outline-none placeholder-slate-600"
                />
                <select
                  value={draft.type}
                  onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-sm rounded-lg outline-none appearance-none cursor-pointer"
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-slate-900">{t}</option>
                  ))}
                </select>
                <input
                  value={draft.number}
                  onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))}
                  placeholder="Number (e.g. 09XX XXX XXXX or account no.)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-sm rounded-lg outline-none placeholder-slate-600"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addPayment}
                    disabled={!draft.name.trim() || !draft.number.trim()}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingPayment(false); setDraft(BLANK_PAYMENT); }}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingPayment(true)}
                className={`w-full py-2.5 border border-dashed text-xs font-semibold rounded-xl transition-colors ${
                  paymentMissing && paymentMethods.length === 0
                    ? 'border-amber-500/50 text-amber-400 hover:bg-amber-500/5'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                + Add payment method
              </button>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-sm"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
