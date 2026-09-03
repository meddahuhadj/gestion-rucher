import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock as ClockIcon } from 'lucide-react';

const LOCALES = { fr: 'fr-FR', ar: 'ar-DZ', en: 'en-GB' };

// Horloge temps réel, mise à jour à la seconde (setTimeout auto-recalé).
export const Clock = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let id;
    const tick = () => {
      setNow(new Date());
      id = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    id = setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => clearTimeout(id);
  }, []);

  const locale = LOCALES[i18n.language] || 'fr-FR';
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...(compact ? {} : { second: '2-digit' }),
    hour12: false,
  }).format(now);
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(now);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-stone-100/80 dark:bg-stone-800/60">
        <ClockIcon className="h-3 w-3 text-honey-500 shrink-0" />
        <span className="font-mono text-xs font-semibold tabular-nums text-stone-600 dark:text-stone-300">
          {time}
        </span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100/80 border border-stone-200/70 dark:bg-stone-800/60 dark:border-stone-700/60">
      <ClockIcon className="h-3.5 w-3.5 text-honey-500 shrink-0" />
      <span className="font-mono text-sm font-semibold tabular-nums text-stone-700 dark:text-stone-200">
        {time}
      </span>
      <span className="text-stone-300 dark:text-stone-600">·</span>
      <span className="text-xs text-stone-500 capitalize dark:text-stone-400 whitespace-nowrap">
        {date}
      </span>
    </div>
  );
};
