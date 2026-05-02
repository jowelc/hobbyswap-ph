'use client';

import { Item } from '@/types/item';
import ItemCard from './ItemCard';
import EmptyState from './EmptyState';

interface Props {
  items: Item[];
  onReset?: () => void;
  isLoading?: boolean;
  currentUserId?: string;
  watchedItemIds?: Set<string>;
  onToggleWatch?: (itemId: string) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl overflow-hidden animate-pulse">
      <div className="p-3 pb-0">
        <div className="aspect-[5/7] w-full bg-slate-700/50 rounded-xl" />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-700/50 rounded w-3/4" />
        <div className="h-3 bg-slate-700/50 rounded w-1/2" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-slate-700/50 rounded-full w-16" />
          <div className="h-5 bg-slate-700/50 rounded-full w-20" />
        </div>
        <div className="h-3 bg-slate-700/50 rounded w-full" />
        <div className="h-3 bg-slate-700/50 rounded w-4/5" />
      </div>
    </div>
  );
}

export default function ItemGrid({ items, onReset, isLoading = false, currentUserId, watchedItemIds, onToggleWatch }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState onReset={onReset} />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          isOwner={Boolean(currentUserId && item.userId === currentUserId)}
          isWatched={watchedItemIds?.has(item.id) ?? false}
          onToggleWatch={() => onToggleWatch?.(item.id)}
        />
      ))}
    </div>
  );
}
