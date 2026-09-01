import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button.jsx';

export const PageHeader = ({ title, subtitle, onAdd, addLabel, icon: Icon }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-honey-100 flex items-center justify-center">
            <Icon className="h-5 w-5 text-honey-600" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-stone-800">{title}</h1>
          {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
        </div>
      </div>
      {onAdd && (
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          {addLabel || t('common.add')}
        </Button>
      )}
    </div>
  );
};
