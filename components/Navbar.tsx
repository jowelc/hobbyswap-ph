'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { isAdmin } from '@/lib/constants';
import { Location } from '@/types/item';
import { InventoryItem } from '@/types/inventoryItem';
import Logo from './Logo';
import SearchBar from './SearchBar';
import PostItemModal from './PostItemModal';
import LocationGate from './LocationGate';
import NotificationBell from './NotificationBell';

interface Props {
  search?: string;
  onSearchChange?: (v: string) => void;
  showSearch?: boolean;
}

function locationKey(email: string) {
  return `hobbyswap_default_location_${email}`;
}
function inventoryKey(email: string) {
  return `hobbyswap_inventory_${email}`;
}
function profileKey(email: string) {
  return `hobbyswap_profile_${email}`;
}

export default function Navbar({ search = '', onSearchChange, showSearch = true }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationGateOpen, setLocationGateOpen] = useState(false);
  const [postLocation, setPostLocation] = useState<Location | null>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAvatarLoad = useCallback(() => setAvatarLoaded(true), []);

  const email = session?.user?.email ?? null;

  // Load saved location from localStorage after mount
  useEffect(() => {
    if (!email) return;
    try {
      const saved = localStorage.getItem(locationKey(email)) as Location | null;
      if (saved) setPostLocation(null); // don't auto-open, just remember it
    } catch {}
  }, [email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handlePostItemClick() {
    if (!email) return;
    try {
      const saved = localStorage.getItem(locationKey(email)) as Location | null;
      if (saved) {
        setPostLocation(saved);
      } else {
        setLocationGateOpen(true);
      }
    } catch {
      setLocationGateOpen(true);
    }
  }

  function handleLocationConfirm(loc: Location) {
    if (email) {
      try {
        // Persist as default
        localStorage.setItem(locationKey(email), loc);
        // Also write to profile meta so it shows on the profile page
        const raw = localStorage.getItem(profileKey(email));
        const meta = raw ? JSON.parse(raw) : {};
        localStorage.setItem(profileKey(email), JSON.stringify({ ...meta, location: loc }));
      } catch {}
    }
    setPostLocation(loc);
    setLocationGateOpen(false);
  }

  function handleChangeLocation() {
    setPostLocation(null);
    setLocationGateOpen(true);
  }

  function handleItemSaved(_item: InventoryItem) {
    setPostLocation(null);
    router.push('/profile');
  }

  const isLoggedIn = status === 'authenticated' && session?.user;

  return (
    <>
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <Logo />

          {/* Search bar — desktop */}
          {showSearch && (
            <div className="flex-1 hidden md:block max-w-2xl">
              <SearchBar value={search} onChange={onSearchChange ?? (() => {})} />
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile search toggle */}
            {showSearch && (
              <button
                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                onClick={() => setMobileSearchOpen((v) => !v)}
                aria-label="Toggle search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            ) : isLoggedIn ? (
              <>
                <button
                  onClick={handlePostItemClick}
                  className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors hidden sm:block"
                >
                  + Post Item
                </button>

                <NotificationBell />

                {/* User avatar + dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 ring-2 ring-blue-500/40">
                      {session.user?.image ? (
                        <>
                          {!avatarLoaded && (
                            <div className="absolute inset-0 bg-slate-600 animate-pulse rounded-full" />
                          )}
                          <Image
                            src={session.user.image}
                            alt={session.user.name ?? 'User'}
                            fill
                            className={`object-cover transition-opacity duration-300 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={handleAvatarLoad}
                            unoptimized
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                          {(session.user?.name ?? session.user?.email ?? 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="hidden sm:block text-sm text-slate-300 font-medium max-w-[100px] truncate">
                      {session.user?.name?.split(' ')[0] ?? session.user?.email?.split('@')[0]}
                    </span>
                    <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-800">
                        <p className="text-sm font-semibold text-white truncate">
                          {session.user?.name ?? 'Trader'}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {session.user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        {isAdmin(session.user?.email) ? (
                          <Link href="/admin" className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2">
                            <span>🛡️</span> Admin Dashboard
                          </Link>
                        ) : (
                          <Link href="/profile" className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2">
                            <span>👤</span> My Profile
                          </Link>
                        )}
                        <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2">
                          <span>🤝</span> My Trades
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2">
                          <span>⚙️</span> Settings
                        </button>
                      </div>
                      <div className="py-1 border-t border-slate-800">
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors flex items-center gap-2"
                        >
                          <span>↩</span> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors hidden sm:block"
                >
                  + Post Item
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile search row */}
        {showSearch && mobileSearchOpen && (
          <div className="md:hidden pb-3">
            <SearchBar
              value={search}
              onChange={(v) => {
                onSearchChange?.(v);
              }}
            />
          </div>
        )}
      </div>
    </header>

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
        onSave={handleItemSaved}
        onChangeLocation={handleChangeLocation}
      />
    )}
    </>
  );
}
