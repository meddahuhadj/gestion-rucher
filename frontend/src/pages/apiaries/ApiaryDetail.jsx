import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { apiaryApi } from '../../api';
import { parseCoords, formatCoords, mapUrl } from '../../utils/geo';
import { HiveCard } from '../../components/common/HiveCard';
import { Card, Spinner, EmptyState, Button, Badge } from '../../components/ui';
import { formatDate } from '../../utils/format';

export const ApiaryDetail = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [apiary, setApiary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiaryApi.get(id);
        setApiary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Spinner className="py-16" />;
  if (!apiary) return <EmptyState />;

  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/apiaries')} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
          <ArrowRight className="h-4 w-4" /> {t('common.back')}
        </button>
        <Button variant="secondary" onClick={() => navigate('/hives/new')}>{t('dashboard.addHive')}</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-honey-100 flex items-center justify-center dark:bg-honey-900/40">
          <MapPin className="h-7 w-7 text-honey-600 dark:text-honey-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{apiary.name}</h1>
          {apiary.location && (() => {
            const c = parseCoords(apiary.location);
            return c ? (
              <a
                href={mapUrl(c.lat, c.lng)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-honey-600 hover:underline dark:text-honey-400"
              >
                {formatCoords(c.lat, c.lng)} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="text-stone-500 dark:text-stone-400">{apiary.location}</p>
            );
          })()}
          {apiary.description && <p className="text-sm text-stone-400 mt-1">{apiary.description}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-stone-800 mb-4 dark:text-stone-100">
          {t('apiaries.hives')} ({apiary.hives?.length || 0})
        </h2>
        {apiary.hives?.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiary.hives.map((hive) => (
              <HiveCard key={hive.id} hive={hive} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
