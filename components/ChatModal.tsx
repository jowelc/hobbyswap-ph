'use client';

import { useState, useEffect, useRef } from 'react';
import AppImage from './AppImage';
import { useSession } from 'next-auth/react';

interface ApiMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: string;
}

interface Props {
  traderUserId: string;
  traderUsername: string;
  traderAvatar: string;
  onClose: () => void;
}

export default function ChatModal({ traderUserId, traderUsername, traderAvatar, onClose }: Props) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | null)?.id;

  const [msgs, setMsgs] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);

  async function fetchMessages() {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(`/api/messages?withUserId=${traderUserId}`);
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
  }, [traderUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: traderUserId, text }),
      });
      await fetchMessages();
    } finally {
      setSending(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[500px]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700">
            <AppImage src={traderAvatar} alt={traderUsername} fill className="object-cover" unoptimized />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">@{traderUsername}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white transition-colors p-1">
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
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-slate-800 flex-shrink-0">
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
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
