'use client';

import { useState } from 'react';
import { deleteNotification } from './actions';

export type AdminNotifRow = {
  id: string;
  type: string;
  actorDisplayName: string;
  actorUsername: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

const TYPE_STYLES: Record<string, string> = {
  offer_received:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  offer_accepted:  'bg-green-500/20 text-green-300 border-green-500/30',
  offer_declined:  'bg-red-500/20 text-red-300 border-red-500/30',
  offer_retracted: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  deal_done:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

function typeLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminNotificationsSection({ initialNotifs }: { initialNotifs: AdminNotifRow[] }) {
  const [notifs, setNotifs] = useState(initialNotifs);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const fd = new FormData();
    fd.append('notifId', id);
    await deleteNotification({}, fd);
    setNotifs(prev => prev.filter(n => n.id !== id));
    setConfirmId(null);
    setDeletingId(null);
  }

  if (notifs.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 bg-slate-900 rounded-2xl border border-dashed border-slate-700">
        <p className="text-slate-500 text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="hidden md:grid grid-cols-[auto_2.5fr_1.5fr_1fr_auto] gap-4 px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        <span>Type</span>
        <span>Message</span>
        <span>From</span>
        <span>Date</span>
        <span></span>
      </div>
      {notifs.map((n, idx) => (
        <div
          key={n.id}
          className={`flex flex-col md:grid md:grid-cols-[auto_2.5fr_1.5fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 items-start md:items-center ${
            idx !== notifs.length - 1 ? 'border-b border-slate-800/60' : ''
          } ${n.readAt ? 'opacity-50' : ''} hover:opacity-100 hover:bg-slate-800/30 transition-all`}
        >
          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
            TYPE_STYLES[n.type] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
          }`}>
            {typeLabel(n.type)}
          </span>

          <p className="text-xs text-slate-300 truncate max-w-full" title={n.body}>
            {n.body || '—'}
          </p>

          <div>
            <p className="text-xs font-semibold text-white">{n.actorDisplayName}</p>
            <p className="text-[10px] text-slate-500">@{n.actorUsername}</p>
          </div>

          <div>
            <p className="text-xs text-slate-300">{timeAgo(n.createdAt)}</p>
            <p className="text-[10px] text-slate-500">
              {new Date(n.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {confirmId === n.id ? (
            <div className="flex gap-1 items-center">
              <button
                onClick={() => handleDelete(n.id)}
                disabled={deletingId === n.id}
                className="text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
              >
                {deletingId === n.id ? '…' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(n.id)}
              className="text-[10px] font-semibold text-slate-500 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
