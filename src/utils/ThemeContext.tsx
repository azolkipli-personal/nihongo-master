import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { loadConfig } from './configManager';
import { useTheme } from './theme';

interface ThemeContextType {
  theme: AppConfig['theme'];
  themeClasses: ReturnType<typeof useTheme>;
  updateTheme: (theme: AppConfig['theme']) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState(loadConfig());
  const themeClasses = useTheme(config.theme);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfig(loadConfig());
    };

    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => window.removeEventListener('configUpdated', handleConfigUpdate);
  }, []);

  const updateTheme = (_newTheme: AppConfig['theme']) => {
    // This will be handled by the config system
  };

  return (
    <ThemeContext.Provider value={{
      theme: config.theme,
      themeClasses,
      updateTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}