'use client';

interface Props {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export default function EmptyState({
  title = 'No items found',
  message = 'Try adjusting your search or filters to find what you\'re looking for.',
  onReset,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-6xl mb-4 opacity-30">🔍</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-sm mb-6">{message}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
