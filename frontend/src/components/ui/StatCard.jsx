import { Card } from './Card.jsx';

export const StatCard = ({ icon: Icon, label, value, color = 'honey', subValue }) => {
  const colors = {
    honey: 'bg-honey-100 text-honey-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    stone: 'bg-stone-100 text-stone-600',
    green: 'bg-green-100 text-green-600',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-500 truncate">{label}</p>
          <p className="text-lg font-bold text-stone-800">{value}</p>
          {subValue && <p className="text-xs text-stone-400">{subValue}</p>}
        </div>
      </div>
    </Card>
  );
};
