import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Plus, Pencil, Trash2 } from 'lucide-react';
import { harvestApi, hiveApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Spinner, EmptyState, Badge, Button, Modal, Input, Select, TextArea, ConfirmDialog, StatCard } from '../../components/ui';
import { formatDate } from '../../utils/format';

export const HarvestsList = () => {
  const { t } = useTranslation();
  const [harvests, setHarvests] = useState([]);
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await harvestApi.list();
      setHarvests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { hiveApi.list().then(setHives).catch(() => {}); }, []);

  const totalQty = harvests.reduce((s, h) => s + (h.quantity || 0), 0);
  const totalVal = harvests.reduce((s, h) => s + (h.totalPrice || 0), 0);
  const avgPerHive = hives.filter((h) => h.status !== 'DEAD').length
    ? (totalQty / hives.filter((h) => h.status !== 'DEAD').length).toFixed(1)
    : 0;

  const handleSave = async (data) => {
    if (editing) await harvestApi.update(editing.id, data);
    else await harvestApi.create(data);
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await harvestApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <PageHeader title={t('harvests.title')} icon={Droplets} onAdd={() => { setEditing(null); setFormOpen(true); }} addLabel={t('harvests.add')} />

      {harvests.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard icon={Droplets} label={t('harvests.totalProduction')} value={`${totalQty} kg`} color="honey" />
          <StatCard icon={Droplets} label={t('harvests.averageProduction')} value={`${avgPerHive} kg`} color="emerald" />
          <StatCard icon={Droplets} label={t('finances.totalRevenues')} value={`${totalVal.toLocaleString()}`} color="green" />
        </div>
      )}

      {loading ? (
        <Spinner className="py-16" />
      ) : harvests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {harvests.map((h) => (
            <Card key={h.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-honey-100 flex items-center justify-center text-xl">🍯</div>
                  <div>
                    <p className="font-semibold text-stone-800">{t('dashboard.hiveNumber')}{h.hive?.number} — {h.honeyType || t('harvests.title')}</p>
                    <p className="text-xs text-stone-400">{formatDate(h.date)} • Lot: {h.lot || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <p className="font-bold text-stone-800">{h.quantity || h.weight || 0} kg</p>
                    <p className="text-sm text-stone-500">{h.totalPrice !== null ? h.totalPrice.toLocaleString() : '—'}</p>
                  </div>
                  <Badge color="honey">{h.jars || 0} 🍯</Badge>
                  <button onClick={() => { setEditing(h); setFormOpen(true); }} className="p-1.5 text-stone-400 hover:text-honey-600 hover:bg-stone-100 rounded-lg">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(h)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {formOpen && <HarvestForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} hives={hives} onSubmit={handleSave} />}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title={t('common.delete')} />
    </div>
  );
};

const HarvestForm = ({ open, onClose, initial, hives, onSubmit }) => {
  const { t } = useTranslation();
  const [hiveId, setHiveId] = useState(initial?.hiveId || '');
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : '');
  const [honeyType, setHoneyType] = useState(initial?.honeyType || '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? '');
  const [weight, setWeight] = useState(initial?.weight ?? '');
  const [jars, setJars] = useState(initial?.jars ?? '');
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice ?? '');
  const [lot, setLot] = useState(initial?.lot || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      hiveId, date, honeyType,
      quantity: quantity === '' ? undefined : parseInt(quantity),
      weight: weight === '' ? undefined : parseFloat(weight),
      jars: jars === '' ? undefined : parseInt(jars),
      unitPrice: unitPrice === '' ? undefined : parseFloat(unitPrice),
      lot, notes,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('harvests.edit') : t('harvests.add')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label={t('common.hive')} value={hiveId} onChange={(e) => setHiveId(e.target.value)}>
          <option value="">{t('common.all')}</option>
          {hives.map((h) => <option key={h.id} value={h.id}>{t('dashboard.hiveNumber')}{h.number} {h.name || ''}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input type="date" label={t('common.date')} value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label={t('harvests.honeyType')} value={honeyType} onChange={(e) => setHoneyType(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input type="number" label={t('harvests.quantity')} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input type="number" label={t('harvests.weight')} value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Input type="number" label={t('harvests.jars')} value={jars} onChange={(e) => setJars(e.target.value)} />
          <Input type="number" label={t('harvests.unitPrice')} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </div>
        <Input label={t('harvests.lot')} value={lot} onChange={(e) => setLot(e.target.value)} />
        <TextArea label={t('harvests.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};
