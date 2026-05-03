'use client';

import { useState, useRef, useEffect } from 'react';
import { InventoryItem } from '@/types/inventoryItem';
import { Category, Condition, TradePreference, Location } from '@/types/item';
import { convertIfHeic } from '@/lib/heic';
import { parsePrice } from '@/lib/utils';

const CATEGORIES: Category[] = [
  'Basketball Cards', 'Pokemon Cards', 'One Piece Cards', 'Football Cards',
  'Baseball Cards', 'MMA Cards', 'WWE Cards', 'Others',
];
const CONDITIONS: Condition[] = ['Raw', 'PSA Graded', 'BGS Graded', 'Other Grading'];
const TRADE_PREFS: TradePreference[] = [
  'Trade Only', 'Cash Only', 'Trade + Cash', 'Open to any offers',
];

const PLACEHOLDER_FRONT = '/card-placeholder-front.svg';

interface AiCard {
  name?: string;
  category?: Category;
  playerName?: string;
  team?: string;
  brand?: string;
  year?: number;
  condition?: Condition;
  estimatedValue?: number;
  description?: string;
  tags?: string[];
}

interface ManualFields {
  name: string;
  category: Category | '';
  condition: Condition | '';
}

const emptyManual: ManualFields = {
  name: '', category: '', condition: '',
};

interface Props {
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  location: Location;
  onChangeLocation?: () => void;
}

type AiStatus = 'idle' | 'loading' | 'success' | 'quota' | 'error';

export default function PostItemModal({ onClose, onSave, location, onChangeLocation }: Props) {
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [storedBase64, setStoredBase64] = useState('');
  const [storedMime, setStoredMime] = useState('');
  const [storedAiBase64, setStoredAiBase64] = useState('');
  const [storedAiMime, setStoredAiMime] = useState('');

  const [estimatedValue, setEstimatedValue] = useState('');
  const userEnteredPriceRef = useRef(false);
  const [tradePreference, setTradePreference] = useState<TradePreference | ''>('');
  const [notes, setNotes] = useState('');

  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [aiCard, setAiCard] = useState<AiCard | null>(null);
  const [aiErrorMsg, setAiErrorMsg] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);

  const [manual, setManual] = useState<ManualFields>(emptyManual);
  const [showManual, setShowManual] = useState(false);

  const [formError, setFormError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const formScrollRef = useRef<HTMLFormElement>(null);

  const [enhancingFront, setEnhancingFront] = useState(false);
  const [enhancingBack, setEnhancingBack] = useState(false);
  const [backBase64, setBackBase64] = useState('');
  const [backMime, setBackMime] = useState('');
  const [enhanceMsg, setEnhanceMsg] = useState<{ which: 'front' | 'back'; text: string; ok: boolean } | null>(null);

  const [frontCloudUrl, setFrontCloudUrl] = useState('');
  const [backCloudUrl, setBackCloudUrl] = useState('');
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Countdown for quota retry
  useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setTimeout(() => setRetryAfter((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [retryAfter]);

  // Scroll to top of form and shake on error
  useEffect(() => {
    if (!formError) return;
    if (formScrollRef.current) formScrollRef.current.scrollTop = 0;
    setShakeError(true);
  }, [formError]);

  function setField<K extends keyof ManualFields>(key: K, value: ManualFields[K]) {
    setManual((m) => ({ ...m, [key]: value }));
  }

  async function runAi(base64: string, mime: string) {
    setAiStatus('loading');
    setAiCard(null);
    setAiErrorMsg('');
    setRetryAfter(0);
    setShowManual(false);

    try {
      const res = await fetch('/api/identify-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
      });

      // Vercel (and some proxies) return plain text for 413/502/etc — not JSON
      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        setAiStatus('error');
        setAiErrorMsg(
          res.status === 413
            ? 'Image too large to process. Please use a smaller photo.'
            : `Server error (${res.status}). Please try again.`
        );
        setShowManual(true);
        return;
      }

      if (!res.ok) {
        if (res.status === 429 || data.errorType === 'quota') {
          setAiStatus('quota');
          // Only use retryAfterSeconds if it's a valid, reasonable value
          const secs = typeof data.retryAfterSeconds === 'number' && data.retryAfterSeconds > 0 && data.retryAfterSeconds <= 86400
            ? data.retryAfterSeconds
            : 0;
          setRetryAfter(secs);
        } else {
          setAiStatus('error');
          setAiErrorMsg((data.error as string) ?? 'AI identification failed.');
        }
        setShowManual(true);
        return;
      }

      setAiCard(data);
      setAiStatus('success');
      setManual({
        name: (data.name as string) ?? '',
        category: (data.category as Category) ?? '',
        condition: (data.condition as Condition) ?? '',
      });
      if (data.estimatedValue && !userEnteredPriceRef.current) {
        setEstimatedValue(String(data.estimatedValue));
      }
    } catch (err: unknown) {
      setAiStatus('error');
      setAiErrorMsg(err instanceof Error ? err.message : 'Network error. Check your connection.');
      setShowManual(true);
    }
  }

  async function uploadToCloud(base64: string, mime: string, which: 'front' | 'back') {
    which === 'front' ? setUploadingFront(true) : setUploadingBack(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
      });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        which === 'front' ? setFrontCloudUrl(url) : setBackCloudUrl(url);
      }
    } catch {
      // silent — error surfaces at submit time
    } finally {
      which === 'front' ? setUploadingFront(false) : setUploadingBack(false);
    }
  }

  async function handleFrontImage(url: string, file: File) {
    setFrontImageUrl(url);
    setFrontCloudUrl('');
    const base64 = await fileToBase64(file);
    setStoredBase64(base64);
    setStoredMime(file.type);

    // Compress to ≤2000px JPEG before uploading to stay under Vercel's 4.5 MB body limit
    const { base64: uploadBase64, mimeType: uploadMime } = await compressForAI(file, 2000);
    void uploadToCloud(uploadBase64, uploadMime, 'front');

    // Compress to ≤1024px JPEG before sending to AI
    const { base64: aiBase64, mimeType: aiMime } = await compressForAI(file);
    setStoredAiBase64(aiBase64);
    setStoredAiMime(aiMime);
    await runAi(aiBase64, aiMime);
  }

  async function handleBackImage(url: string, file: File) {
    setBackImageUrl(url);
    setBackCloudUrl('');
    const base64 = await fileToBase64(file);
    setBackBase64(base64);
    setBackMime(file.type);

    // Compress to ≤2000px JPEG before uploading to stay under Vercel's 4.5 MB body limit
    const { base64: uploadBase64, mimeType: uploadMime } = await compressForAI(file, 2000);
    void uploadToCloud(uploadBase64, uploadMime, 'back');
  }

  async function handleEnhance(which: 'front' | 'back') {
    const base64 = which === 'front' ? storedBase64 : backBase64;
    const mime = which === 'front' ? storedMime : backMime;
    if (!base64) return;

    which === 'front' ? setEnhancingFront(true) : setEnhancingBack(true);
    setEnhanceMsg(null);

    try {
      const res = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
      });

      if (!res.ok) throw new Error('Enhancement failed');

      const { rotation, bgRemovedBase64 } = await res.json() as { rotation: number; bgRemovedBase64: string | null };

      const srcDataUrl = bgRemovedBase64
        ? `data:image/png;base64,${bgRemovedBase64}`
        : `data:${mime};base64,${base64}`;

      const finalUrl = rotation && rotation !== 0
        ? await rotateImageDataUrl(srcDataUrl, rotation)
        : srcDataUrl;

      const enhanced64 = finalUrl.split(',')[1] ?? base64;
      if (which === 'front') {
        setFrontImageUrl(finalUrl);
        setStoredBase64(enhanced64);
        setStoredMime('image/png');
        void uploadToCloud(enhanced64, 'image/png', 'front');
      } else {
        setBackImageUrl(finalUrl);
        setBackBase64(enhanced64);
        setBackMime('image/png');
        void uploadToCloud(enhanced64, 'image/png', 'back');
      }

      const label = bgRemovedBase64 && rotation ? 'Background removed & rotated' : bgRemovedBase64 ? 'Background removed' : rotation ? 'Rotated' : 'Already looks good!';
      setEnhanceMsg({ which, text: label, ok: true });
    } catch (err) {
      setEnhanceMsg({ which, text: err instanceof Error ? err.message : 'Enhancement failed', ok: false });
    } finally {
      which === 'front' ? setEnhancingFront(false) : setEnhancingBack(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const resolvedName      = manual.name      || aiCard?.name      || '';
    const resolvedCategory  = manual.category  || aiCard?.category  || '';
    const resolvedCondition = manual.condition || aiCard?.condition || '';

    if (!frontImageUrl) {
      setFormError('Please upload a front photo of the card.');
      return;
    }
    if (!resolvedName || !resolvedCategory || !resolvedCondition) {
      setFormError('Card name, category, and condition are required.');
      setShowManual(true);
      return;
    }
    if (!estimatedValue) {
      setFormError('Please set an estimated value.');
      return;
    }
    if (!tradePreference) {
      setFormError('Please choose a trade preference.');
      return;
    }
    if (uploadingFront || uploadingBack) {
      setFormError('Image upload still in progress — please wait a moment.');
      return;
    }
    if (!frontCloudUrl) {
      setFormError('Front image failed to upload. Please try selecting it again.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:                   resolvedName,
          category:               resolvedCategory,
          condition:              resolvedCondition,
          estimatedValue:         parsePrice(estimatedValue),
          location,
          tradePreference,
          frontImageUrl:          frontCloudUrl,
          backImageUrl:           backCloudUrl || '',
          description:            aiCard?.description ?? '',
          lookingFor:             '',
          notes:                  notes.trim(),
          cashDifferenceAccepted: tradePreference === 'Trade + Cash' || tradePreference === 'Open to any offers',
          tags:                   aiCard?.tags ?? [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setFormError(err.error ?? 'Failed to save item. Please try again.');
        return;
      }

      const saved = await res.json() as InventoryItem;
      onSave(saved);
    } catch {
      setFormError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Post a Card</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              📍 {location}
              {onChangeLocation && (
                <button type="button" onClick={onChangeLocation} className="ml-1.5 text-blue-400 hover:text-blue-300 underline transition-colors">
                  change
                </button>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} ref={formScrollRef} className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Form error */}
          {formError && (
            <div
              className={`bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 ${shakeError ? 'animate-shake' : ''}`}
              onAnimationEnd={() => setShakeError(false)}
            >
              {formError}
            </div>
          )}

          {/* Photos */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Card Photos</p>
            <div className="flex gap-4 justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <ImageUpload label="Front *" value={frontImageUrl} onChange={handleFrontImage} />
                {frontImageUrl && (
                  <button
                    type="button"
                    onClick={() => handleEnhance('front')}
                    disabled={enhancingFront}
                    className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
                  >
                    {enhancingFront
                      ? <><div className="w-2.5 h-2.5 border border-purple-400 border-t-transparent rounded-full animate-spin" /> Enhancing...</>
                      : '✨ Enhance'}
                  </button>
                )}
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ImageUpload label="Back" value={backImageUrl} onChange={handleBackImage} />
                {backImageUrl && (
                  <button
                    type="button"
                    onClick={() => handleEnhance('back')}
                    disabled={enhancingBack}
                    className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
                  >
                    {enhancingBack
                      ? <><div className="w-2.5 h-2.5 border border-purple-400 border-t-transparent rounded-full animate-spin" /> Enhancing...</>
                      : '✨ Enhance'}
                  </button>
                )}
              </div>
            </div>
            {enhanceMsg && (
              <p className={`text-center text-[10px] mt-2 ${enhanceMsg.ok ? 'text-purple-400' : 'text-red-400'}`}>
                {enhanceMsg.text}
              </p>
            )}
          </div>

          {/* AI: loading */}
          {aiStatus === 'loading' && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-blue-300">Identifying card with AI...</p>
            </div>
          )}

          {/* AI: quota exceeded */}
          {aiStatus === 'quota' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-amber-400">AI identification temporarily unavailable</p>
              <p className="text-xs text-amber-300/70">
                {(() => {
                  const label = formatRetryDelay(retryAfter);
                  if (retryAfter > 0 && label) {
                    return `The free Gemini API quota has been reached. Please try again in ${label}.`;
                  }
                  return 'The free Gemini API quota has been reached. You can still post your item manually.';
                })()}
              </p>
              {retryAfter === 0 && storedAiBase64 && (
                <button
                  type="button"
                  onClick={() => runAi(storedAiBase64, storedAiMime)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Retry AI Identification →
                </button>
              )}
            </div>
          )}

          {/* AI: generic error */}
          {aiStatus === 'error' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-yellow-400">AI identification failed</p>
              <p className="text-xs text-yellow-300/70">{aiErrorMsg}</p>
              {storedAiBase64 && (
                <button
                  type="button"
                  onClick={() => runAi(storedAiBase64, storedAiMime)}
                  className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                >
                  Try again →
                </button>
              )}
            </div>
          )}

          {/* AI: success summary */}
          {aiStatus === 'success' && aiCard && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">AI Detected</span>
                <button
                  type="button"
                  onClick={() => setShowManual((v) => !v)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showManual ? 'Hide details' : '✏️ Edit details'}
                </button>
              </div>
              <p className="text-sm font-bold text-white">{aiCard.name}</p>
              <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
                {aiCard.category && <span className="bg-slate-700 px-2 py-0.5 rounded-full">{aiCard.category}</span>}
                {aiCard.condition && <span className="bg-slate-700 px-2 py-0.5 rounded-full">{aiCard.condition}</span>}
              </div>
            </div>
          )}

          {/* Manual / edit fields */}
          {showManual && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {aiStatus === 'success' ? 'Edit Card Details' : 'Card Details'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className={labelCls}>Card Name</label>
                  <input value={manual.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. LeBron James RC Exquisite" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Category</label>
                  <select value={manual.category} onChange={(e) => setField('category', e.target.value as Category)} className={inputCls}>
                    <option value="">Select...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Condition</label>
                  <select value={manual.condition} onChange={(e) => setField('condition', e.target.value as Condition)} className={inputCls}>
                    <option value="">Select...</option>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notes — always visible */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes / Issues</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Numbered 1/10, slight crease on top-left corner, hologram intact..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Estimated value */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Estimated Value (₱) *</label>
            <input
              type="number"
              min={0}
              required
              value={estimatedValue}
              onChange={(e) => { userEnteredPriceRef.current = true; setEstimatedValue(e.target.value); }}
              placeholder="e.g. 5000"
              className={inputCls}
            />
          </div>

          {/* Trade preference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Trade Preference *</label>
            <div className="grid grid-cols-2 gap-2">
              {TRADE_PREFS.map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setTradePreference(pref)}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-colors text-left ${
                    tradePreference === pref
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl border border-slate-700 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={aiStatus === 'loading' || submitting || uploadingFront || uploadingBack}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : (uploadingFront || uploadingBack) ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
            ) : 'Post Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Resize + re-encode to JPEG so the base64 payload stays well under Vercel's 4.5 MB body limit
function compressForAI(file: File, maxDim = 1024, quality = 0.85): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fileToBase64(file).then((b64) => resolve({ base64: b64, mimeType: file.type }));
    };
    img.src = objectUrl;
  });
}

function ImageUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const converted = await convertIfHeic(file);
    onChange(URL.createObjectURL(converted), converted);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-32 rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-800 transition-colors"
        style={{ aspectRatio: '5/7' }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Change</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-[10px] text-center px-2 leading-tight">Click to upload</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-white text-sm rounded-xl outline-none transition-all placeholder-slate-500';

const labelCls = 'text-[10px] font-semibold text-slate-500 uppercase tracking-wide';

function rotateImageDataUrl(src: string, degrees: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const swap = degrees === 90 || degrees === 270;
      const canvas = document.createElement('canvas');
      canvas.width = swap ? img.height : img.width;
      canvas.height = swap ? img.width : img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function formatRetryDelay(seconds: number | null): string | null {
  if (!seconds || seconds <= 0 || seconds > 86400) return null;
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `about ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  const hours = Math.round(seconds / 3600);
  return `about ${hours} hour${hours !== 1 ? 's' : ''}`;
}
