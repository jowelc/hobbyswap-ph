'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import OfferDetailModal, { OfferItem } from '@/components/OfferDetailModal';
import TradeOfferModal from '@/components/TradeOfferModal';
import ChatModal from '@/components/ChatModal';
import AppImage from '@/components/AppImage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReceivedOfferRow {
  id: string;
  fromUserId: string;
  offeredCount: number;
  requestedCount: number;
  cashDiff: number;
  message: string;
  status: string;
  readAt: string | null;
  createdAt: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
}

interface SentOfferRow {
  id: string;
  toUserId: string;
  offeredCount: number;
  requestedCount: number;
  cashDiff: number;
  message: string;
  status: string;
  createdAt: string;
  toUsername: string;
  toDisplayName: string;
  toAvatar: string;
}

interface AcceptedOfferRow {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
  toUsername: string;
  toDisplayName: string;
  toAvatar: string;
  offeredCount: number;
  requestedCount: number;
  cashDiff: number;
  fromShipped: boolean;
  toShipped: boolean;
  fromReceived: boolean;
  toReceived: boolean;
  cashSettled: boolean;
  fromDoneDeal: boolean;
  toDoneDeal: boolean;
  fromTrackingUrl: string | null;
  toTrackingUrl: string | null;
  cashProofUrl: string | null;
  fromTier: string;
  toTier: string;
  iAmSender: boolean;
  createdAt: string;
}

interface ArchivedOfferRow {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
  toUsername: string;
  toDisplayName: string;
  toAvatar: string;
  offeredCount: number;
  requestedCount: number;
  cashDiff: number;
  status: string;
  iAmSender: boolean;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function OfferStatusBadge({ status }: { status: string }) {
  if (status === 'accepted') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Accepted</span>;
  if (status === 'declined') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">Declined</span>;
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending</span>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TradesPanel({ onDoneDeal }: { onDoneDeal?: () => void }) {
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOfferRow[]>([]);
  const [sentOffers,     setSentOffers]     = useState<SentOfferRow[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<AcceptedOfferRow[]>([]);
  const [archivedOffers, setArchivedOffers] = useState<ArchivedOfferRow[]>([]);
  const [activeOfferTab, setActiveOfferTab] = useState<'received' | 'sent' | 'accepted' | 'archived'>('received');
  const [openOfferId,    setOpenOfferId]    = useState<string | null>(null);
  const [counterTarget,  setCounterTarget]  = useState<{ originalOfferId: string; userId: string; username: string; cashDiff: number; theirItems: OfferItem[]; myItems: OfferItem[] } | null>(null);
  const [actingOfferIds,   setActingOfferIds]   = useState<Set<string>>(new Set());
  const [confirmOfferId,   setConfirmOfferId]   = useState<string | null>(null);
  const [loadingCounterId, setLoadingCounterId] = useState<string | null>(null);
  const [chatTarget,       setChatTarget]       = useState<{ offerId: string; userId: string; username: string; displayName: string; avatar: string; tradeContext: string } | null>(null);
  const [unreadCounts,     setUnreadCounts]     = useState<Record<string, number>>({});
  const [showDealSuccess,  setShowDealSuccess]  = useState(false);
  const [loadingDoneDealId, setLoadingDoneDealId] = useState<string | null>(null);
  const [clickedDoneDeals,  setClickedDoneDeals]  = useState<Set<string>>(new Set());
  const [lightboxUrl,       setLightboxUrl]       = useState<string | null>(null);
  const prevAcceptedIdsRef = useRef<Set<string>>(new Set());

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/offers?direction=received')
      .then((r) => r.json())
      .then((data: ReceivedOfferRow[]) => setReceivedOffers(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch('/api/offers?direction=sent')
      .then((r) => r.json())
      .then((data: SentOfferRow[]) => setSentOffers(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch('/api/offers?direction=accepted')
      .then((r) => r.json())
      .then((data: AcceptedOfferRow[]) => {
        const arr = Array.isArray(data) ? data : [];
        setAcceptedOffers(arr);
        prevAcceptedIdsRef.current = new Set(arr.map((o) => o.id));
      })
      .catch(() => {});
    fetch('/api/offers?direction=archived')
      .then((r) => r.json())
      .then((data: ArchivedOfferRow[]) => setArchivedOffers(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch('/api/messages/unread')
      .then((r) => r.json())
      .then((data: Record<string, number>) => setUnreadCounts(data ?? {}))
      .catch(() => {});
  }, []);

  // ── Poll every 5s ────────────────────────────────────────────────────────────

  useEffect(() => {
    const poll = () => {
      Promise.all([
        fetch('/api/offers?direction=received').then((r) => r.json()),
        fetch('/api/offers?direction=sent').then((r) => r.json()),
        fetch('/api/offers?direction=accepted').then((r) => r.json()),
        fetch('/api/offers?direction=archived').then((r) => r.json()),
      ]).then(([received, sent, accepted, archived]) => {
        const newReceived: ReceivedOfferRow[] = Array.isArray(received) ? received : [];
        const newSent:     SentOfferRow[]     = Array.isArray(sent)     ? sent     : [];
        const newAccepted: AcceptedOfferRow[] = Array.isArray(accepted) ? accepted : [];
        const newArchived: ArchivedOfferRow[] = Array.isArray(archived) ? archived : [];
        const newAcceptedIds = new Set(newAccepted.map((o) => o.id));
        const newCompletedIds = new Set(
          newArchived.filter((o) => o.status === 'completed').map((o) => o.id)
        );

        let justCompleted = false;
        for (const id of prevAcceptedIdsRef.current) {
          if (!newAcceptedIds.has(id) && newCompletedIds.has(id)) { justCompleted = true; break; }
        }

        const acceptedAndArchivedIds = new Set([
          ...newAccepted.map((o) => o.id),
          ...newArchived.map((o) => o.id),
        ]);

        prevAcceptedIdsRef.current = newAcceptedIds;
        setReceivedOffers(newReceived.filter((o) => !acceptedAndArchivedIds.has(o.id)));
        setSentOffers(newSent.filter((o) => !acceptedAndArchivedIds.has(o.id)));
        setAcceptedOffers((prev) => {
          const prevMap = new Map(prev.map((o) => [o.id, o]));
          return newAccepted.map((fresh) => {
            const local = prevMap.get(fresh.id);
            if (!local) return fresh;
            return { ...fresh, fromDoneDeal: fresh.fromDoneDeal || local.fromDoneDeal, toDoneDeal: fresh.toDoneDeal || local.toDoneDeal };
          });
        });
        setArchivedOffers(newArchived);
        if (justCompleted) { setClickedDoneDeals(new Set()); setShowDealSuccess(true); }
      }).catch(() => {});

      fetch('/api/messages/unread')
        .then((r) => r.json())
        .then((data: Record<string, number>) => setUnreadCounts(data ?? {}))
        .catch(() => {});
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Open offer from ?offer= param ───────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const offerId = params.get('offer');
    if (offerId) {
      setOpenOfferId(offerId);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleOfferAction(id: string, newStatus: string) {
    setReceivedOffers((prev) => prev.filter((o) => o.id !== id));
    if (newStatus === 'accepted') {
      setSentOffers((prev) => prev.filter((o) => o.id !== id));
      setActiveOfferTab('accepted');
      fetch('/api/offers?direction=accepted')
        .then((r) => r.json())
        .then((data: AcceptedOfferRow[]) => {
          const arr = Array.isArray(data) ? data : [];
          setAcceptedOffers(arr);
          prevAcceptedIdsRef.current = new Set(arr.map((o) => o.id));
        })
        .catch(() => {});
    } else if (newStatus === 'declined') {
      fetch('/api/offers?direction=archived')
        .then((r) => r.json())
        .then((d: ArchivedOfferRow[]) => setArchivedOffers(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
  }

  function handleOfferDelete(id: string) {
    setReceivedOffers((prev) => prev.filter((o) => o.id !== id));
    setSentOffers((prev) => prev.filter((o) => o.id !== id));
  }

  function handleCounter(originalOfferId: string, userId: string, username: string, cashDiff: number, theirItems: OfferItem[], myItems: OfferItem[]) {
    setOpenOfferId(null);
    setCounterTarget({ originalOfferId, userId, username, cashDiff, theirItems, myItems });
  }

  async function handleInlineAction(id: string, status: 'accepted' | 'declined') {
    setActingOfferIds((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReceivedOffers((prev) => prev.filter((o) => o.id !== id));
        if (status === 'accepted') {
          setSentOffers((prev) => prev.filter((o) => o.id !== id));
          setActiveOfferTab('accepted');
          fetch('/api/offers?direction=accepted')
            .then((r) => r.json())
            .then((data: AcceptedOfferRow[]) => {
              const arr = Array.isArray(data) ? data : [];
              setAcceptedOffers(arr);
              prevAcceptedIdsRef.current = new Set(arr.map((o) => o.id));
            })
            .catch(() => {});
        } else if (status === 'declined') {
          fetch('/api/offers?direction=archived')
            .then((r) => r.json())
            .then((d: ArchivedOfferRow[]) => setArchivedOffers(Array.isArray(d) ? d : []))
            .catch(() => {});
        }
      }
    } finally {
      setActingOfferIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  async function handleInlineDelete(id: string) {
    setActingOfferIds((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReceivedOffers((prev) => prev.filter((o) => o.id !== id));
        setSentOffers((prev) => prev.filter((o) => o.id !== id));
      }
    } finally {
      setActingOfferIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setConfirmOfferId(null);
    }
  }

  async function handleChecklistUpdate(offerId: string, field: 'myShipped' | 'myReceived' | 'cashSettled', value: boolean) {
    setAcceptedOffers((prev) => prev.map((o) => {
      if (o.id !== offerId) return o;
      if (field === 'myShipped')  return o.iAmSender ? { ...o, fromShipped: value }  : { ...o, toShipped: value };
      if (field === 'myReceived') return o.iAmSender ? { ...o, fromReceived: value } : { ...o, toReceived: value };
      return { ...o, cashSettled: value };
    }));
    try {
      await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checklist', field, value }),
      });
    } catch {
      fetch('/api/offers?direction=accepted')
        .then((r) => r.json())
        .then((data: AcceptedOfferRow[]) => setAcceptedOffers(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }

  async function handleScreenshotUpload(offerId: string, field: 'trackingUrl' | 'cashProofUrl', file: File) {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json() as { url: string };
      setAcceptedOffers((prev) => prev.map((o) => {
        if (o.id !== offerId) return o;
        if (field === 'trackingUrl') return o.iAmSender ? { ...o, fromTrackingUrl: url } : { ...o, toTrackingUrl: url };
        return { ...o, cashProofUrl: url };
      }));
      await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'screenshot', field, url }),
      });
    } catch {}
  }

  async function handleDoneDeal(offerId: string) {
    setClickedDoneDeals((prev) => new Set([...prev, offerId]));
    setLoadingDoneDealId(offerId);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'doneDeal' }),
      });
      if (!res.ok) {
        setClickedDoneDeals((prev) => { const s = new Set(prev); s.delete(offerId); return s; });
        return;
      }
      const data = await res.json() as { completed: boolean };
      if (data.completed) {
        setClickedDoneDeals((prev) => { const s = new Set(prev); s.delete(offerId); return s; });
        prevAcceptedIdsRef.current.delete(offerId);
        setShowDealSuccess(true);
        setAcceptedOffers((prev) => prev.filter((o) => o.id !== offerId));
        fetch('/api/offers?direction=archived')
          .then((r) => r.json())
          .then((d: ArchivedOfferRow[]) => setArchivedOffers(Array.isArray(d) ? d : []))
          .catch(() => {});
        onDoneDeal?.();
      } else {
        setAcceptedOffers((prev) => prev.map((o) =>
          o.id !== offerId ? o : o.iAmSender ? { ...o, fromDoneDeal: true } : { ...o, toDoneDeal: true }
        ));
      }
    } catch {
      setClickedDoneDeals((prev) => { const s = new Set(prev); s.delete(offerId); return s; });
    } finally {
      setLoadingDoneDealId(null);
    }
  }

  async function handleInlineCounter(offer: ReceivedOfferRow) {
    setLoadingCounterId(offer.id);
    try {
      const res = await fetch(`/api/offers/${offer.id}`);
      if (res.ok) {
        const data = await res.json();
        handleCounter(data.id, data.fromUserId, data.fromUsername, data.cashDiff, data.offeredItems, data.requestedItems);
      }
    } finally {
      setLoadingCounterId(null);
    }
  }

  function handleDealSuccessDone() {
    setShowDealSuccess(false);
    setActiveOfferTab('archived');
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 mb-4 w-fit">
        {(['received', 'sent', 'accepted', 'archived'] as const).map((tab) => {
          const count = tab === 'received' ? receivedOffers.length : tab === 'sent' ? sentOffers.length : tab === 'accepted' ? acceptedOffers.length : archivedOffers.length;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          const active = activeOfferTab === tab;
          const color      = tab === 'accepted' ? 'bg-green-600'  : tab === 'archived' ? 'bg-purple-600'  : 'bg-blue-600';
          const badgeColor = tab === 'accepted' ? 'bg-green-500'  : tab === 'archived' ? 'bg-purple-500'  : 'bg-blue-500';
          return (
            <button
              key={tab}
              onClick={() => setActiveOfferTab(tab)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${active ? `${color} text-white` : 'text-slate-400 hover:text-white'}`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? `${badgeColor} text-white` : 'bg-slate-700 text-slate-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Received ─────────────────────────────────────────────────────────── */}
      {activeOfferTab === 'received' && (
        receivedOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
            <div className="text-4xl mb-3 opacity-30">🤝</div>
            <p className="text-slate-400 text-sm">No offers received yet</p>
            <p className="text-slate-600 text-xs mt-1">Offers from other traders will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {receivedOffers.map((offer) => {
              const acting     = actingOfferIds.has(offer.id);
              const confirming = confirmOfferId === offer.id;
              return (
                <div key={offer.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                      {offer.fromAvatar ? (
                        <AppImage src={offer.fromAvatar} alt={offer.fromDisplayName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                          {(offer.fromDisplayName || offer.fromUsername)[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">@{offer.fromUsername}</p>
                        <OfferStatusBadge status={offer.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        offered{' '}
                        <span className="text-white font-medium">{offer.offeredCount} card{offer.offeredCount !== 1 ? 's' : ''}</span>
                        {' '}for{' '}
                        <span className="text-white font-medium">{offer.requestedCount} of yours</span>
                        {offer.cashDiff > 0 && <span className="text-green-400 font-medium"> + ₱{offer.cashDiff.toLocaleString()}</span>}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(offer.createdAt)}</p>
                  </div>
                  <div className="pt-0.5 border-t border-slate-700/40">
                    {confirming ? (
                      <div className="flex flex-col gap-2 pt-2">
                        <p className="text-xs text-slate-400">Remove this offer?</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleInlineDelete(offer.id)} disabled={acting} className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                            {acting ? 'Removing…' : 'Yes, remove'}
                          </button>
                          <button onClick={() => setConfirmOfferId(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        {offer.status === 'pending' && (
                          <>
                            <button onClick={() => handleInlineAction(offer.id, 'accepted')} disabled={acting} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                              ✓ Accept
                            </button>
                            <button onClick={() => handleInlineAction(offer.id, 'declined')} disabled={acting} className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                              ✕ Decline
                            </button>
                            <button onClick={() => handleInlineCounter(offer)} disabled={acting || loadingCounterId === offer.id} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                              {loadingCounterId === offer.id ? '…' : '↩ Counter'}
                            </button>
                          </>
                        )}
                        {offer.status === 'declined' && (
                          <button onClick={() => setConfirmOfferId(offer.id)} disabled={acting} className="px-3 py-1.5 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 text-slate-400 text-xs font-semibold rounded-lg transition-colors border border-slate-600 hover:border-red-500/30">
                            Delete
                          </button>
                        )}
                        <button onClick={() => setOpenOfferId(offer.id)} className="ml-auto text-xs text-slate-500 hover:text-white transition-colors px-2 py-1.5">
                          View details →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Sent ─────────────────────────────────────────────────────────────── */}
      {activeOfferTab === 'sent' && (
        sentOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
            <div className="text-4xl mb-3 opacity-30">📤</div>
            <p className="text-slate-400 text-sm">No offers sent yet</p>
            <p className="text-slate-600 text-xs mt-1">Offers you send to other traders will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sentOffers.map((offer) => {
              const acting     = actingOfferIds.has(offer.id);
              const confirming = confirmOfferId === offer.id;
              return (
                <div key={offer.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                      {offer.toAvatar ? (
                        <AppImage src={offer.toAvatar} alt={offer.toDisplayName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                          {(offer.toDisplayName || offer.toUsername)[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">@{offer.toUsername}</p>
                        <OfferStatusBadge status={offer.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        you offered{' '}
                        <span className="text-white font-medium">{offer.offeredCount} card{offer.offeredCount !== 1 ? 's' : ''}</span>
                        {offer.requestedCount > 0 && (
                          <>{' '}for{' '}<span className="text-white font-medium">{offer.requestedCount} of theirs</span></>
                        )}
                        {offer.cashDiff > 0 && <span className="text-green-400 font-medium"> + ₱{offer.cashDiff.toLocaleString()}</span>}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(offer.createdAt)}</p>
                  </div>
                  <div className="pt-0.5 border-t border-slate-700/40">
                    {confirming ? (
                      <div className="flex flex-col gap-2 pt-2">
                        <p className="text-xs text-slate-400">{offer.status === 'pending' ? 'Retract this offer?' : 'Delete this offer?'}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleInlineDelete(offer.id)} disabled={acting} className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                            {acting ? (offer.status === 'pending' ? 'Retracting…' : 'Deleting…') : (offer.status === 'pending' ? 'Yes, retract' : 'Yes, delete')}
                          </button>
                          <button onClick={() => setConfirmOfferId(null)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        <button onClick={() => setConfirmOfferId(offer.id)} disabled={acting} className="px-3 py-1.5 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 text-slate-400 text-xs font-semibold rounded-lg transition-colors border border-slate-600 hover:border-red-500/30">
                          {offer.status === 'pending' ? 'Retract' : 'Delete'}
                        </button>
                        <button onClick={() => setOpenOfferId(offer.id)} className="ml-auto text-xs text-slate-500 hover:text-white transition-colors px-2 py-1.5">
                          View details →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Accepted ─────────────────────────────────────────────────────────── */}
      {activeOfferTab === 'accepted' && (
        acceptedOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
            <div className="text-4xl mb-3 opacity-30">🤝</div>
            <p className="text-slate-400 text-sm">No accepted trades yet</p>
            <p className="text-slate-600 text-xs mt-1">Accepted offers will appear here with trade coordination tools</p>
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedOffers.map((offer) => {
              const otherUserId      = offer.iAmSender ? offer.toUserId      : offer.fromUserId;
              const otherUsername    = offer.iAmSender ? offer.toUsername    : offer.fromUsername;
              const otherDisplayName = offer.iAmSender ? offer.toDisplayName : offer.fromDisplayName;
              const otherAvatar      = offer.iAmSender ? offer.toAvatar      : offer.fromAvatar;
              const myShipped        = offer.iAmSender ? offer.fromShipped   : offer.toShipped;
              const theirShipped     = offer.iAmSender ? offer.toShipped     : offer.fromShipped;
              const hasCash          = offer.cashDiff !== 0;
              const cashAbs          = Math.abs(offer.cashDiff);
              const iPayCash         = (offer.iAmSender && offer.cashDiff > 0) || (!offer.iAmSender && offer.cashDiff < 0);
              const hasItems         = offer.offeredCount > 0 || offer.requestedCount > 0;
              const allDone          = (!hasItems || (myShipped && theirShipped)) && (!hasCash || offer.cashSettled);
              const tradeContext     = `${offer.offeredCount} card${offer.offeredCount !== 1 ? 's' : ''} ↔ ${offer.requestedCount} card${offer.requestedCount !== 1 ? 's' : ''}${hasCash ? ` + ₱${cashAbs.toLocaleString()}` : ''}`;
              const myDoneDeal       = clickedDoneDeals.has(offer.id) || (offer.iAmSender ? offer.fromDoneDeal : offer.toDoneDeal);
              const theirDoneDeal    = offer.iAmSender ? offer.toDoneDeal : offer.fromDoneDeal;
              const myTrackingUrl    = offer.iAmSender ? offer.fromTrackingUrl : offer.toTrackingUrl;
              const theirTrackingUrl = offer.iAmSender ? offer.toTrackingUrl   : offer.fromTrackingUrl;

              return (
                <div key={offer.id} className={`bg-slate-800/60 border rounded-2xl overflow-hidden transition-colors ${allDone ? 'border-green-500/30' : 'border-slate-700/50'}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                      {otherAvatar ? (
                        <AppImage src={otherAvatar} alt={otherDisplayName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-green-500 to-emerald-600">
                          {(otherDisplayName || otherUsername)[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">@{otherUsername}</p>
                        {allDone
                          ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Complete ✓</span>
                          : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">In Progress</span>
                        }
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{tradeContext}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(offer.createdAt)}</p>
                  </div>

                  <div className="border-t border-slate-700/40 px-4 py-3 space-y-2.5 bg-slate-900/30">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Trade Checklist</p>
                    {hasItems && (<>
                      <CheckItem checked={myShipped} onChange={(v) => handleChecklistUpdate(offer.id, 'myShipped', v)} label="My items shipped / handed off" />
                      <div className="ml-8 flex flex-wrap items-center gap-2">
                        <input type="file" id={`tracking-${offer.id}`} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleScreenshotUpload(offer.id, 'trackingUrl', file); e.target.value = ''; }} />
                        {myTrackingUrl && (
                          <button onClick={() => setLightboxUrl(myTrackingUrl)} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-600 hover:border-blue-400 transition-colors flex-shrink-0">
                            <AppImage src={myTrackingUrl} alt="My tracking" fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </div>
                          </button>
                        )}
                        <button onClick={() => document.getElementById(`tracking-${offer.id}`)?.click()} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-dashed border-slate-600 hover:border-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          {myTrackingUrl ? 'Replace tracking' : 'Upload tracking screenshot'}
                        </button>
                      </div>
                      <CheckItem checked={theirShipped} readOnly label={`@${otherUsername}'s items shipped / handed off`} waitingLabel={!theirShipped} />
                      {theirTrackingUrl && (
                        <div className="ml-8 flex items-center gap-2">
                          <button onClick={() => setLightboxUrl(theirTrackingUrl)} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-600 hover:border-blue-400 transition-colors flex-shrink-0">
                            <AppImage src={theirTrackingUrl} alt="Their tracking" fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </div>
                          </button>
                          <p className="text-xs text-slate-500">@{otherUsername}&apos;s tracking</p>
                        </div>
                      )}
                    </>)}
                    {hasCash && (<>
                      <CheckItem checked={offer.cashSettled} onChange={(v) => handleChecklistUpdate(offer.id, 'cashSettled', v)} label={`Cash settled — ₱${cashAbs.toLocaleString()} ${iPayCash ? '(you pay)' : '(you receive)'}`} labelAccent={iPayCash ? 'amber' : 'green'} />
                      <div className="ml-8 flex flex-wrap items-center gap-2">
                        <input type="file" id={`cashproof-${offer.id}`} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleScreenshotUpload(offer.id, 'cashProofUrl', file); e.target.value = ''; }} />
                        {offer.cashProofUrl && (
                          <button onClick={() => setLightboxUrl(offer.cashProofUrl!)} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-600 hover:border-green-400 transition-colors flex-shrink-0">
                            <AppImage src={offer.cashProofUrl} alt="Payment proof" fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </div>
                          </button>
                        )}
                        <button onClick={() => document.getElementById(`cashproof-${offer.id}`)?.click()} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-dashed border-slate-600 hover:border-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          {offer.cashProofUrl ? 'Replace payment proof' : 'Upload payment screenshot'}
                        </button>
                      </div>
                    </>)}
                  </div>

                  <div className="px-4 py-3 border-t border-slate-700/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUnreadCounts((prev) => { const n = { ...prev }; delete n[offer.id]; return n; });
                          setChatTarget({ offerId: offer.id, userId: otherUserId, username: otherUsername, displayName: otherDisplayName, avatar: otherAvatar, tradeContext });
                        }}
                        className="relative flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                        {(unreadCounts[offer.id] ?? 0) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                            {unreadCounts[offer.id] > 99 ? '99+' : unreadCounts[offer.id]}
                          </span>
                        )}
                      </button>
                      <button onClick={() => setOpenOfferId(offer.id)} className="text-xs text-slate-500 hover:text-white transition-colors px-2 py-2">
                        View details →
                      </button>
                    </div>
                    {allDone && (
                      myDoneDeal ? (
                        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5">
                          <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-xs text-purple-300">
                            You confirmed. Waiting for <span className="font-semibold">@{otherUsername}</span>…
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDoneDeal(offer.id)}
                          disabled={loadingDoneDealId === offer.id}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          {loadingDoneDealId === offer.id ? 'Confirming…' : '🤝 Done Deal'}
                        </button>
                      )
                    )}
                    {allDone && theirDoneDeal && !myDoneDeal && (
                      <p className="text-[11px] text-center text-purple-300 -mt-1">
                        <span className="font-semibold">@{otherUsername}</span> confirmed — tap Done Deal to finalize!
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Archived ─────────────────────────────────────────────────────────── */}
      {activeOfferTab === 'archived' && (
        archivedOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
            <div className="text-4xl mb-3 opacity-30">🗂️</div>
            <p className="text-slate-400 text-sm">No archived trades yet</p>
            <p className="text-slate-600 text-xs mt-1">Completed deals will be stored here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {archivedOffers.map((offer) => {
              const otherUsername    = offer.iAmSender ? offer.toUsername    : offer.fromUsername;
              const otherDisplayName = offer.iAmSender ? offer.toDisplayName : offer.fromDisplayName;
              const otherAvatar      = offer.iAmSender ? offer.toAvatar      : offer.fromAvatar;
              const hasCash          = offer.cashDiff !== 0;
              const cashAbs          = Math.abs(offer.cashDiff);
              const tradeContext     = `${offer.offeredCount} card${offer.offeredCount !== 1 ? 's' : ''} ↔ ${offer.requestedCount} card${offer.requestedCount !== 1 ? 's' : ''}${hasCash ? ` + ₱${cashAbs.toLocaleString()}` : ''}`;
              const isCompleted      = offer.status === 'completed';
              const confirming       = confirmOfferId === offer.id;
              return (
                <div key={offer.id} className={`bg-slate-800/40 border rounded-2xl px-4 py-3 flex items-center gap-3 group ${isCompleted ? 'border-purple-500/20' : 'border-slate-600/40'}`}>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                    {otherAvatar ? (
                      <AppImage src={otherAvatar} alt={otherDisplayName} fill className="object-cover" unoptimized />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${isCompleted ? 'from-purple-500 to-indigo-600' : 'from-slate-600 to-slate-700'}`}>
                        {(otherDisplayName || otherUsername)[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">@{otherUsername}</p>
                      {isCompleted
                        ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">🤝 Done Deal</span>
                        : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">✕ Declined</span>
                      }
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tradeContext}</p>
                  </div>
                  {confirming ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">Remove?</span>
                      <button
                        onClick={() => {
                          setConfirmOfferId(null);
                          setArchivedOffers((prev) => prev.filter((o) => o.id !== offer.id));
                          fetch(`/api/offers/${offer.id}`, { method: 'DELETE' }).catch(() => {});
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Yes
                      </button>
                      <button onClick={() => setConfirmOfferId(null)} className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(offer.createdAt)}</p>
                      <button
                        onClick={() => setConfirmOfferId(offer.id)}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 text-slate-600 hover:text-red-400 transition-all rounded-lg hover:bg-red-500/10"
                        title="Remove from archive"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}

      {openOfferId && (
        <OfferDetailModal
          offerId={openOfferId}
          isSent={
            sentOffers.some((o) => o.id === openOfferId) ||
            acceptedOffers.some((o) => o.id === openOfferId && o.iAmSender) ||
            archivedOffers.some((o) => o.id === openOfferId && o.iAmSender)
          }
          onClose={() => setOpenOfferId(null)}
          onAction={handleOfferAction}
          onDelete={handleOfferDelete}
          onCounter={handleCounter}
        />
      )}

      {chatTarget && (
        <ChatModal
          offerId={chatTarget.offerId}
          traderUserId={chatTarget.userId}
          traderUsername={chatTarget.username}
          traderDisplayName={chatTarget.displayName}
          traderAvatar={chatTarget.avatar}
          tradeContext={chatTarget.tradeContext}
          onClose={() => {
            setChatTarget(null);
            fetch('/api/messages/unread')
              .then((r) => r.json())
              .then((data: Record<string, number>) => setUnreadCounts(data ?? {}))
              .catch(() => {});
          }}
        />
      )}

      {lightboxUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Screenshot" className="w-full h-auto rounded-xl object-contain max-h-[85vh]" />
            <button onClick={() => setLightboxUrl(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white transition-colors border border-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showDealSuccess && <DealSuccessOverlay onDone={handleDealSuccessDone} />}

      {counterTarget && (
        <TradeOfferModal
          targetItem={null}
          targetUserId={counterTarget.userId}
          targetUsername={counterTarget.username}
          initialCashDiff={counterTarget.cashDiff}
          initialTheirItems={counterTarget.theirItems}
          initialMyItems={counterTarget.myItems}
          replaceOfferId={counterTarget.originalOfferId}
          onSent={() => {
            setReceivedOffers((prev) => prev.filter((o) => o.id !== counterTarget.originalOfferId));
            setCounterTarget(null);
          }}
          onClose={() => setCounterTarget(null)}
        />
      )}
    </>
  );
}

// ── CheckItem ─────────────────────────────────────────────────────────────────

function CheckItem({
  checked, onChange, readOnly, label, waitingLabel, labelAccent,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  readOnly?: boolean;
  label: string;
  waitingLabel?: boolean;
  labelAccent?: 'amber' | 'green';
}) {
  const canToggle = !readOnly && !!onChange;
  return (
    <div className={`flex items-center gap-3 ${canToggle ? 'cursor-pointer group' : ''}`} onClick={() => canToggle && onChange!(!checked)}>
      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        checked ? 'bg-green-500 border-green-500' : canToggle ? 'border-slate-600 hover:border-green-500 bg-transparent' : 'border-slate-700 bg-transparent'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm transition-colors ${
        checked ? 'text-slate-400 line-through' : canToggle ? `${labelAccent === 'amber' ? 'text-amber-300' : labelAccent === 'green' ? 'text-green-300' : 'text-white'} group-hover:opacity-80` : 'text-slate-400'
      }`}>
        {label}
        {waitingLabel && <span className="ml-1.5 text-[10px] text-slate-600">(waiting)</span>}
      </span>
    </div>
  );
}

// ── DealSuccessOverlay ────────────────────────────────────────────────────────

function DealSuccessOverlay({ onDone }: { onDone: () => void }) {
  const onDoneRef = useRef(onDone);
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 2.2 + Math.random() * 1.8,
      color: ['#60a5fa','#34d399','#a78bfa','#fbbf24','#f87171','#38bdf8','#fb923c','#e879f9'][Math.floor(Math.random() * 8)],
      size: 6 + Math.floor(Math.random() * 9),
      isCircle: Math.random() > 0.5,
    }))
  , []);

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 3600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p) => (
          <div key={p.id} className="absolute top-0 deal-confetti-piece" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}>
            <div style={{ width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.isCircle ? '50%' : '2px' }} />
          </div>
        ))}
      </div>
      <div className="deal-card relative z-10 flex flex-col items-center gap-3 bg-slate-900 border border-green-500/40 rounded-3xl px-10 py-8 shadow-2xl text-center">
        <span className="text-6xl deal-handshake inline-block">🤝</span>
        <h2 className="text-2xl font-black text-white tracking-tight mt-1">Done Deal!</h2>
        <p className="text-sm text-slate-400 max-w-xs">Trade complete. Items have been transferred to each trader.</p>
        <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-green-500 rounded-full deal-progress-bar" />
        </div>
        <p className="text-xs text-slate-600 mt-1">Moving to Archive…</p>
      </div>
    </div>
  );
}
