import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isChristmas: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = 'geoguess-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'default' ? 'default' : 'christmas';
  });

  const isChristmas = theme === 'christmas';

  useEffect(() => {
    document.body.classList.toggle('christmas', isChristmas);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, isChristmas]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'christmas' ? 'default' : 'christmas'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isChristmas }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
