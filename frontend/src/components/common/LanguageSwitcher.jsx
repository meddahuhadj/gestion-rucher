import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const langs = [
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
];

export const LanguageSwitcher = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const change = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  if (compact) {
    const idx = Math.max(0, langs.findIndex((l) => l.code === current));
    const next = langs[(idx + 1) % langs.length];
    const cur = langs[idx];
    return (
      <button
        onClick={() => change(next.code)}
        aria-label={`Langue : ${cur.label}`}
        title={cur.label}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:text-stone-800 dark:bg-stone-800 dark:text-stone-300"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs font-semibold">{cur.short}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 dark:bg-stone-800">
      <Globe className="h-4 w-4 text-stone-500 mx-1 hidden sm:block dark:text-stone-400" />
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => change(l.code)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
            current === l.code ? 'bg-white text-honey-700 shadow-sm dark:bg-stone-700 dark:text-honey-300' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
