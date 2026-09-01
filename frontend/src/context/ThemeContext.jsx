import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);
const STORAGE_KEY = 'theme';

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};