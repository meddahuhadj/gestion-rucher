import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react';
import { Modal, Input, Button } from '../components/ui';

export const ApiKeyDialog = ({ open, onClose, onSave }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    onSave(value.trim());
    setValue('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('assistant.apiKeyTitle')} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('assistant.apiKeyHelp')}{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-honey-600 hover:underline dark:text-honey-400"
          >
            Google AI Studio
          </a>
          .
        </p>
        <Input
          type="password"
          autoFocus
          placeholder={t('assistant.apiKeyPlaceholder')}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit}>
            <KeyRound className="h-4 w-4" /> {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
