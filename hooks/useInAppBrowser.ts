'use client';

import { useSyncExternalStore } from 'react';

type InAppBrowserInfo = {
  isInAppBrowser: boolean;
  isMobile: boolean;
  userAgent: string;
};

const IN_APP_BROWSER_PATTERN = /FBAN|FBAV|FB_IAB|Instagram|Messenger/i;
const MOBILE_PATTERN = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i;

function subscribeToUserAgent() {
  return () => undefined;
}

export function detectInAppBrowser(userAgent: string) {
  const isMobile = MOBILE_PATTERN.test(userAgent);
  const isInAppBrowser = isMobile && IN_APP_BROWSER_PATTERN.test(userAgent);

  return {
    isInAppBrowser,
    isMobile,
    userAgent,
  };
}

export function useInAppBrowser(): InAppBrowserInfo {
  const userAgent = useSyncExternalStore(
    subscribeToUserAgent,
    () => (typeof window === 'undefined' ? '' : window.navigator.userAgent),
    () => '',
  );

  return detectInAppBrowser(userAgent);
}
