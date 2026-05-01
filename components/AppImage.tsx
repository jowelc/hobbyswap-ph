'use client';

import { useState } from 'react';
import NextImage, { type ImageProps } from 'next/image';

type Props = ImageProps & {
  fallbackSrc?: string;
};

/**
 * Drop-in for Next.js Image. Renders a pulse skeleton while loading and a
 * placeholder icon on error. The parent must have `position: relative` — all
 * `fill`-style image containers already satisfy this.
 */
export default function AppImage({ fallbackSrc, className = '', ...props }: Props) {
  const [status, setStatus]     = useState<'loading' | 'loaded' | 'error'>('loading');
  const [activeSrc, setActiveSrc] = useState<ImageProps['src']>(props.src);

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse" />
      )}
      {status === 'error' && (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
        </div>
      )}
      <NextImage
        {...props}
        src={activeSrc}
        className={`${className} transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (fallbackSrc && activeSrc !== fallbackSrc) {
            setActiveSrc(fallbackSrc);
          } else {
            setStatus('error');
          }
        }}
      />
    </>
  );
}
