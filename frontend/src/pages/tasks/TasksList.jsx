import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Plus, Trash2, Pencil } from 'lucide-react';
import { taskApi, hiveApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Spinner, EmptyState, Badge, Input, Select, Button, Modal, TextArea, ConfirmDialog } from '../../components/ui';
import { formatDate } from '../../utils/format';
import { TASK_TYPE_EMOJIS } from '../../constants';

const statusColors = { TODO: 'TODO', IN_PROGRESS: 'blue', DONE: 'green', POSTPONED: 'yellow', CANCELLED: 'red' };

export const TasksList = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    try {
      const data = await taskApi.list(params);
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { hiveApi.list().then(setHives).catch(() => {}); }, []);

  const openNew = () => {
    const hive = searchParams.get('hive');
    setEditing(null);
    setFormOpen(true);
    if (hive) window.hivePreset = hive;
  };

  const handleSave = async (data) => {
    if (editing) await taskApi.update(editing.id, data);
    else await taskApi.create(data);
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await taskApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <PageHeader title={t('tasks.title')} icon={ClipboardList} onAdd={openNew} addLabel={t('tasks.add')} />

      <Card className="p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('common.all')} — {t('common.status')}</option>
            {['TODO', 'IN_PROGRESS', 'DONE', 'POSTPONED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>{t(`taskStatus.${s}`)}</option>
            ))}
          </Select>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">{t('common.all')} — {t('tasks.priority')}</option>
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((s) => (
              <option key={s} value={s}>{t(`taskPriority.${s}`)}</option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <Spinner className="py-16" />
      ) : tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setViewing(task)} className="flex items-center gap-3 flex-1 text-start">
                  <div className="h-10 w-10 rounded-lg bg-honey-100 flex items-center justify-center text-xl dark:bg-honey-900/40">
                    {task.hive ? TASK_TYPE_EMOJIS[task.type] || '📋' : '📋'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800 dark:text-stone-100">
                      {task.hive ? `${t('dashboard.hiveNumber')}${task.hive.number}` : t('apiaries.title')} — {t(`taskType.${task.type}`)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {formatDate(task.date)} {task.time || ''}
                      {task.description ? ` • ${task.description}` : ''}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <Badge color={task.priority === 'URGENT' ? 'red' : task.priority === 'HIGH' ? 'orange' : task.priority === 'LOW' ? 'stone' : 'blue'}>
                    {t(`taskPriority.${task.priority}`)}
                  </Badge>
                  <Badge color={statusColors[task.status]}>{t(`taskStatus.${task.status}`)}</Badge>
                  <button onClick={() => { setEditing(task); setFormOpen(true); }} className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-stone-100 rounded-lg dark:hover:bg-stone-800">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(task)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {formOpen && (
        <TaskFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initial={editing}
          hives={hives}
          onSubmit={handleSave}
        />
      )}

      {viewing && <TaskDetail task={viewing} onClose={() => setViewing(null)} />}

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title={t('common.delete')} />
    </div>
  );
};

const TaskFormModal = ({ open, onClose, initial, hives, onSubmit }) => {
  const { t } = useTranslation();
  const [type, setType] = useState(initial?.type || 'INSPECTION');
  const [hiveId, setHiveId] = useState(initial?.hiveId || '');
  const [date, setDate] = useState(initial?.date ? formatDate(initial.date).split('/').reverse().join('/') : '');
  const [time, setTime] = useState(initial?.time || '');
  const [priority, setPriority] = useState(initial?.priority || 'NORMAL');
  const [status, setStatus] = useState(initial?.status || 'TODO');
  const [description, setDescription] = useState(initial?.description || '');

  useEffect(() => {
    if (initial?.date) {
      const d = new Date(initial.date);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      setDate(iso);
    }
    if (!initial && window.hivePreset) setHiveId(window.hivePreset);
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type, hiveId: hiveId || null, date, time, priority, status, description });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('tasks.edit') : t('tasks.add')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label={t('tasks.type')} value={type} onChange={(e) => setType(e.target.value)}>
          {Object.keys(t('taskType', { returnObjects: true })).map((k) => (
            <option key={k} value={k}>{TASK_TYPE_EMOJIS[k] || '📋'} {t(`taskType.${k}`)}</option>
          ))}
        </Select>
        <Select label={t('tasks.hive')} value={hiveId} onChange={(e) => setHiveId(e.target.value)}>
          <option value="">{t('apiaries.title')} (بدون خلية)</option>
          {hives.map((h) => <option key={h.id} value={h.id}>{t('dashboard.hiveNumber')}{h.number} {h.name || ''}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input type="date" label={t('tasks.date')} value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="time" label={t('tasks.time')} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label={t('tasks.priority')} value={priority} onChange={(e) => setPriority(e.target.value)}>
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{t(`taskPriority.${p}`)}</option>)}
          </Select>
          <Select label={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value)}>
            {['TODO', 'IN_PROGRESS', 'DONE', 'POSTPONED', 'CANCELLED'].map((s) => <option key={s} value={s}>{t(`taskStatus.${s}`)}</option>)}
          </Select>
        </div>
        <TextArea label={t('tasks.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

const TaskDetail = ({ task, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal open onClose={onClose} title={t(`taskType.${task.type}`)}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge color={task.priority === 'URGENT' ? 'red' : 'stone'}>{t(`taskPriority.${task.priority}`)}</Badge>
          <Badge color={task.status}>{t(`taskStatus.${task.status}`)}</Badge>
        </div>
        <p><span className="text-stone-500 dark:text-stone-400">{t('common.hive')}: </span>
          <span className="font-medium dark:text-stone-200">{task.hive ? t('dashboard.hiveNumber') + task.hive.number : t('apiaries.title')}</span>
        </p>
        <p><span className="text-stone-500 dark:text-stone-400">{t('tasks.date')}: </span><span className="font-medium dark:text-stone-200">{formatDate(task.date)} {task.time || ''}</span></p>
        {task.description && (
          <p className="text-stone-600 bg-stone-50 rounded-lg p-3 dark:text-stone-300 dark:bg-stone-800">{task.description}</p>
        )}
      </div>
    </Modal>
  );
};
