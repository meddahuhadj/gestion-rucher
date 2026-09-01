import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hexagon, MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

const strengthColors = {
  VERY_STRONG: 'emerald',
  STRONG: 'green',
  MEDIUM: 'yellow',
  WEAK: 'red',
  VERY_WEAK: 'red',
};

const statusColors = {
  ACTIVE: 'ACTIVE',
  WEAK: 'yellow',
  DEAD: 'red',
  SOLD: 'blue',
  MERGED: 'purple',
  ARCHIVED: 'stone',
};

export const HiveCard = ({ hive, onDelete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/hives/${hive.id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
            hive.status === 'DEAD' ? 'bg-red-100' : hive.status === 'WEAK' ? 'bg-yellow-100' : 'bg-honey-100'
          }`}>
            <Hexagon className={`h-6 w-6 ${
              hive.status === 'DEAD' ? 'text-red-600' : hive.status === 'WEAK' ? 'text-yellow-600' : 'text-honey-600'
            }`} />
          </div>
          <div>
            <p className="font-semibold text-stone-800">{t('dashboard.hiveNumber')}{hive.number}</p>
            {hive.name && <p className="text-sm text-stone-500">{hive.name}</p>}
            {hive.apiary && <p className="text-xs text-stone-400">{hive.apiary.name}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/hives/${hive.id}/edit`); }}
              className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-stone-100 rounded-lg"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(hive); }}
                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <Badge color={statusColors[hive.status] || 'stone'}>{t(`hiveStatus.${hive.status}`)}</Badge>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Badge color={strengthColors[hive.strength] || 'stone'}>{t(`hiveStrength.${hive.strength}`)}</Badge>
        <span className="text-xs text-stone-400">
          {hive.user?.name && <span className="inline-flex items-center gap-1 me-2"><span className="h-4 w-4 rounded-full bg-honey-100 inline-flex items-center justify-center text-[9px] font-bold text-honey-700">{hive.user.name[0]}</span>{hive.user.name}</span>}
          {hive._count?.inspections || 0} فحوصات
        </span>
      </div>
    </Card>
  );
};
