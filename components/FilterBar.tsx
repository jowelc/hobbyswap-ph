'use client';

import { Category, Condition, TradePreference, Location, FilterState } from '@/types/item';

const CATEGORIES: Category[] = [
  'Basketball Cards',
  'Pokemon Cards',
  'One Piece Cards',
  'Football Cards',
  'Baseball Cards',
  'MMA Cards',
  'WWE Cards',
  'Others',
];

const CONDITIONS: Condition[] = ['Raw', 'Graded', 'Sealed', 'Used', 'Brand New'];

const TRADE_PREFS: TradePreference[] = [
  'Trade Only',
  'Cash Only',
  'Trade + Cash',
  'Open to any offers',
];

const LOCATIONS: Location[] = [
  'Pampanga',
  'Manila',
  'Bulacan',
  'Cebu',
  'Davao',
  'Cavite',
  'Laguna',
  'Others',
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'value-high', label: 'Value: High to Low' },
  { value: 'value-low', label: 'Value: Low to High' },
] as const;

export type SortOption = typeof SORT_OPTIONS[number]['value'];

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  options: T[];
  onChange: (v: T | '') => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | '')}
      className="text-sm bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-white rounded-lg px-3 py-2 outline-none transition-all cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[right_10px_center] bg-no-repeat"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export default function FilterBar({ filters, onChange, sort, onSortChange }: Props) {
  const activeCount = [
    filters.category,
    filters.condition,
    filters.tradePreference,
    filters.location,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <Select
        label="All Categories"
        value={filters.category}
        options={CATEGORIES}
        onChange={(v) => onChange({ ...filters, category: v })}
      />
      <Select
        label="Condition"
        value={filters.condition}
        options={CONDITIONS}
        onChange={(v) => onChange({ ...filters, condition: v })}
      />
      <Select
        label="Trade Preference"
        value={filters.tradePreference}
        options={TRADE_PREFS}
        onChange={(v) => onChange({ ...filters, tradePreference: v })}
      />
      <Select
        label="Location"
        value={filters.location}
        options={LOCATIONS}
        onChange={(v) => onChange({ ...filters, location: v })}
      />
      {activeCount > 0 && (
        <button
          onClick={() =>
            onChange({ search: filters.search, category: '', condition: '', tradePreference: '', location: '' })
          }
          className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear {activeCount}
        </button>
      )}

      {/* Sort — pushed to right */}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:block">Sort:</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="text-sm bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-blue-500 text-white rounded-lg px-3 py-2 outline-none transition-all cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[right_10px_center] bg-no-repeat"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
