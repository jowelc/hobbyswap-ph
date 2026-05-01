interface Props {
  tier: string;
  size?: 'sm' | 'md';
}

export default function TierBadge({ tier, size = 'sm' }: Props) {
  const base = size === 'md'
    ? 'text-sm px-2.5 py-0.5 rounded-full font-bold border'
    : 'text-xs px-2 py-0.5 rounded-full font-semibold border';

  if (tier === 'premium') {
    return (
      <span className={`${base} bg-amber-500/20 text-amber-300 border-amber-500/30`}>
        ★ Premium
      </span>
    );
  }

  return (
    <span className={`${base} bg-emerald-500/20 text-emerald-300 border-emerald-500/30`}>
      ✓ Verified
    </span>
  );
}
