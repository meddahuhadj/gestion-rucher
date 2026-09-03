import { useTranslation } from 'react-i18next';
import { Bot, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlove } from '../context/GloveContext';
import { useAssistant } from './AssistantContext';
import { AssistantPanel } from './AssistantPanel';
import { AssistantGloveView } from './AssistantGloveView';

export const AssistantFab = () => {
  const { t } = useTranslation();
  const { glove } = useGlove();
  const { open, setOpen, isActive } = useAssistant();

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t('assistant.title')}
        className={`fixed z-40 bottom-20 end-4 lg:bottom-6 lg:end-6 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 ${
          glove ? 'h-20 w-20' : 'h-14 w-14'
        } ${isActive ? 'bg-violet-600' : 'bg-honey-500'} ${open ? 'hidden' : ''}`}
      >
        <Bot className={glove ? 'h-10 w-10' : 'h-6 w-6'} />
        {isActive && (
          <span className="absolute -top-0.5 -end-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-stone-900 animate-pulse" />
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          {glove ? (
            <div className="absolute inset-0 bg-white dark:bg-stone-950">
              <AssistantGloveView onClose={() => setOpen(false)} />
            </div>
          ) : (
            <div className="absolute inset-y-0 end-0 w-full max-w-sm bg-white shadow-2xl flex flex-col dark:bg-stone-900">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white ${isActive ? 'bg-violet-600' : 'bg-honey-500'}`}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-800 leading-tight dark:text-stone-100">{t('assistant.title')}</p>
                  <p className="text-[11px] text-stone-400 truncate">{t('assistant.subtitle')}</p>
                </div>
                <div className="ms-auto flex items-center gap-1">
                  <Link
                    to="/assistant"
                    onClick={() => setOpen(false)}
                    title={t('assistant.openFull')}
                    className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 p-4">
                <AssistantPanel variant="drawer" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
