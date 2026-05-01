'use client';

import AppImage from './AppImage';
import { User } from '@/types/user';
import RatingStars from './RatingStars';
import TrustBadge from './TrustBadge';
import TierBadge from './TierBadge';
import { formatMemberSince } from '@/lib/utils';

interface Props {
  user: User;
}

export default function UserProfileHeader({ user }: Props) {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-700 relative">
            <AppImage
              src={user.avatarUrl}
              alt={user.displayName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div
            className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800 ${
              user.tier === 'premium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            title={user.tier === 'premium' ? 'Premium Trader' : 'Verified Trader'}
          >
            {user.tier === 'premium' ? '★' : '✓'}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
            <TierBadge tier={user.tier} />
            <TrustBadge level={user.trustLevel} />
          </div>

          <p className="text-sm text-slate-400">@{user.username}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <RatingStars rating={user.rating} size="sm" />
              <span className="text-slate-400 text-xs">({user.reviews.length} reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-green-400 font-semibold text-base">{user.successfulTrades}</span>
              <span className="text-xs">successful trades</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">📍 {user.location}</span>
            <span className="flex items-center gap-1">📅 Member since {formatMemberSince(user.memberSince)}</span>
          </div>

          {user.lookingFor && (
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1 text-xs text-blue-300 font-medium">
              <span className="text-blue-400">🔍</span>
              Looking for: <span className="text-white">{user.lookingFor}</span>
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed pt-1">{user.bio}</p>
        </div>
      </div>
    </div>
  );
}
