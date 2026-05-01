'use client';

import { TrustLevel } from '@/types/user';

interface Props {
  level: TrustLevel;
  size?: 'sm' | 'md';
}

const config: Record<TrustLevel, { label: string; color: string; icon: string }> = {
  'Verified Pro': { label: 'Verified Pro', color: 'text-yellow-400', icon: '★' },
  'Trusted': { label: 'Trusted', color: 'text-blue-400', icon: '✓' },
  'Rising Trader': { label: 'Rising Trader', color: 'text-purple-400', icon: '↑' },
  'New Trader': { label: 'New Trader', color: 'text-slate-400', icon: '○' },
};

export default function TrustBadge({ level, size = 'sm' }: Props) {
  const { label, color, icon } = config[level];
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} font-semibold ${color}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
