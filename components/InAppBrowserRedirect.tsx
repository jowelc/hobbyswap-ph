'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInAppBrowser } from '@/hooks/useInAppBrowser';

function createAndroidIntentUrl(url: string) {
  const parsedUrl = new URL(url);
  const path = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  const fallbackUrl = encodeURIComponent(url);

  return `intent://${path}#Intent;scheme=${parsedUrl.protocol.replace(':', '')};S.browser_fallback_url=${fallbackUrl};end`;
}

export default function InAppBrowserRedirect() {
  const { isInAppBrowser } = useInAppBrowser();
  const [showInstructions, setShowInstructions] = useState(false);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const openInBrowser = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setShowInstructions(false);

    const currentUrl = window.location.href;
    const userAgent = window.navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    let pageWasHidden = false;

    const markPageHidden = () => {
      pageWasHidden = true;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markPageHidden();
      }
    };

    window.addEventListener('pagehide', markPageHidden, { once: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { once: true });

    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
    }

    redirectTimerRef.current = window.setTimeout(() => {
      window.removeEventListener('pagehide', markPageHidden);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (!pageWasHidden && document.visibilityState !== 'hidden') {
        setShowInstructions(true);
      }
    }, 1200);

    if (isAndroid) {
      window.location.href = createAndroidIntentUrl(currentUrl);
      return;
    }

    const openedWindow = window.open(currentUrl, '_blank');

    if (!openedWindow) {
      setShowInstructions(true);
      return;
    }

    openedWindow.opener = null;
  }, []);

  if (!isInAppBrowser) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center bg-slate-950 px-5 py-8 text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="in-app-browser-title"
    >
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-2xl">
          ↗
        </div>
        <h1 id="in-app-browser-title" className="text-balance text-2xl font-semibold leading-tight">
          For the best experience, please open this site in your browser.
        </h1>
        <button
          type="button"
          onClick={openInBrowser}
          className="mt-7 w-full rounded-lg bg-cyan-300 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Open in Browser
        </button>
        {showInstructions ? (
          <p className="mt-5 text-sm leading-6 text-slate-300">
            Tap the 3 dots (⋯) and select &apos;Open in browser&apos;
          </p>
        ) : null}
      </div>
    </div>
  );
}
