'use client';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search cards, players, teams, brands, sellers...',
}: Props) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-400 text-sm outline-none transition-all"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-3 flex items-center px-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
