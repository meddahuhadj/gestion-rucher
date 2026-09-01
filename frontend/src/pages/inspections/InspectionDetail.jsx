import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Pencil } from 'lucide-react';
import { inspectionApi } from '../../api';
import { Card, Badge, Spinner, EmptyState, Button } from '../../components/ui';
import { formatDate, formatDateTime } from '../../utils/format';

const strengthColors = { VERY_STRONG: 'emerald', STRONG: 'green', MEDIUM: 'yellow', WEAK: 'red', VERY_WEAK: 'red' };

export const InspectionDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [insp, setInsp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await inspectionApi.get(id);
        setInsp(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Spinner className="py-16" />;
  if (!insp) return <EmptyState />;

  const Field = ({ label, value }) => (
    <div className="py-2 flex justify-between gap-4 border-b border-stone-50">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-medium text-stone-800">{value || '—'}</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          <ArrowRight className="h-4 w-4" /> {t('common.back')}
        </button>
        <Button variant="secondary" onClick={() => navigate(`/inspections/${id}/edit`)}>
          <Pencil className="h-4 w-4" /> {t('common.edit')}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-honey-100 flex items-center justify-center text-2xl">🐝</div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            {t('dashboard.hiveNumber')}{insp.hive?.number} {insp.hive?.name || ''}
          </h1>
          <p className="text-stone-500">{formatDateTime(insp.date)}</p>
        </div>
        <Badge color={strengthColors[insp.strength]}>{t(`hiveStrength.${insp.strength}`)}</Badge>
      </div>

      {insp.observations && (
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 mb-2">📝 {t('inspections.observations')}</h3>
          <p className="text-stone-600 whitespace-pre-wrap">{insp.observations}</p>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-semibold text-stone-800 mb-3">{t('inspections.title')}</h3>
        <Field label={t('inspections.strength')} value={t(`hiveStrength.${insp.strength}`)} />
        <Field label={t('inspections.queenPresent')} value={insp.queenPresent === null ? '—' : insp.queenPresent ? t('common.yes') : t('common.no')} />
        <Field label={t('inspections.queenSeen')} value={insp.queenSeen === null ? '—' : insp.queenSeen ? t('common.yes') : t('common.no')} />
        <Field label={t('inspections.layingPattern')} value={insp.layingPattern} />
        <Field label={t('inspections.broodQuantity')} value={insp.broodQuantity} />
        <Field label={t('inspections.broodCondition')} value={insp.broodCondition} />
        <Field label={t('inspections.honeyStores')} value={insp.honeyStores} />
        <Field label={t('inspections.pollenStores')} value={insp.pollenStores} />
        <Field label={t('inspections.foodAvailable')} value={insp.foodAvailable === null ? '—' : insp.foodAvailable ? t('common.yes') : t('common.no')} />
        <Field label={t('inspections.healthStatus')} value={insp.healthStatus} />
        <Field label={t('inspections.parasites')} value={insp.parasites} />
        <Field label={t('inspections.diseases')} value={insp.diseases} />
        <Field label={t('inspections.temperature')} value={insp.temperature ? `${insp.temperature} °C` : '—'} />
        <Field label={t('inspections.weather')} value={insp.weather} />
      </Card>

      {insp.photos && JSON.parse(insp.photos)?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 mb-3">📷 {t('inspections.photos')}</h3>
          <div className="flex gap-2 flex-wrap">
            {JSON.parse(insp.photos).map((p, i) => (
              <img key={i} src={p} className="h-28 w-28 rounded-lg object-cover" alt="inspection" />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
