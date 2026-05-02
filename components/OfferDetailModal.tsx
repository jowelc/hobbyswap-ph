'use client';

import { useState, useEffect } from 'react';
import AppImage from './AppImage';
import { formatCurrency } from '@/lib/utils';

export interface OfferItem {
  id: string;
  name: string;
  frontImageUrl: string;
  estimatedValue: number;
  condition: string;
}

interface OfferDetail {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
  toUserId: string;
  toUsername: string;
  toDisplayName: string;
  toAvatar: string;
  offeredItems: OfferItem[];
  requestedItems: OfferItem[];
  cashDiff: number;
  message: string;
  status: string;
  createdAt: string;
}

interface Props {
  offerId: string;
  isSent?: boolean;
  onClose: () => void;
  onAction: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
  onCounter: (offerId: string, userId: string, username: string, cashDiff: number, theirItems: OfferItem[], myItems: OfferItem[]) => void;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'accepted') {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Accepted</span>;
  }
  if (status === 'declined') {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700 text-slate-400 border border-slate-600">Declined</span>;
  }
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending</span>;
}

function ItemsPanel({ title, items, total }: { title: string; items: OfferItem[]; total: number }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-600 italic">None specified</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative w-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700"
              style={{ aspectRatio: '3/4' }}
              title={item.name}
            >
              {item.frontImageUrl ? (
                <AppImage src={item.frontImageUrl} alt={item.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">📦</div>
              )}
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <p className="text-xs font-bold text-blue-400">{formatCurrency(total)}</p>
      )}
    </div>
  );
}

export default function OfferDetailModal({ offerId, isSent = false, onClose, onAction, onDelete, onCounter }: Props) {
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/offers/${offerId}`)
      .then((r) => r.json())
      .then((d: OfferDetail) => { setOffer(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [offerId]);

  async function handleStatus(status: 'accepted' | 'declined') {
    if (!offer || acting) return;
    setActing(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { onAction(offerId, status); onClose(); }
    } finally { setActing(false); }
  }

  async function handleDelete() {
    if (acting) return;
    setActing(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, { method: 'DELETE' });
      if (res.ok) { onDelete(offerId); onClose(); }
    } finally {
      setActing(false);
      setConfirmDelete(false);
    }
  }

  function handleCounter() {
    if (!offer) return;
    onCounter(offer.id, offer.fromUserId, offer.fromUsername, offer.cashDiff, offer.offeredItems, offer.requestedItems);
    onClose();
  }

  const offeredTotal   = offer?.offeredItems.reduce((s, i)   => s + i.estimatedValue, 0) ?? 0;
  const requestedTotal = offer?.requestedItems.reduce((s, i) => s + i.estimatedValue, 0) ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white">Trade Offer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-12 bg-slate-800 animate-pulse rounded-xl" />
              <div className="h-36 bg-slate-800 animate-pulse rounded-xl" />
              <div className="h-24 bg-slate-800 animate-pulse rounded-xl" />
            </div>
          ) : !offer ? (
            <p className="text-sm text-slate-400 text-center py-8">Offer not found.</p>
          ) : (
            <>
              {/* Other party + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const avatar   = isSent ? offer.toAvatar   : offer.fromAvatar;
                    const dispName = isSent ? offer.toDisplayName : offer.fromDisplayName;
                    const uname    = isSent ? offer.toUsername  : offer.fromUsername;
                    return (
                      <>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                          {avatar ? (
                            <AppImage src={avatar} alt={dispName} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                              {(dispName || uname)[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">{isSent ? 'To' : 'From'}</p>
                          <p className="text-sm font-semibold text-white">@{uname}</p>
                          <p className="text-xs text-slate-500">{timeAgo(offer.createdAt)}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <StatusBadge status={offer.status} />
              </div>

              {/* Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ItemsPanel title={isSent ? 'You offered' : 'They offer'} items={offer.offeredItems} total={offeredTotal} />
                <ItemsPanel title={isSent ? 'You requested' : 'They want'} items={offer.requestedItems} total={requestedTotal} />
              </div>

              {/* Cash add-on */}
              {offer.cashDiff !== 0 && (
                offer.cashDiff > 0 ? (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                    <span className="text-green-400 font-semibold text-sm">+ ₱{offer.cashDiff.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">{isSent ? 'cash you\'re adding' : 'cash they\'re adding'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                    <span className="text-amber-400 font-semibold text-sm">+ ₱{Math.abs(offer.cashDiff).toLocaleString()}</span>
                    <span className="text-xs text-slate-400">{isSent ? 'cash they need to add' : 'cash you need to add'}</span>
                  </div>
                )
              )}

              {/* Message */}
              {offer.message && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Message</p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{offer.message}&rdquo;</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {offer && (
          <div className="border-t border-slate-800 flex-shrink-0">
            {confirmDelete ? (
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm text-white font-semibold text-center">
                  {isSent && offer.status === 'pending' ? 'Retract this offer?' : 'Delete this offer?'}
                </p>
                <p className="text-xs text-slate-400 text-center leading-snug">
                  {isSent && offer.status === 'pending'
                    ? 'The other party will be notified that you retracted this offer.'
                    : 'This will permanently remove the offer from your history.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={acting}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-semibold rounded-xl transition-colors border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={acting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {acting ? 'Removing…' : 'Yes, remove it'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 sm:px-5 py-4">
                {!isSent && offer.status === 'pending' ? (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      onClick={() => handleStatus('accepted')}
                      disabled={acting}
                      className="py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleStatus('declined')}
                      disabled={acting}
                      className="py-2.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      ✕ Decline
                    </button>
                    <button
                      onClick={handleCounter}
                      disabled={acting}
                      className="py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      ↩ Counter
                    </button>
                  </div>
                ) : null}
                {(isSent || offer.status !== 'pending') && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={acting}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 text-slate-400 text-sm font-semibold rounded-xl transition-colors border border-slate-700 hover:border-red-500/30"
                  >
                    {isSent && offer.status === 'pending' ? 'Retract' : 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
