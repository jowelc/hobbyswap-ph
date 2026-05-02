'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppImage from './AppImage';
import ProfileCompletionModal, { ProfileFields, parsePaymentMethods } from './ProfileCompletionModal';

interface WatchlistItem {
  itemId: string;
  name: string;
  frontImageUrl: string;
  isForTrade: boolean;
  ownerUsername: string;
}

interface OfferNotification {
  id: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
  offeredCount: number;
  requestedCount: number;
  cashDiff: number;
  message: string;
  readAt: string | null;
  createdAt: string;
}

interface SysNotification {
  id: string;
  type: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatar: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface ProfileStatus {
  location: string;
  lookingFor: string;
  paymentDetails: string;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function missingProfileFields(p: ProfileStatus): string[] {
  const missing: string[] = [];
  if (!p.location || p.location === 'Philippines') missing.push('location');
  if (!p.lookingFor || p.lookingFor === 'No preference') missing.push('looking for');
  if (parsePaymentMethods(p.paymentDetails).length === 0) missing.push('GCash / bank details');
  return missing;
}

export default function NotificationBell() {
  const [offers,              setOffers]              = useState<OfferNotification[]>([]);
  const [sysNotifs,           setSysNotifs]           = useState<SysNotification[]>([]);
  const [profile,             setProfile]             = useState<ProfileStatus | null>(null);
  const [watchedItems,        setWatchedItems]        = useState<WatchlistItem[]>([]);
  const [open,                setOpen]                = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    const [offersRes, profileRes, watchRes, notifsRes] = await Promise.allSettled([
      fetch('/api/offers'),
      fetch('/api/users/me'),
      fetch('/api/watchlist'),
      fetch('/api/notifications'),
    ]);
    if (offersRes.status === 'fulfilled' && offersRes.value.ok) {
      setOffers(await offersRes.value.json());
    }
    if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
      const u = await profileRes.value.json();
      setProfile({
        location:       u.location       || '',
        lookingFor:     u.lookingFor     || '',
        paymentDetails: u.paymentDetails || '',
      });
    }
    if (watchRes.status === 'fulfilled' && watchRes.value.ok) {
      setWatchedItems(await watchRes.value.json());
    }
    if (notifsRes.status === 'fulfilled' && notifsRes.value.ok) {
      setSysNotifs(await notifsRes.value.json());
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const unread              = offers.filter((o) => !o.readAt).length;
  const unreadSys           = sysNotifs.filter((n) => !n.readAt).length;
  const unavailableWatched  = watchedItems.filter((w) => !w.isForTrade);
  const missing             = profile ? missingProfileFields(profile) : [];
  const hasIncompleteProfile = missing.length > 0;
  const totalBadge          = unread + unreadSys + unavailableWatched.length;

  async function handleToggle() {
    const wasOpen = open;
    setOpen((v) => !v);
    if (!wasOpen) {
      const now = new Date().toISOString();
      if (unread > 0) {
        try {
          await fetch('/api/offers/read', { method: 'POST' });
          setOffers((prev) => prev.map((o) => ({ ...o, readAt: o.readAt ?? now })));
        } catch {}
      }
      if (unreadSys > 0) {
        try {
          await fetch('/api/notifications', { method: 'POST' });
          setSysNotifs((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
        } catch {}
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {totalBadge > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none pointer-events-none">
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[60]">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Notifications</p>
            {offers.length > 0 && (
              <span className="text-xs text-slate-500">{offers.length} offer{offers.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-800/60">

            {/* ── Profile completion reminder ── */}
            {hasIncompleteProfile && (
              <button
                onClick={() => { setOpen(false); setCompletionModalOpen(true); }}
                className="w-full flex items-start gap-3 px-4 py-3 bg-amber-500/8 hover:bg-amber-500/15 transition-colors border-b border-amber-500/20 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-400">Complete your profile</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Missing:{' '}
                    {missing.map((f, i) => (
                      <span key={f}>
                        <span className="text-white">{f}</span>
                        {i < missing.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                  <p className="text-[10px] text-amber-500/70 mt-1">Tap to fill in</p>
                </div>
              </button>
            )}

            {/* ── Watchlist unavailable alerts ── */}
            {unavailableWatched.map((w) => (
              <div key={w.itemId} className="flex items-start gap-3 px-4 py-3 bg-red-500/5 border-b border-red-500/10">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0 mt-0.5">
                  {w.frontImageUrl ? (
                    <AppImage src={w.frontImageUrl} alt={w.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-400">Item no longer available</p>
                  <p className="text-xs text-slate-300 truncate mt-0.5">{w.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">@{w.ownerUsername} · removed from trade</p>
                </div>
              </div>
            ))}

            {/* ── System notifications (retract / delete) ── */}
            {sysNotifs.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 ${!n.readAt ? 'bg-slate-700/30' : ''}`}
              >
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                  {n.actorAvatar ? (
                    <AppImage src={n.actorAvatar} alt={n.actorDisplayName} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-slate-500 to-slate-700">
                      {(n.actorDisplayName || n.actorUsername)[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-slate-300 leading-snug">{n.body}</p>
                    {!n.readAt && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))}

            {/* ── Trade offer notifications ── */}
            {offers.length === 0 && sysNotifs.length === 0 && !hasIncompleteProfile && unavailableWatched.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
                <span className="text-3xl">🤝</span>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : offers.length === 0 ? null : (
              offers.map((offer) => (
                <Link
                  key={offer.id}
                  href={`/profile?offer=${offer.id}`}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 transition-colors hover:bg-slate-800/60 ${!offer.readAt ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                      {offer.fromAvatar ? (
                        <AppImage src={offer.fromAvatar} alt={offer.fromDisplayName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                          {(offer.fromDisplayName || offer.fromUsername)[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">@{offer.fromUsername}</p>
                        {!offer.readAt && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        offered{' '}
                        <span className="text-white font-medium">
                          {offer.offeredCount} card{offer.offeredCount !== 1 ? 's' : ''}
                        </span>
                        {' '}for{' '}
                        <span className="text-white font-medium">
                          {offer.requestedCount} of yours
                        </span>
                        {offer.cashDiff > 0 && (
                          <span className="text-green-400 font-medium">
                            {' '}+ ₱{offer.cashDiff.toLocaleString()}
                          </span>
                        )}
                      </p>
                      {offer.message && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                          &ldquo;{offer.message}&rdquo;
                        </p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-1">{timeAgo(offer.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}

            {offers.length === 0 && sysNotifs.length === 0 && (hasIncompleteProfile || unavailableWatched.length > 0) && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-500">
                <span className="text-2xl">🤝</span>
                <p className="text-sm">No trade offers yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {completionModalOpen && profile && (
        <ProfileCompletionModal
          initial={profile as ProfileFields}
          onClose={() => setCompletionModalOpen(false)}
          onSaved={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}
