import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Camera, CameraOff, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAssistant } from './AssistantContext';
import { ApiKeyDialog } from './ApiKeyDialog';

const ENTITY_ROUTE = {
  tasks: '/tasks',
  inspections: '/inspections',
  harvests: '/harvests',
  hives: '/hives',
};

const CIRCLE_STYLES = {
  IDLE: 'bg-honey-500',
  ERROR: 'bg-honey-500',
  CONNECTING: 'bg-amber-500 animate-pulse',
  LISTENING: 'bg-emerald-500',
  SPEAKING: 'bg-violet-600 animate-pulse',
};

// Grand écran vocal simplifié — affiché quand le mode gants est actif.
export const AssistantGloveView = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    hasApiKey, saveApiKey,
    status, isActive, error,
    transcriptions, actions,
    cameraOn, toggleCamera, videoRef,
    start, stop,
  } = useAssistant();

  const [keyDialog, setKeyDialog] = useState(false);
  const autoStarted = useRef(false);

  // Démarrage auto du micro à l'ouverture.
  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    if (!hasApiKey) setKeyDialog(true);
    else if (!isActive) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastUser = [...transcriptions].reverse().find((e) => e.role === 'user');
  const lastAgent = [...transcriptions].reverse().find((e) => e.role === 'agent');

  const bigLabel = {
    IDLE: t('assistant.tapToTalk'),
    ERROR: t('assistant.tapToTalk'),
    CONNECTING: t('assistant.status.CONNECTING'),
    LISTENING: t('assistant.glove.listening'),
    SPEAKING: t('assistant.status.SPEAKING'),
  }[status] || t('assistant.tapToTalk');

  const hint = isActive ? t('assistant.tapToStop') : t('assistant.tapToStart');

  const onCircle = () => {
    if (isActive) return stop();
    if (!hasApiKey) return setKeyDialog(true);
    start();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-stone-950">
      {/* Barre supérieure */}
      <div className="flex items-center gap-2 p-3">
        <span className="text-sm font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1">
          {t(`assistant.status.${status}`)}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={() => setKeyDialog(true)}
            aria-label={t('assistant.changeKey')}
            className="h-12 w-12 flex items-center justify-center rounded-2xl text-stone-500 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
          >
            <KeyRound className="h-6 w-6" />
          </button>
          <button
            onClick={toggleCamera}
            aria-label={cameraOn ? t('assistant.cameraOff') : t('assistant.cameraOn')}
            className={`h-12 w-12 flex items-center justify-center rounded-2xl ${
              cameraOn
                ? 'bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-300'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            {cameraOn ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="h-12 w-12 flex items-center justify-center rounded-2xl text-stone-500 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
            >
              <X className="h-7 w-7" />
            </button>
          )}
        </div>
      </div>

      {cameraOn && (
        <div className="mx-3 mb-2 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 dark:border-stone-800">
          <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-48 object-cover" />
        </div>
      )}

      {/* Zone centrale : gros bouton */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 px-6">
        <button
          onClick={onCircle}
          className={`relative h-52 w-52 sm:h-60 sm:w-60 rounded-full flex flex-col items-center justify-center gap-3 text-white shadow-xl transition-transform active:scale-95 ${
            CIRCLE_STYLES[status] || CIRCLE_STYLES.IDLE
          }`}
        >
          {isActive && status !== 'SPEAKING' && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
          )}
          {isActive ? <Square className="h-16 w-16" fill="currentColor" /> : <Mic className="h-20 w-20" />}
          <span className="text-lg font-bold">{isActive ? t('assistant.stop') : t('assistant.start')}</span>
        </button>

        <p className="text-2xl font-bold text-stone-800 text-center dark:text-stone-100">{bigLabel}</p>
        <p className="text-base text-stone-400 text-center">{hint}</p>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>

      {/* Dernières phrases + actions */}
      <div className="p-4 space-y-3 border-t border-stone-100 dark:border-stone-800 max-h-[38vh] overflow-y-auto scrollbar-thin">
        {lastAgent && (
          <div className="rounded-2xl bg-stone-100 px-4 py-3 dark:bg-stone-800">
            <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-1">{t('assistant.assistant')}</p>
            <p className="text-lg text-stone-800 dark:text-stone-100">{lastAgent.text}</p>
          </div>
        )}
        {lastUser && (
          <div className="rounded-2xl bg-honey-50 px-4 py-3 dark:bg-honey-900/20">
            <p className="text-[11px] uppercase tracking-widest text-honey-600/70 mb-1 dark:text-honey-400/70">{t('assistant.you')}</p>
            <p className="text-base text-stone-700 dark:text-stone-200">{lastUser.text}</p>
          </div>
        )}
        {actions.slice(-3).map((a) => (
          <Link
            key={a.id}
            to={ENTITY_ROUTE[a.entity] || '/'}
            className="flex items-center gap-2 text-base px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40"
          >
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            {t(`assistant.actionDone.${a.entity}`, t('assistant.actionDone.generic'))}
          </Link>
        ))}
        {!lastAgent && !lastUser && actions.length === 0 && (
          <p className="text-center text-stone-400 italic">{t('assistant.gloveHint')}</p>
        )}
      </div>

      <ApiKeyDialog
        open={keyDialog}
        onClose={() => setKeyDialog(false)}
        onSave={(k) => { saveApiKey(k); start(); }}
      />
    </div>
  );
};
