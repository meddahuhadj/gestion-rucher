import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui';
import { useGlove } from '../../context/GloveContext';
import { AssistantPanel } from '../../assistant/AssistantPanel';
import { AssistantGloveView } from '../../assistant/AssistantGloveView';

export const AssistantPage = () => {
  const { t } = useTranslation();
  const { glove } = useGlove();

  if (glove) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title={t('assistant.title')} subtitle={t('assistant.subtitle')} icon={Bot} />
        <Card className="overflow-hidden">
          <div className="h-[calc(100vh-14rem)] min-h-[520px]">
            <AssistantGloveView />
          </div>
        </Card>
      </div>
    );
  }

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
