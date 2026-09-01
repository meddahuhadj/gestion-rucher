import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Plus } from 'lucide-react';
import { queenApi, hiveApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Spinner, EmptyState, Badge, Button, Modal, Input, Select, TextArea, ConfirmDialog } from '../../components/ui';
import { formatDate, toInputDate } from '../../utils/format';
import { useSearchParams } from 'react-router-dom';

export const QueensList = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [queens, setQueens] = useState([]);
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await queenApi.list();
      setQueens(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { hiveApi.list().then(setHives).catch(() => {}); }, []);

  const openNew = () => {
    const hive = searchParams.get('hive');
    setEditing(null);
    setFormOpen(true);
    if (hive) window.hivePreset = hive;
  };

  const handleSave = async (data) => {
    if (editing) await queenApi.update(editing.id, data);
    else await queenApi.create(data);
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await queenApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <PageHeader title={t('queens.title')} icon={Crown} onAdd={openNew} addLabel={t('queens.add')} />

      {loading ? (
        <Spinner className="py-16" />
      ) : queens.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queens.map((queen) => (
            <Card key={queen.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-800">{queen.race || '—'}</p>
                  <p className="text-sm text-stone-500">{queen.hive ? `${t('dashboard.hiveNumber')}${queen.hive.number}` : ''}</p>
                </div>
                {queen.quality && <Badge color={queen.quality === 'Excellent' ? 'emerald' : queen.quality === 'Good' ? 'green' : 'yellow'}>{queen.quality}</Badge>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-stone-400">{t('queens.origin')}</p>
                  <p className="font-medium">{queen.origin || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">{t('queens.age')}</p>
                  <p className="font-medium">{queen.age ? `${queen.age} ${t('queens.age')}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">{t('queens.introductionDate')}</p>
                  <p className="font-medium">{formatDate(queen.introductionDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">{t('queens.broodProduction')}</p>
                  <p className="font-medium">{queen.broodProduction || '—'}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => { setEditing(queen); setFormOpen(true); }}>{t('common.edit')}</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleting(queen)}>{t('common.delete')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {formOpen && <QueenForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} hives={hives} onSubmit={handleSave} />}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title={t('common.delete')} />
    </div>
  );
};

const QueenForm = ({ open, onClose, initial, hives, onSubmit }) => {
  const { t } = useTranslation();
  const [hiveId, setHiveId] = useState(initial?.hiveId || '');
  const [origin, setOrigin] = useState(initial?.origin || '');
  const [race, setRace] = useState(initial?.race || '');
  const [age, setAge] = useState(initial?.age || '');
  const [introductionDate, setIntroductionDate] = useState(toInputDate(initial?.introductionDate) || '');
  const [quality, setQuality] = useState(initial?.quality || 'Good');
  const [broodProduction, setBroodProduction] = useState(initial?.broodProduction || 'Good');
  const [notes, setNotes] = useState(initial?.notes || '');

  useEffect(() => {
    if (!initial && window.hivePreset) setHiveId(window.hivePreset);
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      hiveId, origin, race,
      age: age === '' ? undefined : parseInt(age),
      introductionDate: introductionDate || undefined,
      quality, broodProduction, notes,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('queens.edit') : t('queens.add')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label={t('common.hive')} value={hiveId} onChange={(e) => setHiveId(e.target.value)}>
          <option value="">{t('common.all')}</option>
          {hives.map((h) => <option key={h.id} value={h.id}>{t('dashboard.hiveNumber')}{h.number} {h.name || ''}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('queens.origin')} value={origin} onChange={(e) => setOrigin(e.target.value)} />
          <Input label={t('queens.race')} value={race} onChange={(e) => setRace(e.target.value)} />
          <Input type="number" label={t('queens.age')} value={age} onChange={(e) => setAge(e.target.value)} />
          <Input type="date" label={t('queens.introductionDate')} value={introductionDate} onChange={(e) => setIntroductionDate(e.target.value)} />
        </div>
        <Select label={t('queens.quality')} value={quality} onChange={(e) => setQuality(e.target.value)}>
          {['Excellent', 'Good', 'Average', 'Poor', 'Failing'].map((q) => <option key={q} value={q}>{q}</option>)}
        </Select>
        <Select label={t('queens.broodProduction')} value={broodProduction} onChange={(e) => setBroodProduction(e.target.value)}>
          {['Excellent', 'Good', 'Moderate', 'Poor', 'None'].map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <TextArea label={t('queens.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};
