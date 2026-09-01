import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Card, Spinner, EmptyState, Modal, Badge } from '../../components/ui';
import { taskApi } from '../../api';
import { formatDate, toInputDate } from '../../utils/format';
import { TASK_TYPE_EMOJIS } from '../../constants';

export const CalendarPage = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewingDay, setViewingDay] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const all = await taskApi.list();
        setTasks(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tasksByDate = {};
  tasks.forEach((task) => {
    const key = toInputDate(task.date);
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  });

  const selectedKey = toInputDate(selectedDate);
  const dayTasks = tasksByDate[selectedKey] || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">📅 {t('calendar.title')}</h1>

      {loading ? (
        <Spinner className="py-16" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <style>{`
              .react-calendar { border: none; width: 100%; font-family: inherit; background: transparent; }
              .react-calendar__tile { position: relative; }
              .react-calendar__navigation button { font-weight: 600; }
              .dark .react-calendar, .dark .react-calendar__month-view__weekdays, .dark .react-calendar__tile, .dark .react-calendar__navigation button,
              .dark .react-calendar__month-view__weekdays__weekday { background: transparent; color: #e7e5e4; }
              .dark .react-calendar__tile:enabled:hover, .dark .react-calendar__tile:enabled:focus { background: #44403c; }
              .dark .react-calendar__navigation__label, .dark .react-calendar__navigation__arrow { color: #e7e5e4; }
              .dark .react-calendar__tile--active { background: #b45309; color: white; }
              .dark .react-calendar__tile--now { background: #292524; }
              .dark .react-calendar__month-view__weekdays__weekday abbr { color: #a8a29e; }
            `}</style>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={({ date }) => {
                const key = toInputDate(date);
                const items = tasksByDate[key];
                if (!items) return null;
                const ul = items.filter((tt) => tt.priority === 'URGENT');
                return (
                  <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                    {ul.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                    {items.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-honey-400" />}
                  </div>
                );
              }}
              locale={t('calendar.month') ? undefined : undefined}
            />
          </Card>

          <div>
            <h2 className="font-semibold text-stone-800 mb-3 dark:text-stone-100">
              {formatDate(selectedDate)} ({dayTasks.length})
            </h2>
            {dayTasks.length === 0 ? (
              <EmptyState message={t('calendar.noEvents')} />
            ) : (
              <div className="space-y-2">
                {dayTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 bg-white dark:bg-stone-900 dark:border-stone-800">
                    <span className="text-xl">{task.hive ? TASK_TYPE_EMOJIS[task.type] || '🐝' : '📋'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800 dark:text-stone-100">
                        {task.hive ? `${t('dashboard.hiveNumber')}${task.hive.number}` : t('apiaries.title')} — {t(`taskType.${task.type}`)}
                      </p>
                      <p className="text-xs text-stone-400">{task.time || ''} {task.description ? ` • ${task.description}` : ''}</p>
                    </div>
                    <Badge color={task.priority === 'URGENT' ? 'red' : task.priority === 'HIGH' ? 'orange' : 'stone'}>
                      {t(`taskPriority.${task.priority}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
