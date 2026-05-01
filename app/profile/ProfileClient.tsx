'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Logo from '@/components/Logo';
import { parsePaymentMethods, PAYMENT_TYPES, type PaymentMethod } from '@/components/ProfileCompletionModal';
import { InventoryItem } from '@/types/inventoryItem';
import { Location } from '@/types/item';
import AddItemModal from '@/components/AddItemModal';
import PostItemModal from '@/components/PostItemModal';
import LocationGate from '@/components/LocationGate';
import { formatCurrency, getConditionColor, getTradePrefColor } from '@/lib/utils';
import FlipCardImage from '@/components/FlipCardImage';
import TierBadge from '@/components/TierBadge';
import AppImage from '@/components/AppImage';

interface Props {
  email: string;
  name: string;
  image: string | null;
  username: string;
  displayName: string;
  tier: 'verified' | 'premium';
}

interface WatchlistEntry {
  itemId: string;
  name: string;
  category: string;
  condition: string;
  estimatedValue: number;
  frontImageUrl: string;
  isForTrade: boolean;
  location: string;
  ownerUsername: string;
  addedAt: string;
}

interface ProfileMeta {
  bio: string;
  location: string;
  lookingFor: string;
  paymentDetails: string;
}

const EMPTY_META: ProfileMeta = { bio: '', location: '', lookingFor: '', paymentDetails: '' };

export default function ProfileClient({ email, name, image, username, displayName, tier }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [meta, setMeta] = useState<ProfileMeta>(EMPTY_META);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState<ProfileMeta>(EMPTY_META);
  const [paymentDraftMethods, setPaymentDraftMethods] = useState<PaymentMethod[]>([]);
  const [addingPayment, setAddingPayment] = useState(false);
  const [draftPayment, setDraftPayment] = useState<PaymentMethod>({ name: '', type: 'GCash', number: '' });
  const [locationGateOpen, setLocationGateOpen] = useState(false);
  const [postLocation, setPostLocation] = useState<Location | null>(null);

  // Load items from API
  useEffect(() => {
    fetch('/api/items/mine')
      .then((r) => r.json())
      .then((data: InventoryItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  // Load watchlist
  useEffect(() => {
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((data: WatchlistEntry[]) => setWatchlist(Array.isArray(data) ? data : []))
      .catch(() => setWatchlist([]));
  }, []);

  // Load profile meta from DB
  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((u: Record<string, unknown>) => {
        const loaded: ProfileMeta = {
          bio:            (u.bio as string)            || '',
          location:       (u.location as string)       || '',
          lookingFor:     (u.lookingFor as string)     || '',
          paymentDetails: (u.paymentDetails as string) || '',
        };
        setMeta(loaded);
        setMetaDraft(loaded);
        setPaymentDraftMethods(parsePaymentMethods(loaded.paymentDetails));
      })
      .catch(() => {});
  }, []);

  async function saveItem(item: InventoryItem) {
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const updated = await res.json() as InventoryItem;
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      }
    } catch {}
    setEditingItem(null);
  }

  function toggleForTrade(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const toggled = { ...item, isForTrade: !item.isForTrade };
    setItems((prev) => prev.map((i) => (i.id === id ? toggled : i)));
    fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isForTrade: toggled.isForTrade }),
    }).catch(() => setItems((prev) => prev.map((i) => (i.id === id ? item : i))));
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    fetch(`/api/items/${id}`, { method: 'DELETE' }).catch(() => {
      fetch('/api/items/mine').then((r) => r.json()).then(setItems).catch(() => {});
    });
  }

  function saveMeta() {
    const toSave = { ...metaDraft, paymentDetails: JSON.stringify(paymentDraftMethods) };
    setMeta(toSave);
    setEditingMeta(false);
    setAddingPayment(false);
    setDraftPayment({ name: '', type: 'GCash', number: '' });
    fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave),
    }).catch(() => {});
  }

  function addPaymentMethod() {
    if (!draftPayment.name.trim() || !draftPayment.number.trim()) return;
    setPaymentDraftMethods((p) => [...p, { ...draftPayment }]);
    setDraftPayment({ name: '', type: 'GCash', number: '' });
    setAddingPayment(false);
  }

  function handleAddItemClick() {
    if (meta.location) {
      setPostLocation(meta.location as Location);
    } else {
      setLocationGateOpen(true);
    }
  }

  function handleLocationConfirm(loc: Location) {
    setPostLocation(loc);
    setLocationGateOpen(false);
  }

  function handlePostItemSave(item: InventoryItem) {
    setItems((prev) => [item, ...prev]);
    setPostLocation(null);
  }

  function removeFromWatchlist(itemId: string) {
    setWatchlist((prev) => prev.filter((w) => w.itemId !== itemId));
    fetch(`/api/watchlist/${itemId}`, { method: 'DELETE' }).catch(() => {});
  }

  const forTradeCount = items.filter((i) => i.isForTrade).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo />

          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
              Marketplace
            </Link>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700">
              {image ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-700">
                  <AppImage src={image} alt={name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-300 font-medium hidden sm:block">{name.split(' ')[0]}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors font-medium px-2 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* Profile header card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {image ? (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-blue-500/30 bg-slate-700">
                  <AppImage src={image} alt={name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl">
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <div
                className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-bold ${
                  tier === 'premium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                title={tier === 'premium' ? 'Premium Trader' : 'Verified Trader'}
              >
                {tier === 'premium' ? '★' : '✓'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-white">{name || displayName}</h1>
                <TierBadge tier={tier} />
              </div>
              <p className="text-sm text-slate-400">@{username} · {email}</p>

              {!editingMeta ? (
                <div className="space-y-1.5">
                  <p className="text-sm text-slate-300">
                    {meta.location ? `📍 ${meta.location}` : <span className="text-slate-600 italic">No location set</span>}
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1 text-xs text-blue-300 font-medium">
                    <span>🔍</span>
                    Looking for: <span className="text-white">{meta.lookingFor || 'No preference'}</span>
                  </div>
                  <div className="space-y-1">
                    {parsePaymentMethods(meta.paymentDetails).length > 0
                      ? parsePaymentMethods(meta.paymentDetails).map((pm, i) => (
                          <p key={i} className="text-sm text-slate-300">
                            💳 <span className="font-medium">{pm.name}</span> · {pm.type} · {pm.number}
                          </p>
                        ))
                      : <span className="text-sm text-slate-600 italic">No payment details set</span>}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {meta.bio || <span className="text-slate-600 italic">No bio yet — click Edit to add one</span>}
                  </p>
                  <button
                    onClick={() => { setMetaDraft(meta); setPaymentDraftMethods(parsePaymentMethods(meta.paymentDetails)); setEditingMeta(true); }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium mt-1"
                  >
                    ✏️ Edit profile
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <input
                    value={metaDraft.location}
                    onChange={(e) => setMetaDraft((m) => ({ ...m, location: e.target.value }))}
                    placeholder="Your location (e.g. Pampanga)"
                    className="w-full sm:w-64 px-3 py-2 bg-slate-700 border border-slate-600 focus:border-blue-500 text-white text-sm rounded-lg outline-none"
                  />
                  <input
                    value={metaDraft.lookingFor}
                    onChange={(e) => setMetaDraft((m) => ({ ...m, lookingFor: e.target.value }))}
                    placeholder="What are you looking for? (e.g. PSA 10 LeBron, Charizard)"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 focus:border-blue-500 text-white text-sm rounded-lg outline-none"
                  />
                  {/* Payment methods editor */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">💳 Payment details</p>
                    {paymentDraftMethods.map((pm, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{pm.name}</p>
                          <p className="text-[11px] text-slate-400">{pm.type} · {pm.number}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentDraftMethods((p) => p.filter((_, idx) => idx !== i))}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {addingPayment ? (
                      <div className="bg-slate-700/40 border border-slate-600 rounded-lg p-2.5 space-y-2">
                        <input
                          value={draftPayment.name}
                          onChange={(e) => setDraftPayment((d) => ({ ...d, name: e.target.value }))}
                          placeholder="Account name"
                          className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 focus:border-blue-500 text-white text-xs rounded-lg outline-none placeholder-slate-500"
                        />
                        <select
                          value={draftPayment.type}
                          onChange={(e) => setDraftPayment((d) => ({ ...d, type: e.target.value }))}
                          className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 focus:border-blue-500 text-white text-xs rounded-lg outline-none appearance-none cursor-pointer"
                        >
                          {PAYMENT_TYPES.map((t) => (
                            <option key={t} value={t} className="bg-slate-800">{t}</option>
                          ))}
                        </select>
                        <input
                          value={draftPayment.number}
                          onChange={(e) => setDraftPayment((d) => ({ ...d, number: e.target.value }))}
                          placeholder="Number / account no."
                          className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 focus:border-blue-500 text-white text-xs rounded-lg outline-none placeholder-slate-500"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={addPaymentMethod} disabled={!draftPayment.name.trim() || !draftPayment.number.trim()} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors">Add</button>
                          <button type="button" onClick={() => { setAddingPayment(false); setDraftPayment({ name: '', type: 'GCash', number: '' }); }} className="flex-1 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-300 text-xs font-semibold rounded-lg transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingPayment(true)}
                        className="w-full py-2 border border-dashed border-slate-600 hover:border-slate-500 text-xs text-slate-400 hover:text-slate-300 font-semibold rounded-lg transition-colors"
                      >
                        + Add payment method
                      </button>
                    )}
                  </div>
                  <textarea
                    value={metaDraft.bio}
                    onChange={(e) => setMetaDraft((m) => ({ ...m, bio: e.target.value }))}
                    placeholder="Tell traders about yourself..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 focus:border-blue-500 text-white text-sm rounded-lg outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveMeta} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">Save</button>
                    <button onClick={() => setEditingMeta(false)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg font-semibold transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-4 sm:gap-2 text-right flex-shrink-0">
              <div>
                <p className="text-2xl font-black text-white">{items.length}</p>
                <p className="text-xs text-slate-500">Total items</p>
              </div>
              <div>
                <p className="text-2xl font-black text-green-400">{forTradeCount}</p>
                <p className="text-xs text-slate-500">For trade</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">My Trade Inventory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {items.length === 0
                  ? 'No items yet'
                  : `${forTradeCount} of ${items.length} marked for trade`}
              </p>
            </div>
            <button
              onClick={handleAddItemClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              <div className="text-5xl mb-4 opacity-30">📦</div>
              <h3 className="text-lg font-bold text-white mb-1">No items yet</h3>
              <p className="text-slate-400 text-sm max-w-xs mb-5">
                Add cards or collectibles to your inventory to start trading with others.
              </p>
              <button
                onClick={handleAddItemClick}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                + Add your first item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  onToggle={() => toggleForTrade(item.id)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>
        {/* Watchlist section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">My Watchlist</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {watchlist.length === 0 ? 'No items saved' : `${watchlist.length} item${watchlist.length !== 1 ? 's' : ''} saved`}
              </p>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              <div className="text-4xl mb-3 opacity-30">🔖</div>
              <p className="text-slate-400 text-sm">No items in your watchlist yet</p>
              <p className="text-slate-600 text-xs mt-1">Bookmark items on the marketplace to track them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map((w) => (
                <div key={w.itemId} className={`relative bg-slate-800/60 border rounded-2xl overflow-hidden flex flex-col transition-all ${w.isForTrade ? 'border-slate-700/50' : 'border-red-500/30 opacity-70'}`}>
                  <a href={`/users/${w.ownerUsername}?item=${w.itemId}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-800">
                    <AppImage src={w.frontImageUrl || '/card-placeholder-front.svg'} alt={w.name} fill className="object-contain" unoptimized fallbackSrc="/card-placeholder-front.svg" />
                    {!w.isForTrade && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-2 py-1 rounded-lg">Not Available</span>
                      </div>
                    )}
                  </a>
                  <div className="p-2.5 flex flex-col gap-1 flex-1">
                    <p className="text-xs font-bold text-white leading-tight line-clamp-2">{w.name}</p>
                    <p className="text-xs font-bold text-blue-400">{formatCurrency(w.estimatedValue)}</p>
                    <p className="text-[10px] text-slate-500">@{w.ownerUsername}</p>
                  </div>
                  <div className="px-2.5 pb-2.5">
                    <button
                      onClick={() => removeFromWatchlist(w.itemId)}
                      className="w-full text-[10px] font-semibold text-slate-400 hover:text-red-400 bg-slate-700/40 hover:bg-red-500/10 rounded-lg py-1.5 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add item — LocationGate → PostItemModal flow */}
      {locationGateOpen && (
        <LocationGate
          onClose={() => setLocationGateOpen(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
      {postLocation && (
        <PostItemModal
          location={postLocation}
          onClose={() => setPostLocation(null)}
          onSave={handlePostItemSave}
          onChangeLocation={() => { setPostLocation(null); setLocationGateOpen(true); }}
        />
      )}

      {/* Edit item — full form */}
      {editingItem && (
        <AddItemModal
          onClose={() => setEditingItem(null)}
          onSave={(item) => { saveItem(item); setEditingItem(null); }}
          existing={editingItem}
        />
      )}
    </div>
  );
}

// ── Inventory card ────────────────────────────────────────────────────────────

function InventoryCard({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`bg-slate-800/60 border rounded-2xl overflow-hidden flex flex-col transition-all ${item.isForTrade ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'}`}>
      {/* Image */}
      <div className="p-2.5 pb-0">
        <FlipCardImage
          frontUrl={item.frontImageUrl}
          backUrl={item.backImageUrl}
          alt={item.name}
        />
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-bold text-white leading-tight line-clamp-2">{item.name}</p>
        <p className="text-xs font-bold text-blue-400">{formatCurrency(item.estimatedValue)}</p>
        <div className="flex flex-wrap gap-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getConditionColor(item.condition)}`}>
            {item.condition}
          </span>
        </div>
      </div>

      {/* For trade toggle */}
      <div className="px-2.5 pb-2.5 space-y-2">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            item.isForTrade
              ? 'bg-green-500/15 text-green-300 border-green-500/30 hover:bg-green-500/25'
              : 'bg-slate-700/40 text-slate-400 border-slate-600/30 hover:bg-slate-700/60'
          }`}
        >
          <span>{item.isForTrade ? '✓ For Trade' : '✗ Not Available'}</span>
          <div className={`w-7 h-3.5 rounded-full relative transition-colors ${item.isForTrade ? 'bg-green-500' : 'bg-slate-600'}`}>
            <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform ${item.isForTrade ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
          </div>
        </button>

        <div className="flex gap-1.5">
          <button
            onClick={onEdit}
            className="flex-1 text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-700/40 hover:bg-slate-700 rounded-lg py-1.5 transition-colors"
          >
            Edit
          </button>
          {confirmDelete ? (
            <>
              <button onClick={onDelete} className="flex-1 text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg py-1.5 transition-colors">
                Confirm
              </button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-700/40 hover:bg-slate-700 rounded-lg py-1.5 transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 text-[10px] font-semibold text-slate-400 hover:text-red-400 bg-slate-700/40 hover:bg-red-500/10 rounded-lg py-1.5 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

