import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { inspectionApi, hiveApi, uploadApi } from '../../api';
import { Button, Card, CardHeader, CardBody, Input, Select, TextArea, Spinner, EmptyState } from '../../components/ui';
import { toInputDate } from '../../utils/format';

const strengths = ['VERY_STRONG', 'STRONG', 'MEDIUM', 'WEAK', 'VERY_WEAK'];
const weathers = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];

const QuickToggle = ({ label, active, onClick, emoji }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
      active ? 'bg-honey-500 text-white border-honey-500 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-honey-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
    }`}
  >
    {emoji} {label}
  </button>
);

export const InspectionForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = !!id;
  const presetHive = searchParams.get('hive');

  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    hiveId: presetHive || '', date: toInputDate(new Date()), time: '',
    temperature: '', weather: 'Sunny', strength: 'MEDIUM',
    queenPresent: 'yes', queenSeen: 'yes', layingPattern: '', broodQuantity: '',
    broodCondition: '', honeyStores: '', pollenStores: '', foodAvailable: 'yes',
    healthStatus: 'Healthy', parasites: '', diseases: '', observations: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    hiveApi.list().then((data) => setHives(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const data = await inspectionApi.get(id);
        setForm({
          hiveId: data.hiveId || '', date: toInputDate(data.date) || '', time: data.time || '',
          temperature: data.temperature ?? '', weather: data.weather || 'Sunny',
          strength: data.strength || 'MEDIUM',
          queenPresent: data.queenPresent === null ? 'yes' : (data.queenPresent ? 'yes' : 'no'),
          queenSeen: data.queenSeen === null ? 'yes' : (data.queenSeen ? 'yes' : 'no'),
          layingPattern: data.layingPattern || '', broodQuantity: data.broodQuantity || '',
          broodCondition: data.broodCondition || '', honeyStores: data.honeyStores || '',
          pollenStores: data.pollenStores || '', foodAvailable: data.foodAvailable ? 'yes' : 'no',
          healthStatus: data.healthStatus || 'Healthy', parasites: data.parasites || '',
          diseases: data.diseases || '', observations: data.observations || '',
        });
        if (data.photos) setPhotos(JSON.parse(data.photos));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const result = await uploadApi.upload(files);
      const paths = Array.isArray(result) ? result.map((r) => r.path || r) : [result.path || result];
      setPhotos((prev) => [...prev, ...paths]);
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hiveId) return setError(t('inspections.title') + ': hive required');
    setError('');
    try {
      const payload = {
        ...form,
        temperature: form.temperature === '' ? undefined : parseFloat(form.temperature),
        queenPresent: form.queenPresent === 'yes',
        queenSeen: form.queenSeen === 'yes',
        foodAvailable: form.foodAvailable === 'yes',
        photos: photos.length ? photos : undefined,
      };
      if (isEdit) await inspectionApi.update(id, payload);
      else await inspectionApi.create(payload);
      navigate(isEdit ? `/inspections/${id}` : '/inspections');
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
      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{isEdit ? t('inspections.edit') : t('inspections.add')} 🐝</h1>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">🐝 {t('inspections.title')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <Select value={form.hiveId} onChange={(e) => update('hiveId', e.target.value)} label={t('common.hive')}>
            <option value="">{t('common.all')}</option>
            {hives.filter((h) => h.status !== 'DEAD').map((h) => (
              <option key={h.id} value={h.id}>{t('dashboard.hiveNumber')}{h.number} {h.name || ''}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input type="date" label={t('inspections.date')} value={form.date} onChange={(e) => update('date', e.target.value)} />
            <Input type="time" label={t('inspections.time')} value={form.time} onChange={(e) => update('time', e.target.value)} />
            <Input type="number" label={`${t('inspections.temperature')} °C`} value={form.temperature} onChange={(e) => update('temperature', e.target.value)} />
            <Select label={t('inspections.weather')} value={form.weather} onChange={(e) => update('weather', e.target.value)}>
              {weathers.map((w) => <option key={w} value={w}>{t(`inspections.${w.toLowerCase()}`)}</option>)}
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('inspections.strength')}</h2></CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {strengths.map((s) => {
              const emoji = { VERY_STRONG: '🐝🐝🐝', STRONG: '🐝🐝', MEDIUM: '🟡', WEAK: '🔴', VERY_WEAK: '🔴🔴' }[s];
              return <QuickToggle key={s} emoji={emoji} label={t(`hiveStrength.${s}`)} active={form.strength === s} onClick={() => update('strength', s)} />;
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">👑 {t('inspections.queenPresent')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <QuickToggle emoji="👑" label={t('inspections.queenPresent')} active={form.queenPresent === 'yes'} onClick={() => update('queenPresent', 'yes')} />
            <QuickToggle emoji="❌" label={t('common.no')} active={form.queenPresent === 'no'} onClick={() => update('queenPresent', 'no')} />
            <QuickToggle emoji="👁️" label={t('inspections.queenSeen')} active={form.queenSeen === 'yes'} onClick={() => update('queenSeen', 'yes')} />
            <QuickToggle emoji="🚫" label={t('common.no')} active={form.queenSeen === 'no'} onClick={() => update('queenSeen', 'no')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('inspections.layingPattern')} value={form.layingPattern} onChange={(e) => update('layingPattern', e.target.value)} placeholder={t('optional')} />
            <Select label={t('inspections.broodQuantity')} value={form.broodQuantity} onChange={(e) => update('broodQuantity', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {['Lots', 'Medium', 'Little', 'None'].map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
            <Input label={t('inspections.broodCondition')} value={form.broodCondition} onChange={(e) => update('broodCondition', e.target.value)} placeholder={t('optional')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">🍯 {t('inspections.honeyStores')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label={t('inspections.honeyStores')} value={form.honeyStores} onChange={(e) => update('honeyStores', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {['Full', 'Medium', 'Low', 'Empty'].map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
            <Select label={t('inspections.pollenStores')} value={form.pollenStores} onChange={(e) => update('pollenStores', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {['Good', 'Moderate', 'Low', 'None'].map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickToggle emoji="✅" label={t('inspections.foodAvailable')} active={form.foodAvailable === 'yes'} onClick={() => update('foodAvailable', 'yes')} />
            <QuickToggle emoji="⚠️" label={t('common.no')} active={form.foodAvailable === 'no'} onClick={() => update('foodAvailable', 'no')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">💊 {t('inspections.healthStatus')}</h2></CardHeader>
        <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label={t('inspections.healthStatus')} value={form.healthStatus} onChange={(e) => update('healthStatus', e.target.value)} placeholder={t('optional')} />
          <Input label={t('inspections.parasites')} value={form.parasites} onChange={(e) => update('parasites', e.target.value)} placeholder={t('optional')} />
          <Input label={t('inspections.diseases')} value={form.diseases} onChange={(e) => update('diseases', e.target.value)} placeholder={t('optional')} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-stone-800 dark:text-stone-100">📝 {t('inspections.observations')}</h2></CardHeader>
        <CardBody className="space-y-4">
          <TextArea value={form.observations} onChange={(e) => update('observations', e.target.value)} rows={4} placeholder={t('inspections.observations')} />
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2 dark:text-stone-300">{t('inspections.photos')}</label>
            <input
              type="file" accept="image/*" multiple onChange={handlePhotoUpload}
              className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-honey-100 file:text-honey-700 hover:file:bg-honey-200 mb-3 dark:text-stone-400 dark:file:bg-honey-900/40 dark:file:text-honey-300"
            />
            {uploading && <Button variant="secondary" size="sm" disabled>...</Button>}
            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} className="h-20 w-20 rounded-lg object-cover" alt="inspection" />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-2 -end-2 bg-red-500 text-white rounded-full h-5 w-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-3 justify-end max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:-mx-4 max-lg:px-4 max-lg:py-3 max-lg:pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] max-lg:border-t max-lg:border-stone-200 max-lg:bg-stone-50/95 max-lg:backdrop-blur max-lg:dark:border-stone-800 max-lg:dark:bg-stone-950/95">
        <Button variant="secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        <Button type="submit" onClick={handleSubmit}>{t('common.save')}</Button>
      </div>
    </div>
  );
};
