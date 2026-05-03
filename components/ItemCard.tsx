'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Item } from '@/types/item';
import { formatCurrency, getConditionColor, getTradePrefColor } from '@/lib/utils';
import TradeOfferModal from './TradeOfferModal';

interface Props {
  item: Item;
  isOwner?: boolean;
  isWatched?: boolean;
  onToggleWatch?: () => void;
}

export default function ItemCard({ item, isOwner = false, isWatched = false, onToggleWatch }: Props) {
  const [showBack, setShowBack] = useState(false);
  const [frontLoaded, setFrontLoaded] = useState(false);
  const [backLoaded, setBackLoaded] = useState(false);
  const [frontError, setFrontError] = useState(false);
  const [backError, setBackError] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [toast, setToast] = useState<'added' | 'removed' | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [watchOffset, setWatchOffset] = useState(0);

  function handleWatchToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (toastTimer.current) clearTimeout(toastTimer.current);
    const adding = !isWatched;
    setToast(adding ? 'added' : 'removed');
    setWatchOffset((prev) => prev + (adding ? 1 : -1));
    toastTimer.current = setTimeout(() => setToast(null), 2500);
    onToggleWatch?.();
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const frontSrc = frontError ? '/card-placeholder-front.svg' : item.frontImageUrl;
  const hasBack  = !!item.backImageUrl && !backError;
  const backSrc  = item.backImageUrl || '';

  const showSkeleton = showBack
    ? (hasBack && !backLoaded)
    : !frontLoaded;

  return (
    <>
      <div className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 flex flex-col">
        {/* Image area */}
        <Link
          href={isOwner ? '/profile' : `/users/${item.ownerUsername}?item=${item.id}`}
          className="block relative aspect-[3/4] overflow-hidden bg-slate-800 flex-shrink-0"
          onMouseEnter={() => hasBack && setShowBack(true)}
          onMouseLeave={() => setShowBack(false)}
        >
          {/* Skeleton */}
          {showSkeleton && (
            <div className="absolute inset-0 z-10 bg-slate-700 animate-pulse" />
          )}

          {/* Front image */}
          <Image
            src={frontSrc}
            alt={item.name}
            fill
            className={`object-contain transition-all duration-300 group-hover:scale-105 ${showBack ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setFrontLoaded(true)}
            onError={() => { setFrontError(true); setFrontLoaded(true); }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />

          {/* Back image */}
          {hasBack && (
            <Image
              src={backSrc}
              alt={`${item.name} — Back`}
              fill
              className={`object-contain transition-all duration-300 group-hover:scale-105 ${showBack ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setBackLoaded(true)}
              onError={() => { setBackError(true); setBackLoaded(true); }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

          {/* Flip label */}
          {hasBack && (
            <div className={`absolute top-2 left-2 z-20 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm border transition-opacity duration-200 ${
              showBack
                ? 'bg-slate-700/80 text-white/70 border-white/10 opacity-100'
                : 'opacity-0 group-hover:opacity-100 bg-black/50 text-white/50 border-white/10'
            }`}>
              {showBack ? 'Back' : 'Hover for back'}
            </div>
          )}
        </Link>

        {/* Watchlist button — hidden for own items */}
        {!isOwner && (
          <button
            onClick={handleWatchToggle}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 border z-10 ${
              isWatched
                ? 'bg-blue-600/80 border-blue-400/50'
                : 'bg-black/50 border-white/10 hover:bg-black/70'
            }`}
            aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isWatched ? (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Watchlist toast */}
        {toast && (
          <div className="absolute top-12 right-2 z-20 max-w-[160px] bg-slate-900/95 border border-slate-700 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm animate-fade-in pointer-events-none">
            <p className="text-[10px] font-semibold text-blue-400 leading-tight mb-0.5">
              {toast === 'added' ? '👁 Now watching' : 'Removed'}
            </p>
            <p className="text-[10px] text-slate-300 leading-tight line-clamp-2">{item.name}</p>
          </div>
        )}

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <p className="text-sm font-bold text-white leading-tight line-clamp-2">{item.name}</p>

          {/* Category + condition */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${getConditionColor(item.condition)}`}>
              {item.condition}
            </span>
            <span className="text-[10px] text-slate-500 truncate">{item.category}</span>
          </div>

          {/* Price + location */}
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-sm font-bold text-blue-400">{formatCurrency(Number(item.estimatedValue))}</span>
            <span className="text-[10px] text-slate-500">📍 {item.location}</span>
          </div>

          {/* Trade preference */}
          <span className={`self-start text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${getTradePrefColor(item.tradePreference)}`}>
            {item.tradePreference}
          </span>

          {/* Watcher count */}
          {(() => { const n = (item.watcherCount ?? 0) + watchOffset; return n > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80">
              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{n} {n === 1 ? 'person' : 'people'} watching this card</span>
            </div>
          ); })()}

          {/* Offer / owner button */}
          {isOwner ? (
            <div className="mt-auto pt-1.5 w-full py-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs font-semibold rounded-xl text-center select-none">
              ✦ My Listing
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); setOfferOpen(true); }}
              className="mt-auto pt-1.5 w-full py-2 bg-blue-600/15 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              🤝 Make Offer
            </button>
          )}
        </div>
      </div>

      {offerOpen && (
        <TradeOfferModal
          targetItem={item}
          targetUserId={item.userId ?? ''}
          targetUsername={item.ownerUsername}
          targetLookingFor={item.ownerLookingFor}
          onClose={() => setOfferOpen(false)}
        />
      )}
    </>
  );
}
