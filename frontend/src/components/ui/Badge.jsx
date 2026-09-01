const colors = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  WEAK: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  DEAD: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  SOLD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  MERGED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  ARCHIVED: 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300',
  VERY_STRONG: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  STRONG: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  VERY_WEAK: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  TODO: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  POSTPONED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  CANCELLED: 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-300',
  LOW: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const Badge = ({ children, color = 'default' }) => {
  const cls = colors[color] || 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ value }) => {
  return <Badge color={value}>{value}</Badge>;
};
