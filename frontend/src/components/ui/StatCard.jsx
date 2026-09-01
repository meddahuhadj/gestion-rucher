import { Card } from './Card.jsx';

export const StatCard = ({ icon: Icon, label, value, color = 'honey', subValue }) => {
  const colors = {
    honey: 'bg-honey-100 text-honey-600 dark:bg-honey-900/40 dark:text-honey-300',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
    stone: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-500 truncate dark:text-stone-400">{label}</p>
          <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{value}</p>
          {subValue && <p className="text-xs text-stone-400">{subValue}</p>}
        </div>
      </div>
    </Card>
  );
};
