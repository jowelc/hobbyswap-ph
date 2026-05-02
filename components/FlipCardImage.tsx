'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageLightbox from './ImageLightbox';

interface Props {
  frontUrl: string;
  backUrl: string;
  alt: string;
  className?: string;
  aspectRatio?: 'card' | 'square';
}

export default function FlipCardImage({
  frontUrl,
  backUrl,
  alt,
  className = '',
  aspectRatio = 'card',
}: Props) {
  const [showBack, setShowBack] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [frontError, setFrontError] = useState(false);
  const [backError, setBackError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const aspect = aspectRatio === 'card' ? 'aspect-[5/7]' : 'aspect-square';
  const fallback = '/card-placeholder-front.svg';

  const hasBack = !!backUrl && !backError;

  const resolvedFront = frontError || !frontUrl ? fallback : frontUrl;
  const resolvedBack  = hasBack ? backUrl : resolvedFront;

  const currentUrl = showBack && hasBack ? resolvedBack : resolvedFront;

  const lightboxImages = [
    { src: resolvedFront, label: 'Front' },
    ...(backUrl ? [{ src: resolvedBack, label: 'Back' }] : []),
  ];

  function openLightbox(e: React.MouseEvent) {
    e.stopPropagation();
    setLightboxIndex(0); // always start from front
    setLightboxOpen(true);
  }

  return (
    <>
      <div
        className={`relative ${aspect} w-full overflow-hidden rounded-xl group cursor-zoom-in select-none ${className}`}
        onMouseEnter={() => { setShowBack(true); setImgLoaded(false); }}
        onMouseLeave={() => { setShowBack(false); setImgLoaded(false); }}
        onClick={openLightbox}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 bg-slate-700 animate-pulse" />
        )}
        <Image
          src={currentUrl}
          alt={showBack ? `${alt} - Back` : alt}
          fill
          className={`object-cover transition-all duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => { showBack ? setBackError(true) : setFrontError(true); setImgLoaded(true); }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Zoom hint — desktop */}
        <div className="hidden md:flex absolute top-2 left-2 text-xs bg-black/50 text-white/60 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none">
          {hasBack ? (showBack ? 'Back · click to expand' : 'Hover for back · click to expand') : 'Click to expand'}
        </div>

        {/* Mobile toggle button — only shown when there's a back image */}
        {hasBack && (
          <button
            className="md:hidden absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded-md backdrop-blur-sm font-medium border border-white/10"
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowBack((v) => !v);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showBack ? 'Front' : 'Back'}
          </button>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
