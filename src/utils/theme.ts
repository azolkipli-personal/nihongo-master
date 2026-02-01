import { AppConfig } from '../types';

export const themeConfig = {
  light: {
    background: 'bg-gray-50',
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-100',
    sidebar: 'bg-white',
    input: 'bg-white border-gray-300',
    button: 'bg-blue-500 hover:bg-blue-600',
    buttonText: 'text-white',
    accent: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  },
  dark: {
    background: 'bg-gray-900',
    card: 'bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    hover: 'hover:bg-gray-700',
    sidebar: 'bg-gray-800',
    input: 'bg-gray-700 border-gray-600 text-gray-100',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonText: 'text-white',
    accent: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  },
  emerald: {
    background: 'bg-emerald-50',
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-emerald-200',
    hover: 'hover:bg-emerald-100',
    sidebar: 'bg-white',
    input: 'bg-white border-emerald-300',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    buttonText: 'text-white',
    accent: 'text-emerald-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  },
  ocean: {
    background: 'bg-blue-50',
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
    sidebar: 'bg-white',
    input: 'bg-white border-blue-300',
    button: 'bg-blue-500 hover:bg-blue-600',
    buttonText: 'text-white',
    accent: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  },
};

export function getThemeClasses(theme: AppConfig['theme']) {
  return themeConfig[theme] || themeConfig.light;
}

export function useTheme(theme: AppConfig['theme']) {
  const classes = getThemeClasses(theme);
  
  // Apply theme to document root for global styling
  if (typeof document !== 'undefined') {
    document.documentElement.className = theme;
  }
  
  return classes;
}

export function getThemeStyles(theme: AppConfig['theme']) {
  return {
    backgroundColor: theme === 'dark' ? '#111827' : theme === 'emerald' ? '#ecfdf5' : theme === 'ocean' ? '#eff6ff' : '#f9fafb',
    color: theme === 'dark' ? '#f3f4f6' : '#111827',
  };
}