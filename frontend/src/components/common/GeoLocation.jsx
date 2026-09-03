import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2 } from 'lucide-react';
import { getCachedGeo, requestGeo, formatCoords, mapUrl } from '../../utils/geo';

// Widget position dans l'en-tête : pastille pin + coordonnées (lien carte).
export const GeoLocation = ({ compact = false }) => {
  const { t } = useTranslation();
  const [geo, setGeo] = useState(() => getCachedGeo());
  const [status, setStatus] = useState('idle'); // idle | loading | error

  useEffect(() => {
    const onGeo = (e) => setGeo(e.detail);
    window.addEventListener('nahala:geo', onGeo);
    return () => window.removeEventListener('nahala:geo', onGeo);
  }, []);

  const locate = async () => {
    setStatus('loading');
    try {
      setGeo(await requestGeo());
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  const Icon = status === 'loading' ? Loader2 : MapPin;
  const iconCls = `h-3.5 w-3.5 shrink-0 ${
    status === 'loading'
      ? 'animate-spin text-stone-400'
      : status === 'error'
        ? 'text-red-500'
        : 'text-honey-500'
  }`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-stone-100/80 dark:bg-stone-800/60 ${
        compact ? 'px-2 py-1' : 'px-3 py-1.5'
      }`}
    >
      <button type="button" onClick={locate} title={t('geo.refresh')} className="inline-flex items-center">
        <Icon className={iconCls} />
      </button>
      {geo ? (
        <a
          href={mapUrl(geo.lat, geo.lng)}
          target="_blank"
          rel="noreferrer"
          title={t('geo.openMap')}
          className={`font-mono font-semibold tabular-nums text-stone-600 hover:text-honey-600 dark:text-stone-300 dark:hover:text-honey-400 ${
            compact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {compact ? `${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)}` : formatCoords(geo.lat, geo.lng)}
        </a>
      ) : (
        <button
          type="button"
          onClick={locate}
          className={`font-medium text-stone-500 dark:text-stone-400 ${compact ? 'text-[11px]' : 'text-xs'}`}
        >
          {status === 'error' ? t('geo.error') : t('geo.locate')}
        </button>
      )}
    </span>
  );
};
