'use client';

import { useEffect, useState } from 'react';

interface LightboxImage {
  src: string;
  label?: string;
}

interface Props {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const hasMultiple = images.length > 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight' && hasMultiple) setIndex((i) => (i + 1) % images.length);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, hasMultiple, images.length]);

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[200] bg-black sm:bg-black/92 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image — full screen on mobile, bounded on desktop */}
      <div
        className="w-full h-full sm:w-auto sm:h-auto flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.label ?? 'Card image'}
          className="w-full h-full object-contain sm:w-auto sm:h-auto sm:max-h-[85vh] sm:max-w-[88vw] sm:rounded-2xl sm:shadow-2xl"
        />
      </div>

      {/* Label */}
      {current.label && (
        <div className="absolute bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/60 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          {current.label}
        </div>
      )}

      {/* Prev / Next arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-6 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-white scale-110' : 'bg-white/30 hover:bg-white/50'}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
