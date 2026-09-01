import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { notificationApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Spinner, EmptyState, Button, ConfirmDialog } from '../../components/ui';
import { formatDateTime } from '../../utils/format';

const typeColors = { INFO: 'blue', WARNING: 'yellow', REMINDER: 'honey', TASK_DUE: 'orange', INSPECTION_DUE: 'honey' };

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.list();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await notificationApi.markAllRead();
    load();
  };

  const markOne = async (id) => {
    await notificationApi.markRead(id);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await notificationApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <PageHeader title={t('nav.notifications')} icon={Bell} />

      <div className="mb-4">
        <Button variant="secondary" onClick={markAll}>
          <CheckCheck className="h-4 w-4" /> {t('notifications.markAll')}
        </Button>
      </div>

      {loading ? (
        <Spinner className="py-16" />
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`p-4 ${n.read ? 'opacity-60' : ''}`} onClick={() => !n.read && markOne(n.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                    n.type === 'WARNING' ? 'bg-amber-500' : n.type === 'TASK_DUE' ? 'bg-orange-500' : 'bg-honey-400'
                  }`} />
                  <div>
                    <p className="font-semibold text-stone-800">{n.title}</p>
                    <p className="text-sm text-stone-600">{n.message}</p>
                    <p className="text-xs text-stone-400 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setDeleting(n); }} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title={t('common.delete')} />
    </div>
  );
};
