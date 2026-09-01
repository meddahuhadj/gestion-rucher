import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Hexagon, ArrowRight, Plus, Crown, MapPin, Calendar, Pencil,
  Search, ClipboardList, Wallet, Image as ImageIcon, Trash2, Briefcase,
} from 'lucide-react';
import { hiveApi, inspectionApi, taskApi, queenApi, expenseApi, revenueApi, harvestApi } from '../../api';
import { Card, CardHeader, CardBody, Badge, Spinner, EmptyState, Button, ConfirmDialog } from '../../components/ui';
import { formatDate, formatMoney, toInputDate } from '../../utils/format';

const statusColors = { ACTIVE: 'ACTIVE', WEAK: 'yellow', DEAD: 'red', SOLD: 'blue', MERGED: 'purple', ARCHIVED: 'stone' };
const strengthColors = { VERY_STRONG: 'emerald', STRONG: 'green', MEDIUM: 'yellow', WEAK: 'red', VERY_WEAK: 'red' };

const TABS = ['info', 'history', 'inspections', 'tasks', 'queens', 'finances'];

export const HiveDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [hive, setHive] = useState(null);
  const [history, setHistory] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [queens, setQueens] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, insp, tk, q] = await Promise.all([
        hiveApi.get(id),
        inspectionApi.list({ hiveId: id }),
        taskApi.list({ hiveId: id }),
        queenApi.list({ hiveId: id }),
      ]);
      setHive(h);
      setInspections(insp);
      setTasks(tk);
      setQueens(q);
      setHistory(buildHistory(insp, tk));
      loadFinances();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadFinances = async () => {
    try {
      const [ex, re, ha] = await Promise.all([
        expenseApi.list({ hiveId: id }),
        revenueApi.list({ hiveId: id }),
        harvestApi.list({ hiveId: id }),
      ]);
      setExpenses(ex);
      setRevenues(re);
      setHarvests(ha);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, [load]);

  const buildHistory = (insp, tk) => {
    const items = [];
    insp.forEach((i) => items.push({
      date: new Date(i.date),
      icon: '🐝',
      title: t('inspections.title'),
      text: i.observations || '',
      type: 'inspection',
      id: i.id,
    }));
    tk.forEach((task) => items.push({
      date: new Date(task.date),
      icon: '🔧',
      title: t(`taskType.${task.type}`),
      text: task.description || '',
      type: 'task',
      id: task.id,
    }));
    return items.sort((a, b) => b.date - a.date);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'inspection') await inspectionApi.remove(deleteTarget.id);
    else await taskApi.remove(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  if (loading) return <Spinner className="py-16" />;
  if (!hive) return <EmptyState />;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0);

  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className="text-sm font-medium text-stone-800 mt-0.5 dark:text-stone-100">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/hives')} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
          <ArrowRight className="h-4 w-4" /> {t('common.back')}
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/hives/${id}/edit`)}>
            <Pencil className="h-4 w-4" /> {t('common.edit')}
          </Button>
          <Button onClick={() => navigate(`/inspections/new?hive=${id}`)}>
            <Search className="h-4 w-4" /> {t('inspections.add')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        {hive.photo ? (
          <img src={hive.photo} alt="hive" className="h-24 w-24 rounded-2xl object-cover" />
        ) : (
          <div className="h-24 w-24 rounded-2xl bg-honey-100 flex flex-col items-center justify-center text-honey-500 dark:bg-honey-900/40 dark:text-honey-400">
            <Hexagon className="h-10 w-10" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('dashboard.hiveNumber')}{hive.number}</h1>
            {hive.name && <span className="text-stone-500 dark:text-stone-400">— {hive.name}</span>}
            <Badge color={statusColors[hive.status]}>{t(`hiveStatus.${hive.status}`)}</Badge>
            <Badge color={strengthColors[hive.strength]}>{t(`hiveStrength.${hive.strength}`)}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-stone-500 flex-wrap dark:text-stone-400">
            {hive.apiary && (
              <span className="flex items-center gap-1"><Warehouse className="h-4 w-4" /> {hive.apiary.name}</span>
            )}
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {t('hives.lastInspection')}: {formatDate(hive.lastInspection)}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {t('hives.nextInspection')}: {formatDate(hive.nextInspection)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 overflow-x-auto scrollbar-thin dark:bg-stone-800">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              tab === tabKey ? 'bg-white text-honey-700 shadow-sm dark:bg-stone-700 dark:text-honey-300' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            {t(`hives.${tabKey === 'info' ? 'detail' : tabKey}`)}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-stone-800 mb-4 dark:text-stone-100">{t('hives.detail')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label={t('hives.number')} value={hive.number} />
              <InfoField label={t('hives.name')} value={hive.name} />
              <InfoField label={t('hives.origin')} value={hive.origin} />
              <InfoField label={t('hives.type')} value={hive.type} />
              <InfoField label={t('hives.beeRace')} value={hive.beeRace} />
              <InfoField label={t('hives.lastInspection')} value={formatDate(hive.lastInspection)} />
              <InfoField label={t('hives.nextInspection')} value={formatDate(hive.nextInspection)} />
              <InfoField label={t('common.date')} value={formatDate(hive.createdAt)} />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-stone-800 mb-4 dark:text-stone-100">👑 {t('hives.queenPresent')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label={t('hives.queenPresent')} value={hive.queenPresent ? t('common.yes') : t('common.no')} />
              <InfoField label={t('hives.queenAge')} value={hive.queenAge ? `${hive.queenAge} ${t('queens.age')}` : '—'} />
              <InfoField label={t('queens.introductionDate')} value={formatDate(hive.queenIntroDate)} />
            </div>
          </Card>
          {hive.notes && (
            <Card className="p-5 md:col-span-2">
              <h3 className="font-semibold text-stone-800 mb-2 dark:text-stone-100">{t('hives.notes')}</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">{hive.notes}</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'history' && (
        <Card className="p-6">
          {history.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="relative ps-6 border-s-2 border-stone-100 space-y-6 dark:border-stone-800">
              {history.map((item, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -start-[35px] top-0 text-lg">{item.icon}</span>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-stone-800 dark:text-stone-100">{item.title}</p>
                    <span className="text-sm text-stone-400">{formatDate(item.date)}</span>
                  </div>
                  {item.text && <p className="text-sm text-stone-600 mt-1 dark:text-stone-400">{item.text}</p>}
                  <div className="mt-2 flex gap-2">
                    <Link to={item.type === 'inspection' ? `/inspections/${item.id}` : `/tasks/${item.id}`} className="text-xs text-honey-600 hover:underline dark:text-honey-400">
                      {t('common.view')}
                    </Link>
                    <button onClick={() => setDeleteTarget(item)} className="text-xs text-red-500 hover:underline">
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'inspections' && (
        <div className="space-y-3">
          <Button onClick={() => navigate(`/inspections/new?hive=${id}`)}><Plus className="h-4 w-4" /> {t('inspections.add')}</Button>
          {inspections.length === 0 ? <EmptyState /> : inspections.map((insp) => (
            <Link to={`/inspections/${insp.id}`} key={insp.id}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-stone-800 dark:text-stone-100">{formatDate(insp.date)} {insp.time || ''}</p>
                  <Badge color={strengthColors[insp.strength]}>{t(`hiveStrength.${insp.strength}`)}</Badge>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400">{insp.observations || '—'}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-3">
          <Button onClick={() => navigate(`/tasks/new?hive=${id}`)}><Plus className="h-4 w-4" /> {t('tasks.add')}</Button>
          {tasks.length === 0 ? <EmptyState /> : tasks.map((task) => (
            <Link to={`/tasks/${task.id}`} key={task.id}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-stone-800 dark:text-stone-100">{t(`taskType.${task.type}`)}</p>
                  <Badge color={task.status} >{t(`taskStatus.${task.status}`)}</Badge>
                </div>
                <p className="text-sm text-stone-400 mt-1">{formatDate(task.date)} {task.time || ''}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'queens' && (
        <div className="space-y-3">
          <Button onClick={() => navigate(`/queens/new?hive=${id}`)}><Plus className="h-4 w-4" /> {t('queens.add')}</Button>
          {queens.length === 0 ? <EmptyState /> : queens.map((queen) => (
            <Card key={queen.id} className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-amber-500" />
                <div className="flex-1">
                  <p className="font-semibold text-stone-800 dark:text-stone-100">{queen.race || '—'}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{queen.origin || ''} • {queen.age ? `${queen.age} ${t('queens.age')}` : ''}</p>
                </div>
                <span className="text-sm text-stone-400">{formatDate(queen.introductionDate)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'finances' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-red-50 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300">{t('finances.totalExpenses')}</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatMoney(totalExpenses, hive.currency)}</p>
            </Card>
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('finances.totalRevenues')}</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatMoney(totalRevenues)}</p>
            </Card>
            <Card className="p-4 bg-honey-50 dark:bg-honey-900/30">
              <p className="text-sm text-honey-700 dark:text-honey-300">{t('finances.netProfit')}</p>
              <p className="text-lg font-bold text-honey-700 dark:text-honey-300">{formatMoney(totalRevenues - totalExpenses)}</p>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold text-stone-800 mb-3 dark:text-stone-100">🍯 {t('harvests.title')}</h3>
              {harvests.length === 0 ? <EmptyState /> : harvests.map((h) => (
                <div key={h.id} className="flex justify-between py-2 border-b border-stone-50 last:border-0 dark:border-stone-800">
                  <span className="dark:text-stone-300">{formatDate(h.date)} — {h.honeyType || ''}</span>
                  <span className="font-medium dark:text-stone-200">{h.quantity || h.weight || 0} kg</span>
                </div>
              ))}
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold text-stone-800 mb-3 dark:text-stone-100">{t('finances.expenses')}</h3>
              {expenses.length === 0 ? <EmptyState /> : expenses.slice(0, 10).map((e) => (
                <div key={e.id} className="flex justify-between py-2 border-b border-stone-50 last:border-0 dark:border-stone-800">
                  <span className="dark:text-stone-300">{formatDate(e.date)} — {t(`expenseCategory.${e.category}`)}</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{formatMoney(e.amount)}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
      />
    </div>
  );
};
