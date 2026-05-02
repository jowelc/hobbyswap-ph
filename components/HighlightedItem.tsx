'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Item } from '@/types/item';
import { formatCurrency, getConditionColor, getTradePrefColor } from '@/lib/utils';
import TradeOfferModal from './TradeOfferModal';
import ImageLightbox from './ImageLightbox';

interface Props {
  item: Item;
  ownerUserId: string;
  ownerUsername: string;
  ownerAvatar: string;
  ownerLookingFor?: string;
  tier?: string;
  isOwner?: boolean;
}

export default function HighlightedItem({ item, ownerUserId, ownerUsername, ownerAvatar, ownerLookingFor, tier, isOwner = false }: Props) {
  const [showBack, setShowBack] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [backImgError, setBackImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const fallback = '/card-placeholder-front.svg';
  const fallbackBack = '/card-placeholder-back.svg';

  const currentImg = showBack
    ? backImgError ? fallbackBack : item.backImageUrl
    : imgError ? fallback : item.frontImageUrl;

  function handleImgChange(isBack: boolean) {
    setImgLoaded(false);
    setShowBack(isBack);
  }

  return (
    <>
      <div className="bg-slate-800/50 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/5 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-0">
          {/* Image panel */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0 bg-slate-900 p-5 flex flex-col items-center gap-3">
            <div
              className="relative w-full max-w-xs aspect-[5/7] rounded-xl overflow-hidden cursor-zoom-in group bg-slate-800"
              onClick={() => setLightboxOpen(true)}
              onMouseEnter={() => handleImgChange(true)}
              onMouseLeave={() => handleImgChange(false)}
            >
              {!imgLoaded && (
                <div className="absolute inset-0 z-10 bg-slate-700 animate-pulse rounded-xl" />
              )}
              <Image
                src={currentImg}
                alt={showBack ? `${item.name} - Back` : item.name}
                fill
                className={`object-contain transition-all duration-200 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => { showBack ? setBackImgError(true) : setImgError(true); setImgLoaded(true); }}
                unoptimized
                sizes="320px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <span className="text-xs font-semibold text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Click to expand
                </span>
              </div>
            </div>

            {/* Front / Back toggle */}
            <div className="flex rounded-lg overflow-hidden border border-slate-700 text-sm">
              <button
                onClick={() => handleImgChange(false)}
                className={`px-4 py-1.5 font-medium transition-colors ${
                  !showBack ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Front
              </button>
              <button
                onClick={() => handleImgChange(true)}
                className={`px-4 py-1.5 font-medium transition-colors ${
                  showBack ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Back
              </button>
            </div>
          </div>

          {/* Details panel */}
          <div className="flex-1 p-5 sm:p-6 space-y-4">
            {/* Name + value */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{item.name}</h2>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-0.5">Est. Value</p>
                  <p className="text-2xl font-black text-blue-400">{formatCurrency(item.estimatedValue)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getConditionColor(item.condition)}`}>
                  {item.condition}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getTradePrefColor(item.tradePreference)}`}>
                  {item.tradePreference}
                </span>
                {item.cashDifferenceAccepted && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Cash Diff OK
                  </span>
                )}
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div className="text-slate-400">Category <span className="text-white font-medium float-right">{item.category}</span></div>
              <div className="text-slate-400">Location <span className="text-white font-medium float-right">📍 {item.location}</span></div>
              {item.playerName && (
                <div className="text-slate-400">Player <span className="text-white font-medium float-right">{item.playerName}</span></div>
              )}
              {item.team && (
                <div className="text-slate-400">Team <span className="text-white font-medium float-right">{item.team}</span></div>
              )}
              {item.brand && (
                <div className="text-slate-400">Brand <span className="text-white font-medium float-right">{item.brand}</span></div>
              )}
              {item.year && (
                <div className="text-slate-400">Year <span className="text-white font-medium float-right">{item.year}</span></div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
            </div>

            {/* Looking for */}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Looking for</p>
              <p className="text-sm text-slate-200">{item.lookingFor}</p>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-slate-700/50 text-slate-400 px-2.5 py-1 rounded-full border border-slate-600/50">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {isOwner ? (
                <div className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-sm font-semibold rounded-xl text-center select-none">
                  ✦ My Listing
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setTradeModalOpen(true)}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    🤝 Make Trade Offer
                  </button>
                  <button
                    onClick={() => setWatchlisted((v) => !v)}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all border ${
                      watchlisted
                        ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    {watchlisted ? '★ Watching' : '☆ Watchlist'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {tradeModalOpen && (
        <TradeOfferModal
          targetItem={item}
          targetUserId={ownerUserId}
          targetUsername={ownerUsername}
          targetLookingFor={ownerLookingFor}
          onClose={() => setTradeModalOpen(false)}
        />
      )}
      {lightboxOpen && (
        <ImageLightbox
          images={[
            { src: imgError ? fallback : item.frontImageUrl, label: 'Front' },
            { src: backImgError ? fallbackBack : item.backImageUrl, label: 'Back' },
          ]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
