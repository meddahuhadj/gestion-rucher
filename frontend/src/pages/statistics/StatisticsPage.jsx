import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { statsApi } from '../../api';
import { Card, CardHeader, CardBody, Spinner, EmptyState, StatCard } from '../../components/ui';
import { formatMoney } from '../../utils/format';

const PIE_COLORS = ['#10b981', '#facc15', '#f97316', '#ef4444', '#64748b', '#8b5cf6', '#3b82f6'];

export const StatisticsPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await statsApi.overview();
        setStats(d);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner className="py-16" />;
  if (!stats) return <EmptyState />;

  const statusData = Object.entries(stats.statusDist).map(([k, v]) => ({ name: t(`hiveStatus.${k}`), value: v }));
  const strengthData = Object.entries(stats.strengthDist).map(([k, v]) => ({ name: t(`hiveStrength.${k}`), value: v }));
  const catData = Object.entries(stats.byCategory).map(([k, v]) => ({ name: t(`expenseCategory.${k}`), value: v }));
  const typeData = Object.entries(stats.byType).map(([k, v]) => ({ name: t(`revenueType.${k}`), value: v }));
  const producerData = stats.producerHives.slice(0, 8).map((h) => ({ name: t('dashboard.hiveNumber') + h.number, value: h.total }));

  const activeHives = Object.entries(stats.strengthDist).reduce((s, [k, v]) => (k === 'ACTIVE' ? v : k === true ? v : s), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-800">📊 {t('statistics.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label={t('dashboard.totalHives')} value={stats.hives} color="honey" />
        <StatCard icon={BarChart3} label={t('harvests.totalProduction')} value={`${stats.honeyProduction} kg`} color="emerald" />
        <StatCard icon={BarChart3} label={t('harvests.averageProduction')} value={`${stats.averageProduction.toFixed(1)} kg`} color="green" />
        <StatCard icon={BarChart3} label={t('finances.netProfit')} value={formatMoney(stats.netProfit)} color={stats.netProfit >= 0 ? 'emerald' : 'red'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-stone-800">{t('statistics.financialTrend')}</h2></CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="expenses" name={t('finances.expenses')} fill="#f43f5e" radius={[4,4,0,0]} />
                <Bar dataKey="revenues" name={t('finances.revenues')} fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-stone-800">{t('statistics.hiveStatus')}</h2></CardHeader>
          <CardBody className="h-72">
            {statusData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-stone-800">{t('statistics.hiveStrength')}</h2></CardHeader>
          <CardBody className="h-72">
            {strengthData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={strengthData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {strengthData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-stone-800">{t('statistics.expensesByCategory')}</h2></CardHeader>
          <CardBody className="h-72">
            {catData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-stone-800">{t('statistics.revenuesByType')}</h2></CardHeader>
          <CardBody className="h-72">
            {typeData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-stone-800">{t('statistics.producerHives')}</h2></CardHeader>
          <CardBody className="h-72">
            {producerData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={producerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="kg" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
