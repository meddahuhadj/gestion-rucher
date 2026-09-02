import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mic, Square, Camera, CameraOff, Trash2, KeyRound, Bot, Send, CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui';
import { useAssistant } from './AssistantContext';
import { ApiKeyDialog } from './ApiKeyDialog';

const STATUS_STYLES = {
  IDLE: 'bg-stone-400',
  CONNECTING: 'bg-amber-400 animate-pulse',
  LISTENING: 'bg-emerald-500 animate-pulse',
  SPEAKING: 'bg-violet-500 animate-pulse',
  ERROR: 'bg-red-500',
};

const ENTITY_ROUTE = {
  tasks: '/tasks',
  inspections: '/inspections',
  harvests: '/harvests',
  hives: '/hives',
};

export const AssistantPanel = ({ variant = 'page' }) => {
  const { t } = useTranslation();
  const {
    hasApiKey, saveApiKey,
    status, isActive, error,
    transcriptions, actions, clearTranscriptions,
    cameraOn, toggleCamera, videoRef,
    start, stop, sendText,
  } = useAssistant();

  const [keyDialog, setKeyDialog] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcriptions, actions]);

  const onMicClick = () => {
    if (isActive) return stop();
    if (!hasApiKey) return setKeyDialog(true);
    start();
  };

  const submitDraft = (e) => {
    e.preventDefault();
    if (!draft.trim() || !isActive) return;
    sendText(draft.trim());
    setDraft('');
  };

  const statusLabel = t(`assistant.status.${status}`);
  const isDrawer = variant === 'drawer';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Status row */}
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status] || STATUS_STYLES.IDLE}`} />
        <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {statusLabel}
        </span>
        <div className="ms-auto flex items-center gap-1">
          <button
            onClick={() => setKeyDialog(true)}
            title={t('assistant.changeKey')}
            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          {(transcriptions.length > 0 || actions.length > 0) && (
            <button
              onClick={clearTranscriptions}
              title={t('assistant.clear')}
              className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Camera preview */}
      <div className={`relative rounded-xl overflow-hidden bg-stone-900 border border-stone-200 dark:border-stone-800 mb-3 ${cameraOn ? '' : 'hidden'}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full object-cover ${isDrawer ? 'max-h-40' : 'max-h-64'}`}
        />
      </div>

      {/* Transcription / actions */}
      <div
        ref={scrollRef}
        className={`flex-1 min-h-0 overflow-y-auto scrollbar-thin rounded-xl bg-stone-50 border border-stone-100 p-3 space-y-3 dark:bg-stone-900/50 dark:border-stone-800 ${
          isDrawer ? 'min-h-[180px]' : 'min-h-[240px]'
        }`}
      >
        {transcriptions.length === 0 && actions.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 gap-2 py-8">
            <Bot className="h-8 w-8" />
            <p className="text-sm italic">{t('assistant.emptyHint')}</p>
          </div>
        )}

        {transcriptions.map((e) => (
          <div key={e.id} className={`flex flex-col ${e.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 px-2 mb-0.5">
              {e.role === 'user' ? t('assistant.you') : t('assistant.assistant')}
            </span>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                e.role === 'user'
                  ? 'bg-honey-500 text-white rounded-tr-sm'
                  : 'bg-white text-stone-700 border border-stone-200 rounded-tl-sm dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700'
              }`}
            >
              {e.text}
            </div>
          </div>
        ))}

        {actions.map((a) => (
          <Link
            key={a.id}
            to={ENTITY_ROUTE[a.entity] || '/'}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t(`assistant.actionDone.${a.entity}`, t('assistant.actionDone.generic'))}
          </Link>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 px-1 pt-2">{error}</p>}

      {/* Text input */}
      <form onSubmit={submitDraft} className="flex items-center gap-2 pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!isActive}
          placeholder={isActive ? t('assistant.typePlaceholder') : t('assistant.startFirst')}
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-honey-400 disabled:opacity-50 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700"
        />
        <button
          type="submit"
          disabled={!isActive || !draft.trim()}
          className="p-2.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Controls */}
      <div className="flex items-center gap-2 pt-3">
        <Button
          onClick={onMicClick}
          variant={isActive ? 'danger' : 'primary'}
          className="flex-1"
        >
          {isActive ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isActive ? t('assistant.stop') : t('assistant.start')}
        </Button>
        <Button
          onClick={toggleCamera}
          variant="secondary"
          title={cameraOn ? t('assistant.cameraOff') : t('assistant.cameraOn')}
        >
          {cameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>

      <ApiKeyDialog
        open={keyDialog}
        onClose={() => setKeyDialog(false)}
        onSave={(k) => { saveApiKey(k); }}
      />
    </div>
  );
};
