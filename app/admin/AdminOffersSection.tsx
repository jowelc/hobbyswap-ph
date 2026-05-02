'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export type AdminOfferRow = {
  id: string;
  iAmSender: boolean;
  otherDisplayName: string;
  otherUsername: string;
  offeredCount: number;
  requestedCount: number;
  cashDiff: number;
  status: string;
  message: string;
  createdAt: string;
};

type Tab = 'sent' | 'received' | 'accepted' | 'archived';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  accepted:  'bg-green-500/20 text-green-300 border-green-500/30',
  declined:  'bg-red-500/20 text-red-300 border-red-500/30',
  completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

export default function AdminOffersSection({ rows }: { rows: AdminOfferRow[] }) {
  const [tab, setTab] = useState<Tab>('received');

  const tabs: { key: Tab; label: string; data: AdminOfferRow[] }[] = [
    { key: 'sent',     label: 'Sent',     data: rows.filter(r => r.iAmSender && r.status === 'pending') },
    { key: 'received', label: 'Received', data: rows.filter(r => !r.iAmSender && r.status === 'pending') },
    { key: 'accepted', label: 'Accepted', data: rows.filter(r => r.status === 'accepted') },
    { key: 'archived', label: 'Archived', data: rows.filter(r => r.status === 'declined' || r.status === 'completed') },
  ];

  const active = tabs.find(t => t.key === tab)!;

  return (
    <div>
      <div className="flex gap-0.5 mb-4 border-b border-slate-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 -mb-px ${
              tab === t.key
                ? 'border-blue-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500'
            }`}>
              {t.data.length}
            </span>
          </button>
        ))}
      </div>

      {active.data.length === 0 ? (
        <div className="flex items-center justify-center py-10 bg-slate-900 rounded-2xl border border-dashed border-slate-700">
          <p className="text-slate-500 text-sm">No {tab} offers</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_3fr_1fr_1.2fr] gap-4 px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>{tab === 'sent' ? 'To' : 'From'}</span>
            <span>Items / Notes</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {active.data.map((row, idx) => (
            <div
              key={row.id}
              className={`flex flex-col md:grid md:grid-cols-[2fr_3fr_1fr_1.2fr] gap-2 md:gap-4 px-5 py-4 items-start md:items-center ${
                idx !== active.data.length - 1 ? 'border-b border-slate-800/60' : ''
              } hover:bg-slate-800/30 transition-colors`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{row.otherDisplayName}</p>
                <p className="text-xs text-slate-500">@{row.otherUsername}</p>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs text-slate-300">
                  {row.offeredCount} offered &harr; {row.requestedCount} requested
                  {row.cashDiff !== 0 && (
                    <span className={`ml-2 font-semibold ${row.cashDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.cashDiff > 0 ? '+' : ''}{formatCurrency(Math.abs(row.cashDiff))} cash
                    </span>
                  )}
                </p>
                {row.message && (
                  <p className="text-[11px] text-slate-500 truncate max-w-[260px]" title={row.message}>
                    &ldquo;{row.message}&rdquo;
                  </p>
                )}
              </div>

              <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                STATUS_STYLES[row.status] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
              }`}>
                {row.status}
              </span>

              <div>
                <p className="text-xs text-slate-300">{timeAgo(row.createdAt)}</p>
                <p className="text-[10px] text-slate-500">
                  {new Date(row.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
