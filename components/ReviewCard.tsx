'use client';

import Image from 'next/image';
import { Review } from '@/types/user';
import RatingStars from './RatingStars';
import { formatDate } from '@/lib/utils';

interface Props {
  review: Review;
}

export default function ReviewCard({ review }: Props) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-start gap-3">
        <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-slate-700">
          <Image
            src={review.reviewerAvatar}
            alt={review.reviewerUsername}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">@{review.reviewerUsername}</span>
            <RatingStars rating={review.rating} size="sm" showNumber={false} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Trade: <span className="text-slate-300">{review.tradeItem}</span> · {formatDate(review.date)}
          </p>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}
