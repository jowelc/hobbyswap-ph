export type Category =
  | 'Basketball Cards'
  | 'Pokemon Cards'
  | 'One Piece Cards'
  | 'Football Cards'
  | 'Baseball Cards'
  | 'MMA Cards'
  | 'WWE Cards'
  | 'Others';

export type Condition = 'Raw' | 'Graded' | 'Sealed' | 'Used' | 'Brand New';

export type TradePreference =
  | 'Trade Only'
  | 'Trade + Cash'
  | 'Cash Difference Accepted'
  | 'Open to Offers';

export type Location =
  | 'Pampanga'
  | 'Manila'
  | 'Bulacan'
  | 'Cebu'
  | 'Davao'
  | 'Cavite'
  | 'Laguna'
  | 'Others';

export interface Item {
  id: string;
  userId?: string;
  ownerUsername: string;
  ownerLookingFor?: string;
  ownerLocation?: string;
  name: string;
  category: Category;
  playerName?: string;
  team?: string;
  brand?: string;
  year?: number;
  condition: Condition;
  estimatedValue: number;
  location: Location;
  tradePreference: TradePreference;
  description: string;
  lookingFor: string;
  cashDifferenceAccepted: boolean;
  frontImageUrl: string;
  backImageUrl: string;
  createdAt: string;
  tags: string[];
}

export interface FilterState {
  search: string;
  category: Category | '';
  condition: Condition | '';
  tradePreference: TradePreference | '';
  location: Location | '';
}
