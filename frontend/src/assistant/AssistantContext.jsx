import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { useGlove } from '../context/GloveContext';
import { useAssistantSession } from './useAssistantSession';

const AssistantContext = createContext(null);

export const AssistantProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { active } = useWorkspace();
  const navigate = useNavigate();
  const { dark, toggle: toggleTheme } = useTheme();
  const { setGlove } = useGlove();
  const [open, setOpen] = useState(false);

  const onChange = useCallback((entity) => {
    // Let any mounted page know it should refetch.
    window.dispatchEvent(new CustomEvent('nahala:data-changed', { detail: { entity } }));
  }, []);

  // Voice control of the app shell (navigation + display settings).
  const ui = {
    navigate: (path) => { navigate(path); setOpen(false); },
    goBack: () => { navigate(-1); setOpen(false); },
    setLanguage: (code) => {
      if (!['fr', 'ar', 'en'].includes(code)) return;
      i18n.changeLanguage(code);
      try { localStorage.setItem('lang', code); } catch { /* ignore */ }
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = code;
    },
    setTheme: (mode) => {
      if (mode === 'toggle') return toggleTheme();
      if ((mode === 'dark') !== dark) toggleTheme();
    },
    setGloveMode: (on) => setGlove(!!on),
  };

  const session = useAssistantSession({
    userName: user?.name,
    workspaceName: active?.name,
    currency: user?.currency,
    lang: i18n.language,
    onChange,
    ui,
  });

  const value = useMemo(
    () => ({ ...session, open, setOpen, openPanel: () => setOpen(true), closePanel: () => setOpen(false) }),
    [session, open],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export const useAssistant = () => {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within an AssistantProvider');
  return ctx;
};
