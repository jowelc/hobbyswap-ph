'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import FilterBar from '@/components/FilterBar';
import ItemGrid from '@/components/ItemGrid';
import Footer from '@/components/Footer';
import FloatingHeroCards from '@/components/FloatingHeroCards';
import { searchItems } from '@/data/items';
import { Item, FilterState } from '@/types/item';

const INITIAL_FILTERS: FilterState = {
  search: '',
  category: '',
  condition: '',
  tradePreference: '',
  location: '',
};

const TRUST_ITEMS = [
  { icon: '🛡️', label: 'Verified Traders', desc: 'All verified sellers go through identity checks' },
  { icon: '🤖', label: 'AI-Powered Listings', desc: 'Auto-identifies card name, grade, value, and details' },
  { icon: '💰', label: 'Trade + Cash', desc: 'Flexible trade terms accepted by most sellers' },
  { icon: '📦', label: 'PH Shipping Friendly', desc: 'Traders coordinate shipping and meetups their own way' },
];

export default function HomePage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | null)?.id;
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'recent' | 'value-high' | 'value-low'>('recent');
  const [watchedItemIds, setWatchedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) return;
    fetch('/api/watchlist')
      .then((r) => r.ok ? r.json() : [])
      .then((rows: { itemId: string }[]) => setWatchedItemIds(new Set(rows.map((r) => r.itemId))))
      .catch(() => {});
  }, [session]);

  async function handleToggleWatch(itemId: string) {
    const isWatched = watchedItemIds.has(itemId);
    setWatchedItemIds((prev) => {
      const next = new Set(prev);
      isWatched ? next.delete(itemId) : next.add(itemId);
      return next;
    });
    try {
      if (isWatched) {
        await fetch(`/api/watchlist/${itemId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
      }
    } catch {
      setWatchedItemIds((prev) => {
        const next = new Set(prev);
        isWatched ? next.add(itemId) : next.delete(itemId);
        return next;
      });
    }
  }

  useEffect(() => {
    fetch('/api/items')
      .then((r) => r.json())
      .then((data: Array<Record<string, unknown>>) => {
        const mapped: Item[] = (Array.isArray(data) ? data : []).map((r) => ({
          id:                     r.id as string,
          userId:                 r.userId as string,
          ownerUsername:          r.username as string,
          ownerLookingFor:        (r.ownerLookingFor as string) || 'No preference',
          ownerLocation:          (r.ownerLocation as string) || 'Philippines',
          name:                   r.name as string,
          category:               r.category as Item['category'],
          condition:              r.condition as Item['condition'],
          estimatedValue:         r.estimatedValue as number,
          location:               r.location as Item['location'],
          tradePreference:        r.tradePreference as Item['tradePreference'],
          frontImageUrl:          r.frontImageUrl as string,
          backImageUrl:           (r.backImageUrl as string) || '',
          description:            (r.description as string) || '',
          lookingFor:             (r.lookingFor as string) || '',
          cashDifferenceAccepted: r.cashDifferenceAccepted as boolean,
          tags:                   (r.tags as string[]) || [],
          createdAt:              r.addedAt as string,
        }));
        setAllItems(mapped);
      })
      .catch(() => setAllItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    const base = searchItems(
      allItems,
      filters.search,
      filters.category,
      filters.condition,
      filters.tradePreference,
      filters.location,
    );
    if (sort === 'value-high') return [...base].sort((a, b) => b.estimatedValue - a.estimatedValue);
    if (sort === 'value-low')  return [...base].sort((a, b) => a.estimatedValue - b.estimatedValue);
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allItems, filters, sort]);

  const hasActiveFilters = Boolean(
    filters.search || filters.category || filters.condition || filters.tradePreference || filters.location
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        showSearch
      />

      {/* Hero */}
      <section className="relative bg-slate-950 border-b border-slate-800/60 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:44px_44px] opacity-25 pointer-events-none" />
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-600/12 rounded-full blur-[80px] pointer-events-none" />

        <FloatingHeroCards />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <Image src="/logo-icon.png" alt="" width={600} height={600} className="opacity-[0.04] select-none" priority />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center xl:px-0">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-7">
            <span className="text-sm">🇵🇭</span>
            Philippines&apos; #1 Collectible Trade Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Swap.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Trade.
            </span>
            {' '}Collect.
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-9">
            The Philippines&apos; most trusted marketplace for cards and collectibles. List for free, trade safely, and connect with verified collectors nationwide.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <a href="#listings" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-900/40">
              Browse Listings <span aria-hidden>→</span>
            </a>
            <a href="/how-it-works" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 font-semibold px-7 py-3.5 rounded-xl transition-colors">
              How It Works
            </a>
          </div>

          <div className="inline-flex flex-wrap justify-center items-center gap-8 sm:gap-12">
            <div>
              <p className="text-3xl font-black text-white tabular-nums">{isLoading ? '…' : `${allItems.length}+`}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Active Listings</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-800" />
            <div>
              <p className="text-3xl font-black text-white tabular-nums">🇵🇭</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Philippines Only</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-800" />
            <div>
              <p className="text-3xl font-black text-white tabular-nums">Free</p>
              <p className="text-xs text-slate-500 font-medium mt-1">to List & Trade</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {TRUST_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-slate-800 flex items-center justify-center text-base">{item.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-slate-500 hidden sm:block leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main id="listings" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <FilterBar filters={filters} onChange={setFilters} sort={sort} onSortChange={setSort} />
          {!isLoading && (
            <p className="text-sm text-slate-400 flex-shrink-0 sm:hidden">
              <span className="text-white font-semibold">{filteredItems.length}</span>{' '}
              {filteredItems.length !== 1 ? 'items' : 'item'}{' '}
              {hasActiveFilters ? 'found' : 'available'}
            </p>
          )}
        </div>

        <ItemGrid
          items={filteredItems}
          onReset={hasActiveFilters ? () => setFilters(INITIAL_FILTERS) : undefined}
          isLoading={isLoading}
          currentUserId={currentUserId}
          watchedItemIds={watchedItemIds}
          onToggleWatch={session ? handleToggleWatch : undefined}
        />
      </main>

      <Footer />
    </div>
  );
}
