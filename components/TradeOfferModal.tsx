'use client';

import { useState, useEffect } from 'react';
import AppImage from './AppImage';
import { Item } from '@/types/item';
import { InventoryItem } from '@/types/inventoryItem';
import { formatCurrency } from '@/lib/utils';

interface ItemSlim {
  id: string;
  name: string;
  estimatedValue: number;
  frontImageUrl: string;
}

interface Props {
  targetItem: Item | null;
  targetUserId: string;
  targetUsername: string;
  targetLookingFor?: string;
  initialCashDiff?: number;
  initialTheirItems?: ItemSlim[];
  initialMyItems?: ItemSlim[];
  replaceOfferId?: string;
  onSent?: () => void;
  onClose: () => void;
}

interface CardSlim {
  id: string;
  name: string;
  estimatedValue: number;
  frontImageUrl: string;
}

function toSlim(item: Item | InventoryItem): CardSlim {
  return {
    id:             item.id,
    name:           item.name,
    estimatedValue: Number(item.estimatedValue),
    frontImageUrl:  item.frontImageUrl,
  };
}

function CardThumb({
  card,
  selected,
  locked,
  onClick,
}: {
  card: CardSlim;
  selected: boolean;
  locked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      title={card.name}
      style={{ width: 58, aspectRatio: '5/7' }}
      className={`relative flex-shrink-0 snap-start rounded-xl overflow-hidden border-2 transition-all ${
        locked
          ? 'border-blue-400 cursor-default'
          : selected
          ? 'border-blue-500 ring-1 ring-blue-500/40'
          : 'border-slate-700 hover:border-slate-500 cursor-pointer'
      }`}
    >
      <AppImage
        src={card.frontImageUrl || '/card-placeholder-front.svg'}
        alt={card.name}
        fill
        className="object-contain bg-slate-800"
        unoptimized
      />
      {selected && (
        <div className={`absolute inset-0 flex items-end justify-center pb-1 ${locked ? 'bg-blue-400/10' : 'bg-blue-500/25'}`}>
          <span className="text-[9px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-full leading-none">
            {locked ? '★' : '✓'}
          </span>
        </div>
      )}
    </button>
  );
}

const inputCls =
  'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-slate-500';

export default function TradeOfferModal({ targetItem, targetUserId, targetUsername, targetLookingFor, initialCashDiff, initialTheirItems, initialMyItems, replaceOfferId, onSent, onClose }: Props) {
  const isCounter = !!(initialTheirItems?.length || initialMyItems?.length);

  const [mySelected,      setMySelected]     = useState<CardSlim[]>(initialMyItems ?? []);
  const [theirSelected,   setTheirSelected]  = useState<CardSlim[]>(
    initialTheirItems ?? (targetItem ? [toSlim(targetItem)] : [])
  );
  const [myItems,         setMyItems]        = useState<InventoryItem[]>([]);
  const [theirOtherItems, setTheirOtherItems] = useState<CardSlim[]>([]);
  const [theirExpanded,   setTheirExpanded]  = useState(false);
  const [loadingMy,       setLoadingMy]      = useState(true);
  const [loadingTheirs,   setLoadingTheirs]  = useState(isCounter);
  const [cashDiff,        setCashDiff]       = useState(initialCashDiff ? String(Math.abs(initialCashDiff)) : '');
  const [cashDirection,   setCashDirection]  = useState<'me' | 'them'>((initialCashDiff ?? 0) < 0 ? 'them' : 'me');
  const [message,         setMessage]        = useState('');
  const [submitted,       setSubmitted]      = useState(false);
  const [submitting,      setSubmitting]     = useState(false);

  useEffect(() => {
    fetch('/api/items/mine')
      .then((r) => r.json())
      .then((data: InventoryItem[]) =>
        setMyItems(Array.isArray(data) ? data.filter((i) => i.isForTrade) : [])
      )
      .catch(() => setMyItems([]))
      .finally(() => setLoadingMy(false));
  }, []);

  // In counter mode, auto-load the other user's full inventory so all cards are visible immediately
  useEffect(() => {
    if (!isCounter) return;
    fetch(`/api/items?username=${targetUsername}`)
      .then((r) => r.json())
      .then((data: Array<Record<string, unknown>>) => {
        setTheirOtherItems(
          (Array.isArray(data) ? data : []).map((r): CardSlim => ({
            id:             r.id as string,
            name:           r.name as string,
            estimatedValue: Number(r.estimatedValue),
            frontImageUrl:  r.frontImageUrl as string,
          }))
        );
        setTheirExpanded(true);
      })
      .catch(() => {})
      .finally(() => setLoadingTheirs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleTheirExpanded() {
    if (theirExpanded) { setTheirExpanded(false); return; }
    if (theirOtherItems.length > 0) { setTheirExpanded(true); return; }
    setLoadingTheirs(true);
    try {
      const res  = await fetch(`/api/items?username=${targetUsername}`);
      const data: Array<Record<string, unknown>> = await res.json();
      const mapped = (Array.isArray(data) ? data : [])
        .filter((r) => !targetItem || r.id !== targetItem.id)
        .map((r): CardSlim => ({
          id:             r.id as string,
          name:           r.name as string,
          estimatedValue: Number(r.estimatedValue),
          frontImageUrl:  r.frontImageUrl as string,
        }));
      setTheirOtherItems(mapped);
      setTheirExpanded(true);
    } finally {
      setLoadingTheirs(false);
    }
  }

  function toggleMy(card: CardSlim) {
    setMySelected((prev) =>
      prev.find((c) => c.id === card.id) ? prev.filter((c) => c.id !== card.id) : [...prev, card]
    );
  }

  function toggleTheir(card: CardSlim) {
    if (targetItem && card.id === targetItem.id) return;
    setTheirSelected((prev) =>
      prev.find((c) => c.id === card.id) ? prev.filter((c) => c.id !== card.id) : [...prev, card]
    );
  }

  const myTotal        = mySelected.reduce((s, c) => s + c.estimatedValue, 0);
  const theirTotal     = theirSelected.reduce((s, c) => s + c.estimatedValue, 0);
  const cash           = Number(cashDiff) || 0;
  const myEffective    = myTotal   + (cashDirection === 'me'   ? cash : 0);
  const theirEffective = theirTotal + (cashDirection === 'them' ? cash : 0);
  const diff           = theirEffective - myEffective;
  const isCashOnly     = mySelected.length === 0 && cash > 0 && cashDirection === 'me';
  const canSubmit      = mySelected.length > 0 || isCashOnly;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId:         targetUserId,
          offeredItemIds:   mySelected.map((c) => c.id),
          requestedItemIds: theirSelected.map((c) => c.id),
          cashDiff:         cashDirection === 'me' ? cash : -cash,
          message,
          replaceOfferId,
        }),
      });
      onSent?.();
    } catch {
      setSubmitting(false);
    }
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white">Make a Trade Offer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {submitted ? (
            <div className="text-center py-12 px-5 space-y-3">
              <div className="text-5xl">🤝</div>
              <h3 className="text-lg font-bold text-white">Offer Sent!</h3>
              <p className="text-sm text-slate-400">
                Your trade offer has been sent to <span className="text-blue-400">@{targetUsername}</span>.
              </p>
              <p className="text-xs text-slate-500">They&apos;ll review and respond shortly.</p>
              <button onClick={onClose} className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">

              {/* ── Two-sided trade board ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Their side */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Their cards</p>
                    {theirSelected.length > 0 && (
                      <p className="text-[11px] text-blue-400 font-semibold">{formatCurrency(theirTotal)}</p>
                    )}
                  </div>

                  {/* Selected summary row (non-counter only — in counter mode items show highlighted in picker) */}
                  {!isCounter && (
                    <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                      {targetItem && <CardThumb card={toSlim(targetItem)} selected locked />}
                      {theirSelected
                        .filter((c) => !targetItem || c.id !== targetItem.id)
                        .map((c) => (
                          <CardThumb key={c.id} card={c} selected onClick={() => toggleTheir(c)} />
                        ))}
                      {theirSelected.length === 0 && !targetItem && (
                        <p className="text-[11px] text-slate-500 italic py-2">Pick cards below</p>
                      )}
                    </div>
                  )}

                  {!isCounter && targetItem && (
                    <div>
                      <p className="text-xs font-semibold text-white line-clamp-1">{targetItem.name}</p>
                      <p className="text-xs text-blue-400">{formatCurrency(Number(targetItem.estimatedValue))}</p>
                    </div>
                  )}

                  {targetLookingFor && targetLookingFor !== 'No preference' && (
                    <p className="text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 leading-tight">
                      🔍 {targetLookingFor}
                    </p>
                  )}

                  {/* Expand button (non-counter) */}
                  {!isCounter && (
                    <button
                      type="button"
                      onClick={toggleTheirExpanded}
                      disabled={loadingTheirs}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                    >
                      {loadingTheirs ? (
                        <><span className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />Loading…</>
                      ) : theirExpanded ? '▴ Hide cards' : '▾ See all cards'}
                    </button>
                  )}

                  {/* Full picker (counter = always visible, non-counter = expanded) */}
                  {(isCounter || theirExpanded) && (
                    loadingTheirs ? (
                      <div className="flex gap-2">
                        {[0,1,2].map((i) => (
                          <div key={i} className="flex-shrink-0 rounded-xl bg-slate-800 animate-pulse" style={{ width: 58, aspectRatio: '5/7' }} />
                        ))}
                      </div>
                    ) : theirOtherItems.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-1">No items.</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                        {theirOtherItems.map((c) => (
                          <CardThumb
                            key={c.id}
                            card={c}
                            selected={theirSelected.some((s) => s.id === c.id)}
                            onClick={() => toggleTheir(c)}
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>

                {/* My side */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Your offer</p>
                    {mySelected.length > 0 && (
                      <p className="text-[11px] text-green-400 font-semibold">{formatCurrency(myTotal)}</p>
                    )}
                  </div>

                  {loadingMy ? (
                    <div className="flex gap-2">
                      {[0,1,2].map((i) => (
                        <div key={i} className="flex-shrink-0 rounded-xl bg-slate-800 animate-pulse" style={{ width: 58, aspectRatio: '5/7' }} />
                      ))}
                    </div>
                  ) : myItems.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-2">No items for trade.</p>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                      {myItems.map((item) => {
                        const slim = toSlim(item);
                        return (
                          <CardThumb
                            key={item.id}
                            card={slim}
                            selected={mySelected.some((c) => c.id === item.id)}
                            onClick={() => toggleMy(slim)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {mySelected.length > 0 && (
                    <p className="text-[11px] text-slate-400">
                      {mySelected.length} card{mySelected.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>

              {/* ── Value comparison bar ── */}
              {canSubmit && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
                  {/* Their thumbnails stack */}
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex -space-x-3">
                      {theirSelected.slice(0, 3).map((c) => (
                        <div key={c.id} className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-800" style={{ width: 36, aspectRatio: '5/7' }}>
                          <AppImage src={c.frontImageUrl || '/card-placeholder-front.svg'} alt={c.name} fill className="object-contain" unoptimized />
                        </div>
                      ))}
                      {theirSelected.length > 3 && (
                        <div className="relative rounded-lg border border-slate-600 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300" style={{ width: 36, aspectRatio: '5/7' }}>
                          +{theirSelected.length - 3}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-black text-blue-400">{formatCurrency(theirEffective)}</p>
                    {cash > 0 && cashDirection === 'them' && (
                      <p className="text-[10px] text-blue-600">incl. {formatCurrency(cash)} cash</p>
                    )}
                    <p className="text-[10px] text-slate-500">Getting</p>
                  </div>

                  {/* Center diff */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      diff === 0
                        ? 'bg-slate-700 text-slate-300 border-slate-600'
                        : diff > 0
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}>
                      {diff === 0 ? 'Even' : diff > 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`}
                    </span>
                  </div>

                  {/* My thumbnails stack */}
                  <div className="flex-1 flex flex-col items-center gap-1">
                    {isCashOnly ? (
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 text-lg">
                        💵
                      </div>
                    ) : (
                      <div className="flex -space-x-3">
                        {mySelected.slice(0, 3).map((c) => (
                          <div key={c.id} className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-800" style={{ width: 36, aspectRatio: '5/7' }}>
                            <AppImage src={c.frontImageUrl || '/card-placeholder-front.svg'} alt={c.name} fill className="object-contain" unoptimized />
                          </div>
                        ))}
                        {mySelected.length > 3 && (
                          <div className="relative rounded-lg border border-slate-600 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300" style={{ width: 36, aspectRatio: '5/7' }}>
                            +{mySelected.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm font-black text-green-400">{formatCurrency(myEffective)}</p>
                    {cash > 0 && cashDirection === 'me' && (
                      <p className="text-[10px] text-green-600">{isCashOnly ? 'cash only' : `incl. ${formatCurrency(cash)} cash`}</p>
                    )}
                    <p className="text-[10px] text-slate-500">Giving</p>
                  </div>
                </div>
              )}

              {diff > 0 && canSubmit && cashDirection === 'me' && (
                <p className="text-[11px] text-amber-400/80 text-center -mt-3">
                  Their side is {formatCurrency(diff)} higher — consider adding cash.
                </p>
              )}

              {/* ── Cash difference ── */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Cash difference <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
                  <input
                    type="number"
                    min={0}
                    value={cashDiff}
                    onChange={(e) => setCashDiff(e.target.value)}
                    placeholder="0"
                    className={`${inputCls} pl-8`}
                  />
                </div>
                <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-full sm:w-fit">
                  <button
                    type="button"
                    onClick={() => setCashDirection('me')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-colors ${
                      cashDirection === 'me' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    You add
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashDirection('them')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-colors ${
                      cashDirection === 'them' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    They add
                  </button>
                </div>
              </div>

              {/* ── Message ── */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi @${targetUsername}! I'd like to trade...`}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {submitting
                  ? 'Sending…'
                  : !canSubmit
                  ? 'Select cards or add cash to offer'
                  : isCashOnly
                  ? `🤝 Send Cash Offer — ₱${cash.toLocaleString()}`
                  : `🤝 Send Offer — ${mySelected.length} for ${theirSelected.length}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
