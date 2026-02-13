import { AppConfig } from '../types';

export const appearanceConfig = {
  light: {
    background: 'bg-gray-50',
    card: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-100',
    sidebar: 'bg-white',
    input: 'bg-white border-gray-300',
  },
  dark: {
    background: 'bg-gray-900',
    card: 'bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-gray-700',
    hover: 'hover:bg-gray-700',
    sidebar: 'bg-[#1E2538]',
    input: 'bg-gray-700 border-gray-600 text-gray-100',
  }
};

export const colorThemeConfig = {
  default: {
    button: 'bg-blue-600 hover:bg-blue-700',
    accent: 'text-blue-600 dark:text-blue-400',
    banner: 'bg-gradient-to-r from-blue-700 to-indigo-900',
  },
  emerald: {
    button: 'bg-emerald-600 hover:bg-emerald-700',
    accent: 'text-emerald-600 dark:text-emerald-400',
    banner: 'bg-gradient-to-r from-emerald-800 to-emerald-950',
  },
  ocean: {
    button: 'bg-blue-500 hover:bg-blue-600',
    accent: 'text-blue-500 dark:text-blue-300',
    banner: 'bg-gradient-to-r from-blue-800 to-cyan-950',
  },
  purple: {
    button: 'bg-purple-600 hover:bg-purple-700',
    accent: 'text-purple-600 dark:text-purple-400',
    banner: 'bg-gradient-to-r from-purple-800 to-fuchsia-950',
  },
  pink: {
    button: 'bg-pink-600 hover:bg-pink-700',
    accent: 'text-pink-600 dark:text-pink-400',
    banner: 'bg-gradient-to-r from-pink-800 to-rose-950',
  },
  yellow: {
    button: 'bg-yellow-500 hover:bg-yellow-600',
    accent: 'text-yellow-600 dark:text-yellow-400',
    banner: 'bg-gradient-to-r from-yellow-700 to-amber-900',
  },
  violet: {
    button: 'bg-violet-600 hover:bg-violet-700',
    accent: 'text-violet-600 dark:text-violet-400',
    banner: 'bg-gradient-to-r from-violet-800 to-purple-950',
  }
};

export function getThemeClasses(appearance: 'light' | 'dark', colorTheme: AppConfig['colorTheme']) {
  const base = appearanceConfig[appearance] || appearanceConfig.dark;
  const color = colorThemeConfig[colorTheme] || colorThemeConfig.default;

  return {
    ...base,
    ...color,
    buttonText: 'text-white',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };
}

export function useTheme(appearance: 'light' | 'dark', colorTheme: AppConfig['colorTheme']) {
  const classes = getThemeClasses(appearance, colorTheme);

  if (typeof document !== 'undefined') {
    document.documentElement.className = appearance;
  }

  return classes;
}

export function getThemeStyles(appearance: 'light' | 'dark') {
  return {
    backgroundColor: appearance === 'dark' ? '#111827' : '#f9fafb',
    color: appearance === 'dark' ? '#f3f4f6' : '#111827',
  };
}