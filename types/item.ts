export type Category =
  | 'Basketball Cards'
  | 'Pokemon Cards'
  | 'One Piece Cards'
  | 'Football Cards'
  | 'Baseball Cards'
  | 'MMA Cards'
  | 'WWE Cards'
  | 'Others';

export type Condition = 'Raw' | 'PSA Graded' | 'BGS Graded' | 'Other Grading';

export type TradePreference =
  | 'Trade Only'
  | 'Cash Only'
  | 'Trade + Cash'
  | 'Open to any offers';

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
