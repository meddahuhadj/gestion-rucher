const colors = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  WEAK: 'bg-yellow-100 text-yellow-700',
  DEAD: 'bg-red-100 text-red-700',
  SOLD: 'bg-blue-100 text-blue-700',
  MERGED: 'bg-purple-100 text-purple-700',
  ARCHIVED: 'bg-stone-200 text-stone-600',
  VERY_STRONG: 'bg-emerald-100 text-emerald-700',
  STRONG: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  VERY_WEAK: 'bg-red-100 text-red-700',
  TODO: 'bg-stone-100 text-stone-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  POSTPONED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-500',
  LOW: 'bg-stone-100 text-stone-600',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export const Badge = ({ children, color = 'default' }) => {
  const cls = colors[color] || 'bg-stone-100 text-stone-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ value }) => {
  return <Badge color={value}>{value}</Badge>;
};
