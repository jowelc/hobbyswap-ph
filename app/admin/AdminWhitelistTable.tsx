'use client';

import { useState, useMemo } from 'react';
import AppImage from '@/components/AppImage';
import SetTierButton from './SetTierButton';
import DeleteWhitelistButton from './DeleteWhitelistButton';

export type UserRow = {
  kind: 'user';
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  tier: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  itemCount: number;
};

export type PendingRow = {
  kind: 'pending';
  email: string;
  addedAt: string;
};

export type WhitelistRow = UserRow | PendingRow;

type Filter = 'all' | 'premium' | 'verified' | 'pending';
type Sort = 'default' | 'recent_login' | 'most_items';

interface Props {
  rows: WhitelistRow[];
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}


export default function AdminWhitelistTable({ rows }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('default');

  const filtered = useMemo(() => {
    let r = [...rows];
    if (filter === 'premium') r = r.filter((row) => row.kind === 'user' && row.tier === 'premium');
    if (filter === 'verified') r = r.filter((row) => row.kind === 'user' && row.tier !== 'premium');
    if (filter === 'pending') r = r.filter((row) => row.kind === 'pending');

    if (sort === 'recent_login') {
      r.sort((a, b) => {
        const aTime = a.kind === 'user' && a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const bTime = b.kind === 'user' && b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return bTime - aTime;
      });
    } else if (sort === 'most_items') {
      r.sort((a, b) => {
        const aCount = a.kind === 'user' ? a.itemCount : 0;
        const bCount = b.kind === 'user' ? b.itemCount : 0;
        return bCount - aCount;
      });
    }

    return r;
  }, [rows, filter, sort]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-0.5 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
          {(['all', 'premium', 'verified', 'pending'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'premium' ? '★ Premium' : f === 'verified' ? '✓ Verified' : 'Pending'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
          <span className="text-xs text-slate-500 px-2 font-medium">Sort:</span>
          {([
            ['default', 'Default'],
            ['recent_login', 'Recent Login'],
            ['most_items', 'Most Items'],
          ] as [Sort, string][]).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setSort(s as Sort)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                sort === s
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_3.5rem_8.5rem_6rem] gap-4 px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Trader</span>
          <span>Email</span>
          <span>Status</span>
          <span>Joined</span>
          <span>Items</span>
          <span>Tier</span>
          <span></span>
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-slate-500">No users match this filter.</div>
        )}

        {filtered.map((row, idx) => (
          <div
            key={row.kind === 'user' ? row.id : row.email}
            className={`flex flex-col md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_3.5rem_8.5rem_6rem] gap-2 md:gap-4 px-5 py-4 items-start md:items-center ${
              idx !== filtered.length - 1 ? 'border-b border-slate-800/60' : ''
            } hover:bg-slate-800/30 transition-colors`}
          >
            {/* Trader */}
            {row.kind === 'user' ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                  {row.avatarUrl ? (
                    <AppImage src={row.avatarUrl} alt={row.displayName} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                      {row.displayName[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-white block truncate">{row.displayName || row.username}</span>
                  <span className="text-xs text-slate-500">@{row.username}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-400 truncate block">{row.email}</span>
                  <span className="text-xs text-slate-600">Invited — no account yet</span>
                </div>
              </div>
            )}

            {/* Email */}
            <span className="text-xs text-slate-400 truncate min-w-0">
              {row.kind === 'user' ? row.email : row.email}
            </span>

            {/* Status */}
            {row.kind === 'user' ? (
              row.isActive ? (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-green-400">Active</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 pl-3">{timeAgo(row.lastLoginAt)}</p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-red-400">Not Active Yet</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                <span className="text-xs text-slate-500">Pending invite</span>
              </div>
            )}

            {/* Joined */}
            <span className="text-xs text-slate-400">
              {row.kind === 'user' ? formatDateTime(row.createdAt) : formatDateTime(row.addedAt)}
            </span>

            {/* Items */}
            <span className="text-xs font-bold text-slate-300">
              {row.kind === 'user' ? row.itemCount : <span className="text-slate-600">—</span>}
            </span>

            {/* Tier */}
            <div className="flex items-center">
              {row.kind === 'user' ? (
                <SetTierButton userId={row.id} currentTier={row.tier} />
              ) : (
                <span className="text-xs text-slate-600">—</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center">
              <DeleteWhitelistButton
                email={row.kind === 'user' ? row.email : row.email}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
