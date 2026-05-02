'use client';

import { useState, useEffect, useRef } from 'react';
import AppImage from './AppImage';
import { useSession } from 'next-auth/react';

interface ApiMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
}

interface Props {
  offerId: string;
  traderUserId: string;
  traderUsername: string;
  traderDisplayName?: string;
  traderAvatar: string;
  tradeContext?: string;
  onClose: () => void;
}

export default function ChatModal({ offerId, traderUserId, traderUsername, traderDisplayName, traderAvatar, tradeContext, onClose }: Props) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | null)?.id;

  const [msgs, setMsgs] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetching = useRef(false);

  async function fetchMessages() {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(`/api/messages?offerId=${offerId}`);
      if (res.ok) setMsgs(await res.json());
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function postMessage(body: { offerId: string; toUserId: string; text: string; imageUrl?: string }) {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const msg = await res.json() as ApiMessage;
    setMsgs((prev) => [...prev, msg]);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await postMessage({ offerId, toUserId: traderUserId, text });
    } finally {
      setSending(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json() as { url: string };

      await postMessage({ offerId, toUserId: traderUserId, text: '', imageUrl: url });
    } finally {
      setUploadingImage(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[500px]">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
              {traderAvatar ? (
                <AppImage src={traderAvatar} alt={traderDisplayName ?? traderUsername} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                  {(traderDisplayName || traderUsername)[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">@{traderUsername}</p>
              {tradeContext && (
                <p className="text-[11px] text-slate-500 truncate">{tradeContext}</p>
              )}
            </div>
            <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : msgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
                <span className="text-3xl">💬</span>
                <p className="text-sm">No messages yet. Say hi!</p>
              </div>
            ) : (
              msgs.map((msg) => {
                const isMe = msg.fromUserId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl overflow-hidden text-sm leading-relaxed ${
                      msg.imageUrl
                        ? 'bg-transparent p-0'
                        : isMe
                          ? 'bg-blue-600 text-white rounded-br-sm px-3.5 py-2'
                          : 'bg-slate-800 text-slate-200 rounded-bl-sm px-3.5 py-2'
                    }`}>
                      {msg.imageUrl ? (
                        <button
                          onClick={() => setLightboxUrl(msg.imageUrl!)}
                          className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.imageUrl}
                            alt="Payment screenshot"
                            className="max-w-full max-h-56 object-contain rounded-xl"
                          />
                          <p className={`text-xs mt-1 px-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </button>
                      ) : (
                        <>
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-slate-800 flex-shrink-0">
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || sending}
              title="Send payment screenshot"
              className="p-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl transition-colors flex-shrink-0"
            >
              {uploadingImage ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Payment screenshot"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
