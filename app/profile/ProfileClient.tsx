'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Logo from '@/components/Logo';
import { parsePaymentMethods, PAYMENT_TYPES, type PaymentMethod } from '@/components/ProfileCompletionModal';
import { InventoryItem } from '@/types/inventoryItem';
import { Location } from '@/types/item';
import AddItemModal from '@/components/AddItemModal';
import PostItemModal from '@/components/PostItemModal';
import LocationGate from '@/components/LocationGate';
import OfferDetailModal, { OfferItem } from '@/components/OfferDetailModal';
import TradeOfferModal from '@/components/TradeOfferModal';
import ChatModal from '@/components/ChatModal';
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
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOfferRow[]>([]);
  const [sentOffers,     setSentOffers]     = useState<SentOfferRow[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<AcceptedOfferRow[]>([]);
  const [archivedOffers, setArchivedOffers] = useState<ArchivedOfferRow[]>([]);
  const [activeOfferTab, setActiveOfferTab] = useState<'received' | 'sent' | 'accepted' | 'archived'>('received');
  const [openOfferId,    setOpenOfferId]    = useState<string | null>(null);
  const [counterTarget,  setCounterTarget]  = useState<{ originalOfferId: string; userId: string; username: string; cashDiff: number; theirItems: OfferItem[]; myItems: OfferItem[] } | null>(null);
  const [actingOfferIds,    setActingOfferIds]    = useState<Set<string>>(new Set());
  const [confirmOfferId,    setConfirmOfferId]    = useState<string | null>(null);
  const [loadingCounterId,  setLoadingCounterId]  = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<{ userId: string; username: string; displayName: string; avatar: string; tradeContext: string } | null>(null);
  const [showDealSuccess, setShowDealSuccess] = useState(false);
  const [loadingDoneDealId, setLoadingDoneDealId] = useState<string | null>(null);
  const [clickedDoneDeals, setClickedDoneDeals] = useState<Set<string>>(new Set());
  const prevAcceptedIdsRef = useRef<Set<string>>(new Set());

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

  // Load trade offers (all 4 directions in parallel)
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
  }, []);

  // Poll all 4 directions every 5s for real-time updates.
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
        // Detect when an accepted offer moved to completed (triggers animation for the first user)
        const newCompletedIds = new Set(
          newArchived.filter((o) => o.status === 'completed').map((o) => o.id)
        );

        let justCompleted = false;
        for (const id of prevAcceptedIdsRef.current) {
          if (!newAcceptedIds.has(id) && newCompletedIds.has(id)) {
            justCompleted = true;
            break;
          }
        }

        // Defensively purge any accepted/archived IDs from pending lists
        const acceptedAndArchivedIds = new Set([
          ...newAccepted.map((o) => o.id),
          ...newArchived.map((o) => o.id),
        ]);

        prevAcceptedIdsRef.current = newAcceptedIds;
        setReceivedOffers(newReceived.filter((o) => !acceptedAndArchivedIds.has(o.id)));
        setSentOffers(newSent.filter((o) => !acceptedAndArchivedIds.has(o.id)));
        // Merge poll data but never downgrade a doneDeal flag we already set locally —
        // protects against serverless stale-read returning fromDoneDeal: false after we saved true.
        setAcceptedOffers((prev) => {
          const prevMap = new Map(prev.map((o) => [o.id, o]));
          return newAccepted.map((fresh) => {
            const local = prevMap.get(fresh.id);
            if (!local) return fresh;
            return {
              ...fresh,
              fromDoneDeal: fresh.fromDoneDeal || local.fromDoneDeal,
              toDoneDeal:   fresh.toDoneDeal   || local.toDoneDeal,
            };
          });
        });
        setArchivedOffers(newArchived);
        if (justCompleted) {
          setClickedDoneDeals(new Set()); // clear waiting state for the first user
          setShowDealSuccess(true);
        }
      }).catch(() => {});
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Open offer from ?offer= URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const offerId = params.get('offer');
    if (offerId) {
      setOpenOfferId(offerId);
      window.history.replaceState({}, '', window.location.pathname);
    }
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
      if (field === 'myShipped')   return o.iAmSender ? { ...o, fromShipped: value }   : { ...o, toShipped: value };
      if (field === 'myReceived')  return o.iAmSender ? { ...o, fromReceived: value }  : { ...o, toReceived: value };
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
        fetch('/api/items/mine')
          .then((r) => r.json())
          .then((d: InventoryItem[]) => setItems(Array.isArray(d) ? d : []))
          .catch(() => {});
      } else {
        // Persist the confirmation in local state so the 5-second poll can't reset the button.
        // clickedDoneDeals alone is not enough — polls overwrite acceptedOffers entirely.
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
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
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
              <p className="text-sm text-slate-400 truncate">@{username} · <span className="hidden xs:inline">{email}</span></p>

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
            <div className="flex sm:flex-col gap-4 sm:gap-2 text-left sm:text-right flex-shrink-0">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
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
        {/* Trade Offers section */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Trade Offers</h2>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 mb-4 w-fit">
            {(['received', 'sent', 'accepted', 'archived'] as const).map((tab) => {
              const count = tab === 'received' ? receivedOffers.length : tab === 'sent' ? sentOffers.length : tab === 'accepted' ? acceptedOffers.length : archivedOffers.length;
              const label = tab.charAt(0).toUpperCase() + tab.slice(1);
              const active = activeOfferTab === tab;
              const color = tab === 'accepted' ? 'bg-green-600' : tab === 'archived' ? 'bg-purple-600' : 'bg-blue-600';
              const badgeColor = tab === 'accepted' ? 'bg-green-500' : tab === 'archived' ? 'bg-purple-500' : 'bg-blue-500';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveOfferTab(tab)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    active ? `${color} text-white` : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? `${badgeColor} text-white` : 'bg-slate-700 text-slate-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Received tab */}
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

          {/* Sent tab */}
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
          {/* Accepted tab */}
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

                  return (
                    <div key={offer.id} className={`bg-slate-800/60 border rounded-2xl overflow-hidden transition-colors ${allDone ? 'border-green-500/30' : 'border-slate-700/50'}`}>
                      {/* Header row */}
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

                      {/* Checklist */}
                      <div className="border-t border-slate-700/40 px-4 py-3 space-y-2.5 bg-slate-900/30">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Trade Checklist</p>

                        {hasItems && (<>
                          {/* My items shipped */}
                          <CheckItem
                            checked={myShipped}
                            onChange={(v) => handleChecklistUpdate(offer.id, 'myShipped', v)}
                            label="My items shipped / handed off"
                          />
                          {/* Their items shipped (read-only) */}
                          <CheckItem
                            checked={theirShipped}
                            readOnly
                            label={`@${otherUsername}'s items shipped / handed off`}
                            waitingLabel={!theirShipped}
                          />
                        </>)}

                        {/* Cash settled */}
                        {hasCash && (
                          <CheckItem
                            checked={offer.cashSettled}
                            onChange={(v) => handleChecklistUpdate(offer.id, 'cashSettled', v)}
                            label={`Cash settled — ₱${cashAbs.toLocaleString()} ${iPayCash ? '(you pay)' : '(you receive)'}`}
                            labelAccent={iPayCash ? 'amber' : 'green'}
                          />
                        )}
                      </div>

                      {/* Footer actions */}
                      <div className="px-4 py-3 border-t border-slate-700/40 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setChatTarget({ userId: otherUserId, username: otherUsername, displayName: otherDisplayName, avatar: otherAvatar, tradeContext })}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Chat
                          </button>
                          <button onClick={() => setOpenOfferId(offer.id)} className="text-xs text-slate-500 hover:text-white transition-colors px-2 py-2">
                            View details →
                          </button>
                        </div>

                        {/* Done Deal */}
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
          {/* Archive tab */}
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
                  return (
                    <div key={offer.id} className={`bg-slate-800/40 border rounded-2xl px-4 py-3 flex items-center gap-3 ${isCompleted ? 'border-purple-500/20' : 'border-slate-600/40'}`}>
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
                      <p className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(offer.createdAt)}</p>
                    </div>
                  );
                })}
              </div>
            )
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
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

      {/* Offer detail modal */}
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

      {/* Chat modal */}
      {chatTarget && (
        <ChatModal
          traderUserId={chatTarget.userId}
          traderUsername={chatTarget.username}
          traderDisplayName={chatTarget.displayName}
          traderAvatar={chatTarget.avatar}
          tradeContext={chatTarget.tradeContext}
          onClose={() => setChatTarget(null)}
        />
      )}

      {/* Done Deal success overlay */}
      {showDealSuccess && <DealSuccessOverlay onDone={handleDealSuccessDone} />}

      {/* Counter offer modal */}
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
    </div>
  );
}

// ── Checklist item ────────────────────────────────────────────────────────────

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
    <div
      className={`flex items-center gap-3 ${canToggle ? 'cursor-pointer group' : ''}`}
      onClick={() => canToggle && onChange!(!checked)}
    >
      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        checked
          ? 'bg-green-500 border-green-500'
          : canToggle
            ? 'border-slate-600 hover:border-green-500 bg-transparent'
            : 'border-slate-700 bg-transparent'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-sm transition-colors ${
        checked
          ? 'text-slate-400 line-through'
          : canToggle
            ? `${labelAccent === 'amber' ? 'text-amber-300' : labelAccent === 'green' ? 'text-green-300' : 'text-white'} group-hover:opacity-80`
            : 'text-slate-400'
      }`}>
        {label}
        {waitingLabel && <span className="ml-1.5 text-[10px] text-slate-600">(waiting)</span>}
      </span>
    </div>
  );
}

// ── Done Deal success overlay ─────────────────────────────────────────────────

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
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 deal-confetti-piece"
            style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
          >
            <div style={{ width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.isCircle ? '50%' : '2px' }} />
          </div>
        ))}
      </div>

      {/* Card */}
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
          <div className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${item.isForTrade ? 'bg-green-500' : 'bg-slate-600'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${item.isForTrade ? 'left-[18px]' : 'left-0.5'}`} />
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

