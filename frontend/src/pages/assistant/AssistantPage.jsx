import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui';
import { AssistantPanel } from '../../assistant/AssistantPanel';

export const AssistantPage = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t('assistant.title')} subtitle={t('assistant.subtitle')} icon={Bot} />
      <Card>
        <CardBody className="h-[calc(100vh-16rem)] min-h-[420px]">
          <AssistantPanel variant="page" />
        </CardBody>
      </Card>
      <p className="text-xs text-stone-400 mt-3 px-1">{t('assistant.privacyNote')}</p>
    </div>
  );
};
