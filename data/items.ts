import { Item } from '@/types/item';

export const items: Item[] = [];

export function getItemById(_id: string): Item | undefined {
  return undefined;
}

export function getItemsByUsername(_username: string): Item[] {
  return [];
}

export function searchItems(
  list: Item[],
  query: string,
  category: string,
  condition: string,
  tradePreference: string,
  location: string,
): Item[] {
  return list.filter((item) => {
    if (category && item.category !== category) return false;
    if (condition && item.condition !== condition) return false;
    if (tradePreference && item.tradePreference !== tradePreference) return false;
    if (location && item.location !== location) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.playerName?.toLowerCase().includes(q) ?? false) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });
}
