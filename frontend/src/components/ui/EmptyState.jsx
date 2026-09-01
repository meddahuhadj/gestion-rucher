import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ message, icon: Icon = Inbox }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-stone-400">
      <Icon className="h-12 w-12 mb-3" />
      <p>{message || t('common.noData')}</p>
    </div>
  );
};
