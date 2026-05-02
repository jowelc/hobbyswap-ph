'use client';

import { useState, useRef } from 'react';
import { InventoryItem } from '@/types/inventoryItem';
import { Category, Condition, TradePreference, Location } from '@/types/item';
import { convertIfHeic } from '@/lib/heic';
import { parsePrice } from '@/lib/utils';

const CATEGORIES: Category[] = [
  'Basketball Cards', 'Pokemon Cards', 'One Piece Cards', 'Football Cards',
  'Baseball Cards', 'MMA Cards', 'WWE Cards', 'Others',
];
const CONDITIONS: Condition[] = ['Raw', 'PSA Graded', 'BGS Graded', 'Other Grading'];
const TRADE_PREFS: TradePreference[] = [
  'Trade Only', 'Cash Only', 'Trade + Cash', 'Open to any offers',
];
const LOCATIONS: Location[] = [
  'Pampanga', 'Manila', 'Bulacan', 'Cebu', 'Davao', 'Cavite', 'Laguna', 'Others',
];

interface Props {
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  existing?: InventoryItem;
}

const PLACEHOLDER_FRONT = '/card-placeholder-front.svg';

export default function AddItemModal({ onClose, onSave, existing }: Props) {
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    category: existing?.category ?? '' as Category | '',
    playerName: existing?.playerName ?? '',
    team: existing?.team ?? '',
    brand: existing?.brand ?? '',
    year: existing?.year?.toString() ?? '',
    condition: existing?.condition ?? '' as Condition | '',
    estimatedValue: existing?.estimatedValue?.toString() ?? '',
    location: existing?.location ?? '' as Location | '',
    tradePreference: existing?.tradePreference ?? '' as TradePreference | '',
    description: existing?.description ?? '',
    lookingFor: existing?.lookingFor ?? '',
    cashDifferenceAccepted: existing?.cashDifferenceAccepted ?? false,
    frontImageUrl: existing?.frontImageUrl ?? '',
    backImageUrl: existing?.backImageUrl ?? '',
    isForTrade: existing?.isForTrade ?? true,
    tags: existing?.tags?.join(', ') ?? '',
  });
  const [error, setError] = useState('');

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category || !form.condition || !form.estimatedValue || !form.location || !form.tradePreference) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');

    const item: InventoryItem = {
      id: existing?.id ?? `inv-${Date.now()}`,
      name: form.name.trim(),
      category: form.category as Category,
      playerName: form.playerName.trim() || undefined,
      team: form.team.trim() || undefined,
      brand: form.brand.trim() || undefined,
      year: form.year ? parseInt(form.year) : undefined,
      condition: form.condition as Condition,
      estimatedValue: parsePrice(form.estimatedValue),
      location: form.location as Location,
      tradePreference: form.tradePreference as TradePreference,
      description: form.description.trim(),
      lookingFor: form.lookingFor.trim(),
      notes: existing?.notes ?? '',
      cashDifferenceAccepted: form.cashDifferenceAccepted,
      frontImageUrl: form.frontImageUrl.trim() || PLACEHOLDER_FRONT,
      backImageUrl: form.backImageUrl.trim() || '',
      isForTrade: form.isForTrade,
      addedAt: existing?.addedAt ?? new Date().toISOString(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    onSave(item);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white">
            {existing ? 'Edit Item' : 'Add Item to Inventory'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* For trade toggle — prominent at top */}
          <div
            className="flex items-center justify-between bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 cursor-pointer select-none"
            onClick={() => set('isForTrade', !form.isForTrade)}
          >
            <div>
              <p className="text-sm font-semibold text-white">Available for Trade</p>
              <p className="text-xs text-slate-400">Toggle off to mark as not currently available</p>
            </div>
            <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 ${form.isForTrade ? 'bg-green-500' : 'bg-slate-600'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.isForTrade ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Two-column grid for compact fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Item Name *">
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. PSA 10 Charizard VMAX" className={inputCls} />
            </Field>

            <Field label="Category *">
              <select required value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Condition *">
              <select required value={form.condition} onChange={(e) => set('condition', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Estimated Value (₱) *">
              <input required type="number" min={0} value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value)} placeholder="e.g. 5000" className={inputCls} />
            </Field>

            <Field label="Location *">
              <select required value={form.location} onChange={(e) => set('location', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>

            <Field label="Trade Preference *">
              <select required value={form.tradePreference} onChange={(e) => set('tradePreference', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                {TRADE_PREFS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Player / Character">
              <input value={form.playerName} onChange={(e) => set('playerName', e.target.value)} placeholder="e.g. LeBron James" className={inputCls} />
            </Field>

            <Field label="Team">
              <input value={form.team} onChange={(e) => set('team', e.target.value)} placeholder="e.g. LA Lakers" className={inputCls} />
            </Field>

            <Field label="Brand">
              <input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Panini Prizm" className={inputCls} />
            </Field>

            <Field label="Year">
              <input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="e.g. 2023" className={inputCls} />
            </Field>
          </div>

          <Field label="Description *">
            <textarea required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the item, its condition, any notable details..." className={`${inputCls} resize-none`} />
          </Field>

          <Field label="Looking For">
            <textarea rows={2} value={form.lookingFor} onChange={(e) => set('lookingFor', e.target.value)} placeholder="What would you like in return?" className={`${inputCls} resize-none`} />
          </Field>

          {/* Image upload */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Card Photos</p>
            <div className="flex gap-4">
              <ImageUpload label="Front" value={form.frontImageUrl} onChange={(url) => set('frontImageUrl', url)} />
              <ImageUpload label="Back" value={form.backImageUrl} onChange={(url) => set('backImageUrl', url)} />
            </div>
          </div>

          <Field label="Tags (comma-separated)">
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="e.g. PSA 10, Rookie, Prizm" className={inputCls} />
          </Field>

          {/* Cash difference accepted */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.cashDifferenceAccepted}
              onChange={(e) => set('cashDifferenceAccepted', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-sm text-slate-300">Cash difference accepted</span>
          </label>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors border border-slate-700">
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {existing ? 'Save Changes' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const converted = await convertIfHeic(file);
    onChange(URL.createObjectURL(converted));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-28 rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-800 transition-colors"
        style={{ aspectRatio: '5/7' }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Change</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-[10px] text-center px-2 leading-tight">Click to upload</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-white text-sm rounded-xl outline-none transition-all placeholder-slate-500';
