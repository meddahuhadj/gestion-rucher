import { createContext, useContext, useEffect, useState } from 'react';

const GloveContext = createContext(undefined);
const STORAGE_KEY = 'gloveMode';

export const GloveProvider = ({ children }) => {
  const [glove, setGlove] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('glove', glove);
    try {
      localStorage.setItem(STORAGE_KEY, glove ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [glove]);

  const toggle = () => setGlove((v) => !v);

  return (
    <GloveContext.Provider value={{ glove, toggle, setGlove }}>
      {children}
    </GloveContext.Provider>
  );
};

export const useGlove = () => {
  const ctx = useContext(GloveContext);
  if (ctx === undefined) throw new Error('useGlove must be used within a GloveProvider');
  return ctx;
};
