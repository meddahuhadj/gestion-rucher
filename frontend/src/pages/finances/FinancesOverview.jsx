import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingDown, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { expenseApi, revenueApi, hiveApi, statsApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody, Spinner, EmptyState, Button, Modal, Input, Select, TextArea, ConfirmDialog, StatCard } from '../../components/ui';
import { formatDate, formatMoney } from '../../utils/format';

const TABS = ['overview', 'expenses', 'revenues'];

export const FinancesOverview = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expForm, setExpForm] = useState(false);
  const [revForm, setRevForm] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [editingRev, setEditingRev] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, ex, re] = await Promise.all([
        statsApi.overview(),
        expenseApi.list(),
        revenueApi.list(),
      ]);
      setStats(s);
      setExpenses(ex);
      setRevenues(re);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { hiveApi.list().then(setHives).catch(() => {}); }, []);

  const handleSaveExpense = async (data) => {
    if (editingExp) await expenseApi.update(editingExp.id, data);
    else await expenseApi.create(data);
    setExpForm(false);
    setEditingExp(null);
    load();
  };

  const handleSaveRevenue = async (data) => {
    if (editingRev) await revenueApi.update(editingRev.id, data);
    else await revenueApi.create(data);
    setRevForm(false);
    setEditingRev(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    if (deleting.type === 'expense') await expenseApi.remove(deleting.id);
    else await revenueApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <PageHeader title={t('finances.title')} icon={Wallet} />

      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-5 w-fit">
        {TABS.map((tk) => (
          <button key={tk} onClick={() => setTab(tk)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === tk ? 'bg-white text-honey-700 shadow-sm' : 'text-stone-500'}`}>
            {t(`finances.${tk}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner className="py-16" />
      ) : tab === 'overview' && stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={TrendingDown} label={t('finances.totalExpenses')} value={formatMoney(stats.totalExpenses)} color="red" />
            <StatCard icon={TrendingUp} label={t('finances.totalRevenues')} value={formatMoney(stats.totalRevenues)} color="emerald" />
            <StatCard icon={Wallet} label={t('finances.netProfit')} value={formatMoney(stats.netProfit)} color={stats.netProfit >= 0 ? 'emerald' : 'red'} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-stone-500">{t('finances.monthly')} {t('finances.expenses')}</p>
              <p className="font-bold text-stone-800">{formatMoney(stats.monthlyExpense)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-stone-500">{t('finances.monthly')} {t('finances.revenues')}</p>
              <p className="font-bold text-stone-800">{formatMoney(stats.monthlyRevenue)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-stone-500">{t('finances.monthly')} {t('finances.netProfit')}</p>
              <p className="font-bold text-stone-800">{formatMoney(stats.monthlyProfit)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-stone-500">{t('finances.annual')} {t('finances.expenses')}</p>
              <p className="font-bold text-stone-800">{formatMoney(stats.annualExpense)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-stone-500">{t('finances.annual')} {t('finances.revenues')}</p>
              <p className="font-bold text-stone-800">{formatMoney(stats.annualRevenue)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-stone-500">{t('finances.annual')} {t('finances.netProfit')}</p>
              <p className="font-bold text-stone-800">{formatMoney(stats.annualProfit)}</p>
            </Card>
          </div>

          <Card>
            <CardHeader><h2 className="font-semibold text-stone-800">{t('statistics.financialTrend')}</h2></CardHeader>
            <CardBody className="h-80">
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
        </div>
      ) : tab === 'expenses' ? (
        <div className="space-y-4">
          <Button onClick={() => { setEditingExp(null); setExpForm(true); }}><Plus className="h-4 w-4" /> {t('finances.addExpense')}</Button>
          {expenses.length === 0 ? <EmptyState /> : expenses.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-800">{t(`expenseCategory.${e.category}`)}</p>
                  <p className="text-xs text-stone-400">{formatDate(e.date)} {e.hive ? `• ${t('dashboard.hiveNumber')}${e.hive.number}` : ''}</p>
                  {e.description && <p className="text-sm text-stone-600 mt-1">{e.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600">{formatMoney(e.amount)}</span>
                  <button onClick={() => { setEditingExp(e); setExpForm(true); }} className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-stone-100 rounded-lg"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleting({ type: 'expense', id: e.id })} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Button onClick={() => { setEditingRev(null); setRevForm(true); }}><Plus className="h-4 w-4" /> {t('finances.addRevenue')}</Button>
          {revenues.length === 0 ? <EmptyState /> : revenues.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-800">{t(`revenueType.${r.type}`)}</p>
                  <p className="text-xs text-stone-400">{formatDate(r.date)} {r.hive ? `• ${t('dashboard.hiveNumber')}${r.hive.number}` : ''} {r.customer ? `• ${r.customer}` : ''}</p>
                  {r.description && <p className="text-sm text-stone-600 mt-1">{r.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">{formatMoney(r.amount)}</span>
                  <button onClick={() => { setEditingRev(r); setRevForm(true); }} className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-stone-100 rounded-lg"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleting({ type: 'revenue', id: r.id })} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {expForm && <ExpenseForm open={expForm} onClose={() => setExpForm(false)} initial={editingExp} hives={hives} onSubmit={handleSaveExpense} />}
      {revForm && <RevenueForm open={revForm} onClose={() => setRevForm(false)} initial={editingRev} hives={hives} onSubmit={handleSaveRevenue} />}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title={t('common.delete')} />
    </div>
  );
};

const ExpenseForm = ({ open, onClose, initial, hives, onSubmit }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [category, setCategory] = useState(initial?.category || 'SUGAR');
  const [hiveId, setHiveId] = useState(initial?.hiveId || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [reason, setReason] = useState(initial?.reason || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ date, amount: parseFloat(amount), category, hiveId: hiveId || null, description, reason });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'تعديل المصروف' : t('finances.addExpense')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input type="date" label={t('common.date')} value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="number" label={t('finances.amount')} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <Select label={t('finances.category')} value={category} onChange={(e) => setCategory(e.target.value)}>
          {['SUGAR', 'SYRUP', 'MEDICINE', 'EQUIPMENT', 'FRAMES', 'HIVES', 'SWARMS', 'QUEENS', 'TRANSPORT', 'MAINTENANCE', 'OTHER'].map((c) => (
            <option key={c} value={c}>{t(`expenseCategory.${c}`)}</option>
          ))}
        </Select>
        <Select label={t('common.hive')} value={hiveId} onChange={(e) => setHiveId(e.target.value)}>
          <option value="">{t('common.optional')}</option>
          {hives.map((h) => <option key={h.id} value={h.id}>{t('dashboard.hiveNumber')}{h.number}</option>)}
        </Select>
        <Input label={t('finances.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
        <TextArea label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

const RevenueForm = ({ open, onClose, initial, hives, onSubmit }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [type, setType] = useState(initial?.type || 'HONEY');
  const [product, setProduct] = useState(initial?.product || '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? '');
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice ?? '');
  const [customer, setCustomer] = useState(initial?.customer || '');
  const [hiveId, setHiveId] = useState(initial?.hiveId || '');
  const [description, setDescription] = useState(initial?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      date, amount: amount === '' ? undefined : parseFloat(amount),
      type, product,
      quantity: quantity === '' ? undefined : parseInt(quantity),
      unitPrice: unitPrice === '' ? undefined : parseFloat(unitPrice),
      customer, hiveId: hiveId || null, description,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'تعديل المدخول' : t('finances.addRevenue')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input type="date" label={t('common.date')} value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="number" label={t('finances.amount')} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Select label={t('finances.type')} value={type} onChange={(e) => setType(e.target.value)}>
          {['HONEY', 'WAX', 'PROPOLIS', 'POLLEN', 'ROYAL_JELLY', 'SWARM', 'QUEEN', 'OTHER'].map((ty) => (
            <option key={ty} value={ty}>{t(`revenueType.${ty}`)}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('finances.product')} value={product} onChange={(e) => setProduct(e.target.value)} />
          <Input label={t('finances.quantity')} type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input label={t('harvests.unitPrice')} type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          <Input label={t('finances.customer')} value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </div>
        <Select label={t('common.hive')} value={hiveId} onChange={(e) => setHiveId(e.target.value)}>
          <option value="">{t('common.optional')}</option>
          {hives.map((h) => <option key={h.id} value={h.id}>{t('dashboard.hiveNumber')}{h.number}</option>)}
        </Select>
        <TextArea label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};
