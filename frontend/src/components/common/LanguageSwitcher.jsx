import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const langs = [
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const change = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  return (
    <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
      <Globe className="h-4 w-4 text-stone-500 mx-1 hidden sm:block" />
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => change(l.code)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
            current === l.code ? 'bg-white text-honey-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
