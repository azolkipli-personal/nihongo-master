import { Settings } from 'lucide-react';
import { useThemeContext } from '../../utils/ThemeContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { themeClasses } = useThemeContext();

  return (
    <header className={`${themeClasses.card} border-b ${themeClasses.border} sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              日本語 Master
            </span>
          </div>
          
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-lg ${themeClasses.hover} transition-colors`}
            aria-label="Settings"
          >
            <Settings className={`w-6 h-6 ${themeClasses.textSecondary}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
