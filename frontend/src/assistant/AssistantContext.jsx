import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAssistantSession } from './useAssistantSession';

const AssistantContext = createContext(null);

export const AssistantProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { active } = useWorkspace();
  const [open, setOpen] = useState(false);

  const onChange = useCallback((entity) => {
    // Let any mounted page know it should refetch.
    window.dispatchEvent(new CustomEvent('nahala:data-changed', { detail: { entity } }));
  }, []);

  const session = useAssistantSession({
    userName: user?.name,
    workspaceName: active?.name,
    currency: user?.currency,
    lang: i18n.language,
    onChange,
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
