'use client';

interface Props {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export default function RatingStars({ rating, size = 'sm', showNumber = true }: Props) {
  const starSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span className={`${starSize} text-yellow-400`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {rating >= star ? '★' : rating >= star - 0.5 ? '½' : '☆'}
          </span>
        ))}
      </span>
      {showNumber && (
        <span className="text-slate-400 font-medium">{rating.toFixed(1)}</span>
      )}
    </span>
  );
}
