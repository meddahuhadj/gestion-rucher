import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Hexagon, TrendingUp, TrendingDown, Wallet, Activity, Search, Plus,
  ClipboardList, AlertTriangle, Calendar, Droplets,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { statsApi } from '../api';
import { Spinner, Card, CardHeader, CardBody, Badge, EmptyState, StatCard } from '../components/ui';
import { formatDate, formatMoney } from '../utils/format';

const PIE_COLORS = ['#10b981', '#facc15', '#ef4444', '#64748b'];

export const Dashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await statsApi.dashboard();
        setData(d);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner className="py-20" />;
  if (!data) return <EmptyState />;

  const { hiveCounts, finances, upcomingTasks, overdueTasks, needsInspection, recentInspections, monthlyTrend } = data;

  const statusPie = [
    { name: t('dashboard.strongHives'), value: hiveCounts.strong, color: '#10b981' },
    { name: t('dashboard.mediumHives'), value: hiveCounts.medium, color: '#facc15' },
    { name: t('dashboard.weakHives'), value: hiveCounts.weak, color: '#f97316' },
    { name: t('dashboard.deadHives'), value: hiveCounts.dead, color: '#ef4444' },
  ].filter((i) => i.value > 0);

  const priorityColor = {
    LOW: 'stone', NORMAL: 'blue', HIGH: 'orange', URGENT: 'red',
  };

  const PRIORITY_EMOJI = { LOW: '🟢', NORMAL: '🔵', HIGH: '🟠', URGENT: '🔴' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t('dashboard.title')} 🐝</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{new Date().toLocaleDateString('ar-DZ')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/hives/new" className="inline-flex items-center gap-1.5 px-3 py-2 bg-honey-500 text-white text-sm rounded-lg hover:bg-honey-600">
            <Plus className="h-4 w-4" /> {t('dashboard.addHive')}
          </Link>
          <Link to="/inspections/new" className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-700 text-sm rounded-lg hover:bg-stone-200 border border-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 dark:border-stone-700">
            <Search className="h-4 w-4" /> {t('dashboard.addInspection')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard icon={Hexagon} label={t('dashboard.totalHives')} value={hiveCounts.total} color="honey" />
        <StatCard icon={Activity} label={t('dashboard.strongHives')} value={hiveCounts.strong} color="green" />
        <StatCard icon={Activity} label={t('dashboard.mediumHives')} value={hiveCounts.medium} color="yellow" />
        <StatCard icon={Activity} label={t('dashboard.weakHives')} value={hiveCounts.weak} color="red" />
        <StatCard icon={Calendar} label={t('dashboard.deadHives')} value={hiveCounts.dead} color="stone" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={TrendingDown} label={t('dashboard.totalExpenses')} value={formatMoney(finances.totalExpenses)} color="red" />
        <StatCard icon={TrendingUp} label={t('dashboard.totalRevenues')} value={formatMoney(finances.totalRevenues)} color="emerald" />
        <StatCard icon={Wallet} label={t('dashboard.netProfit')} value={formatMoney(finances.netProfit)} color={finances.netProfit >= 0 ? 'emerald' : 'red'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.monthlyTrend')}</h2>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="expenses" name={t('dashboard.totalExpenses')} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenues" name={t('dashboard.totalRevenues')} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('statistics.hiveStatus')}</h2>
          </CardHeader>
          <CardBody className="h-72">
            {statusPie.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={90} label>
                    {statusPie.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">📅 {t('dashboard.upcomingTasks')}</h2>
            <Link to="/tasks" className="text-sm text-honey-600 hover:underline dark:text-honey-400">{t('common.view')}</Link>
          </CardHeader>
          <CardBody>
            {upcomingTasks.length === 0 ? (
              <EmptyState message={t('dashboard.noUpcoming')} />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {upcomingTasks.map((task) => (
                  <Link to={`/tasks/${task.id}`} key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 border border-stone-100 dark:hover:bg-stone-800 dark:border-stone-800">
                    <span className="text-xl">{task.hive ? `🐝` : '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate dark:text-stone-100">
                        {task.hive ? `${t('dashboard.hiveNumber')}${task.hive.number}` : t('apiaries.title')} — {t(`taskType.${task.type}`)}
                      </p>
                      <p className="text-xs text-stone-400">{formatDate(task.date)} {task.time || ''}</p>
                    </div>
                    <Badge color={priorityColor[task.priority] || 'stone'}>
                      {PRIORITY_EMOJI[task.priority]} {t(`taskPriority.${task.priority}`)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.needsInspection')}</h2>
          </CardHeader>
          <CardBody>
            {needsInspection.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {needsInspection.map((hive) => (
                  <Link to={`/hives/${hive.id}`} key={hive.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 border border-stone-100 dark:hover:bg-stone-800 dark:border-stone-800">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-100">{t('dashboard.hiveNumber')}{hive.number} {hive.name || ''}</p>
                      <p className="text-xs text-stone-400">{hive.lastInspection ? `${t('hives.lastInspection')}: ${formatDate(hive.lastInspection)}` : t('common.noData')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.recentInspections')}</h2>
          </CardHeader>
          <CardBody>
            {recentInspections.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {recentInspections.map((insp) => (
                  <Link key={insp.id} to={`/hives/${insp.hiveId}`} className="block p-3 rounded-xl hover:bg-stone-50 border border-stone-100 dark:hover:bg-stone-800 dark:border-stone-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.hiveNumber')}{insp.hive?.number}</p>
                      <span className="text-xs text-stone-400">{formatDate(insp.date)}</span>
                    </div>
                    <p className="text-sm text-stone-600 mt-1 line-clamp-2 dark:text-stone-400">{insp.observations || '—'}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-800 dark:text-stone-100">⚠️ {t('dashboard.overdueTasks')}</h2>
          </CardHeader>
          <CardBody>
            {overdueTasks.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {overdueTasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
                    <span className="text-xl">{task.hive ? '🐝' : '📋'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">{t(`taskType.${task.type}`)}</p>
                      <p className="text-xs text-red-400">{formatDate(task.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
