'use client';

import { useState } from 'react';
import AppImage from '@/components/AppImage';
import AddItemModal from '@/components/AddItemModal';
import PostItemModal from '@/components/PostItemModal';
import { InventoryItem } from '@/types/inventoryItem';
import { Location } from '@/types/item';
import { formatCurrency } from '@/lib/utils';
import { deleteAdminItem } from './actions';

interface Props {
  initialItems: InventoryItem[];
  location: Location;
}

export default function AdminInventoryGrid({ initialItems, location }: Props) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function saveItem(item: InventoryItem) {
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const updated = await res.json() as InventoryItem;
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      }
    } catch {}
    setEditingItem(null);
  }

  function onItemCreated(item: InventoryItem) {
    setItems((prev) => [item, ...prev]);
    setShowAddModal(false);
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    const fd = new FormData();
    fd.append('itemId', itemId);
    await deleteAdminItem({}, fd);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setConfirmDeleteId(null);
    setDeletingId(null);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900 rounded-2xl border border-dashed border-slate-700">
          <div className="text-4xl mb-3 opacity-30">📦</div>
          <p className="text-slate-400 text-sm">No items in your inventory yet</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col transition-all ${item.isForTrade ? 'border-slate-800' : 'border-slate-800/40 opacity-60'}`}
          >
            <div className="relative aspect-[3/4] bg-slate-800 overflow-hidden">
              {item.frontImageUrl ? (
                <AppImage src={item.frontImageUrl} alt={item.name} fill className="object-contain" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-2xl">📦</div>
              )}
            </div>
            <div className="p-2.5 space-y-1.5 flex-1">
              <p className="text-xs font-bold text-white leading-tight line-clamp-2">{item.name}</p>
              <p className="text-xs font-bold text-blue-400">{formatCurrency(item.estimatedValue)}</p>
              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.isForTrade ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                {item.isForTrade ? 'For Trade' : 'Not Available'}
              </span>
            </div>
            <div className="px-2.5 pb-2.5 space-y-1.5">
              <button
                onClick={() => setEditingItem(item)}
                className="w-full text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg py-1.5 transition-colors border border-slate-700 hover:border-slate-600"
              >
                ✏️ Edit
              </button>
              {confirmDeleteId === item.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="flex-1 text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg py-1.5 transition-colors disabled:opacity-50"
                  >
                    {deletingId === item.id ? '…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1.5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(item.id)}
                  className="w-full text-[10px] font-semibold text-slate-500 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 rounded-lg py-1.5 transition-colors"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {editingItem && (
        <AddItemModal
          onClose={() => setEditingItem(null)}
          onSave={saveItem}
          existing={editingItem}
        />
      )}

      {showAddModal && (
        <PostItemModal
          onClose={() => setShowAddModal(false)}
          onSave={onItemCreated}
          location={location}
        />
      )}
    </>
  );
}
