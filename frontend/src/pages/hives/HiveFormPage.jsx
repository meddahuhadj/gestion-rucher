import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { hiveApi, apiaryApi } from '../../api';
import { Button, Card, CardHeader, CardBody, Input, Select, TextArea, Spinner, EmptyState } from '../../components/ui';
import { toInputDate } from '../../utils/format';

const statuses = ['ACTIVE', 'WEAK', 'DEAD', 'SOLD', 'MERGED', 'ARCHIVED'];
const strengths = ['VERY_STRONG', 'STRONG', 'MEDIUM', 'WEAK', 'VERY_WEAK'];

export const HiveFormPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [apiaries, setApiaries] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState({
    name: '', apiaryId: '', origin: '', type: '', beeRace: '',
    status: 'ACTIVE', strength: 'MEDIUM', queenPresent: true,
    queenAge: '', queenIntroDate: '', notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    apiaryApi.list().then(setApiaries).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const data = await hiveApi.get(id);
        setForm({
          name: data.name || '', apiaryId: data.apiaryId || '',
          origin: data.origin || '', type: data.type || '', beeRace: data.beeRace || '',
          status: data.status || 'ACTIVE', strength: data.strength || 'MEDIUM',
          queenPresent: data.queenPresent, queenAge: data.queenAge || '',
          queenIntroDate: toInputDate(data.queenIntroDate) || '', notes: data.notes || '',
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.apiaryId) return setError(t('hives.apiary') + ' ' + t('common.noData'));
    setError('');
    try {
      const payload = {
        ...form,
        queenAge: form.queenAge === '' ? null : parseInt(form.queenAge),
        queenIntroDate: form.queenIntroDate || undefined,
      };
      if (isEdit) await hiveApi.update(id, payload);
      else await hiveApi.create(payload);
      navigate('/hives');
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  if (loading) return <Spinner className="py-16" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
        <ArrowRight className="h-4 w-4" /> {t('common.back')}
      </button>

      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{isEdit ? t('hives.edit') : t('hives.add')} 🐝</h1>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('hives.number')}</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Select value={form.status} onChange={(e) => update('status', e.target.value)} label={t('hives.status')}>
            {statuses.map((s) => <option key={s} value={s}>{t(`hiveStatus.${s}`)}</option>)}
          </Select>
          <Select value={form.strength} onChange={(e) => update('strength', e.target.value)} label={t('hives.strength')}>
            {strengths.map((s) => <option key={s} value={s}>{t(`hiveStrength.${s}`)}</option>)}
          </Select>
          <Select value={form.apiaryId} onChange={(e) => update('apiaryId', e.target.value)} label={t('hives.apiary')} error={error}>
            <option value="">{t('common.all')}</option>
            {apiaries.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('hives.name')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('hives.name')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('optional')} />
            <Input label={t('hives.origin')} value={form.origin} onChange={(e) => update('origin', e.target.value)} placeholder={t('optional')} />
            <Input label={t('hives.type')} value={form.type} onChange={(e) => update('type', e.target.value)} placeholder={t('optional')} />
            <Input label={t('hives.beeRace')} value={form.beeRace} onChange={(e) => update('beeRace', e.target.value)} placeholder={t('optional')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">👑 {t('hives.queenPresent')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-3">
            <Button type="button" variant={form.queenPresent ? 'primary' : 'secondary'} onClick={() => update('queenPresent', true)}>
              {t('common.yes')}
            </Button>
            <Button type="button" variant={!form.queenPresent ? 'primary' : 'secondary'} onClick={() => update('queenPresent', false)}>
              {t('common.no')}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('hives.queenAge')} type="number" value={form.queenAge} onChange={(e) => update('queenAge', e.target.value)} />
            <Input label={t('queens.introductionDate')} type="date" value={form.queenIntroDate} onChange={(e) => update('queenIntroDate', e.target.value)} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('hives.notes')}</h2></CardHeader>
        <CardBody>
          <TextArea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} />
        </CardBody>
      </Card>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-3 justify-end max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:-mx-4 max-lg:px-4 max-lg:py-3 max-lg:pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] max-lg:border-t max-lg:border-stone-200 max-lg:bg-stone-50/95 max-lg:backdrop-blur max-lg:dark:border-stone-800 max-lg:dark:bg-stone-950/95">
        <Button variant="secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        <Button onClick={handleSubmit}>{t('common.save')}</Button>
      </div>
    </div>
  );
};
