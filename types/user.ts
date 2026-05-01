export type TrustLevel = 'Verified Pro' | 'Trusted' | 'Rising Trader' | 'New Trader';

export interface Review {
  id: string;
  reviewerUsername: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  tradeItem: string;
  date: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  location: string;
  lookingFor: string;
  tier: 'verified' | 'premium';
  isWhitelisted: boolean;
  isActive: boolean;
  rating: number;
  successfulTrades: number;
  memberSince: string;
  lastLoginAt: string;
  trustLevel: TrustLevel;
  reviews: Review[];
}
