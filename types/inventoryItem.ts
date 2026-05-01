import { Category, Condition, TradePreference, Location } from './item';

export interface InventoryItem {
  id: string;
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
  notes: string;
  cashDifferenceAccepted: boolean;
  frontImageUrl: string;
  backImageUrl: string;
  isForTrade: boolean;
  addedAt: string;
  tags: string[];
}
