import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { useTranslation } from 'react-i18next';

export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText, danger = true }) => {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title || t('common.confirmDelete')} size="sm">
      <p className="text-stone-600 mb-5">{message || t('common.confirmDelete')}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmText || t('common.delete')}
        </Button>
      </div>
    </Modal>
  );
};
