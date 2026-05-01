'use client';

import { useState } from 'react';
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

  const frontSrc = frontError ? '/card-placeholder-front.svg' : item.frontImageUrl;
  const backSrc  = backError  ? '/card-placeholder-back.svg'  : item.backImageUrl;
  const hasBack  = Boolean(item.backImageUrl);

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
          onMouseEnter={() => setShowBack(true)}
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWatch?.(); }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 border z-10 ${
              isWatched
                ? 'bg-blue-600/80 border-blue-400/50'
                : 'bg-black/50 border-white/10 hover:bg-black/70'
            }`}
            aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <svg
              className={`w-4 h-4 transition-colors ${isWatched ? 'fill-white stroke-white' : 'fill-transparent stroke-white'}`}
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
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
