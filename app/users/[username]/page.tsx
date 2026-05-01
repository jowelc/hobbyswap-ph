'use client';

import { use, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UserProfileHeader from '@/components/UserProfileHeader';
import HighlightedItem from '@/components/HighlightedItem';
import ItemCard from '@/components/ItemCard';
import ReviewCard from '@/components/ReviewCard';
import Footer from '@/components/Footer';
import { Item } from '@/types/item';
import { User } from '@/types/user';

interface PageProps {
  params: Promise<{ username: string }>;
}

interface ApiResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    email: string;
    isWhitelisted: boolean;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  };
  items: Array<Record<string, unknown>>;
}

function toUserShape(u: ApiResponse['user']): User {
  return {
    id:               u.id,
    username:         u.username,
    displayName:      u.displayName || u.username,
    email:            u.email,
    avatarUrl:        u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
    bio:              (u as Record<string, unknown>).bio as string || '',
    location:         (u as Record<string, unknown>).location as string || 'Philippines',
    lookingFor:       (u as Record<string, unknown>).lookingFor as string || 'No preference',
    isVerified:       false,
    isWhitelisted:    u.isWhitelisted,
    isActive:         u.isActive,
    rating:           0,
    successfulTrades: 0,
    memberSince:      u.createdAt,
    lastLoginAt:      u.lastLoginAt ?? u.createdAt,
    trustLevel:       'New Trader',
    reviews:          [],
  };
}

function toItemShape(r: Record<string, unknown>, username: string): Item {
  return {
    id:                     r.id as string,
    ownerUsername:          username,
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
  };
}

export default function UserPage({ params }: PageProps) {
  const { username } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState('');

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<ApiResponse>;
      })
      .then((data) => {
        if (!data) return;
        const mapped = data.items.map((i) => toItemShape(i, username));
        setUser(toUserShape(data.user));
        setUserItems(mapped);
        const itemParam = searchParams.get('item');
        const initial = mapped.find((i) => i.id === itemParam) ?? mapped[0];
        setHighlightedItemId(initial?.id ?? '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  function selectItem(id: string) {
    setHighlightedItemId(id);
    router.replace(`/users/${username}?item=${id}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar showSearch={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar showSearch={false} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
          <div className="text-6xl mb-4 opacity-30">👤</div>
          <h2 className="text-2xl font-black text-white mb-2">Trader not found</h2>
          <p className="text-slate-400 mb-6">
            The trader <span className="text-white">@{username}</span> does not exist or has been removed.
          </p>
          <Link href="/" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors">
            Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const highlightedItem = userItems.find((i) => i.id === highlightedItemId) ?? userItems[0];
  const otherItems = userItems.filter((i) => i.id !== highlightedItem?.id);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar showSearch={false} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-white transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-slate-300">@{user.username}</span>
          {highlightedItem && (
            <>
              <span>/</span>
              <span className="text-slate-300 truncate max-w-[200px]">{highlightedItem.name}</span>
            </>
          )}
        </nav>

        <UserProfileHeader user={user} />

        {highlightedItem ? (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Selected Item</h2>
            <HighlightedItem
              item={highlightedItem}
              ownerUserId={user.id}
              ownerUsername={user.username}
              ownerAvatar={user.avatarUrl}
              ownerLookingFor={user.lookingFor}
              isVerified={user.isVerified}
              isOwner={session?.user?.email === user.email}
            />
          </div>
        ) : (
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-10 text-center">
            <p className="text-slate-400">This trader has no items listed yet.</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="text-2xl flex-shrink-0">🔒</div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Trade Safely with HobbySwap PH</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                For high-value trades or first-time trades with new traders, we recommend using our{' '}
                <span className="text-blue-400 font-medium">Escrow Service</span>. Both parties send items to a
                trusted middleman before the trade is completed.
              </p>
            </div>
          </div>
        </div>

        {otherItems.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-4">
              More from <span className="text-blue-400">@{user.username}</span>
              <span className="text-slate-500 font-normal text-sm ml-2">({otherItems.length} item{otherItems.length !== 1 ? 's' : ''})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {otherItems.map((item) => (
                <div key={item.id} onClick={() => selectItem(item.id)} className="cursor-pointer">
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {user.reviews.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-4">
              Trade Reviews
              <span className="text-slate-500 font-normal text-sm ml-2">({user.reviews.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
