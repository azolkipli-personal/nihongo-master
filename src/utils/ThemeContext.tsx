import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { loadConfig } from './configManager';
import { useTheme } from './theme';

interface ThemeContextType {
  appearance: 'light' | 'dark';
  colorTheme: AppConfig['colorTheme'];
  themeClasses: ReturnType<typeof useTheme>;
  updateTheme: (appearance: 'light' | 'dark', colorTheme: AppConfig['colorTheme']) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState(loadConfig());
  const themeClasses = useTheme(config.appearance, config.colorTheme);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfig(loadConfig());
    };

    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => window.removeEventListener('configUpdated', handleConfigUpdate);
  }, []);

  const updateTheme = (_appearance: 'light' | 'dark', _colorTheme: AppConfig['colorTheme']) => {
    // This will be handled by the config system
  };

  return (
    <ThemeContext.Provider value={{
      appearance: config.appearance,
      colorTheme: config.colorTheme,
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