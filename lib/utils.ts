export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
  });
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getConditionColor(condition: string): string {
  switch (condition) {
    case 'Graded': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
    case 'Sealed': return 'bg-green-500/20 text-green-300 border border-green-500/30';
    case 'Brand New': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    case 'Raw': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    case 'Used': return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  }
}

export function getTradePrefColor(pref: string): string {
  switch (pref) {
    case 'Trade Only': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    case 'Trade + Cash': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    case 'Cash Difference Accepted': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    case 'Open to Offers': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
    default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  }
}
