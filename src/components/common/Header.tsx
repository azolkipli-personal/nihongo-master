import { Settings } from 'lucide-react';
import { useThemeContext } from '../../utils/ThemeContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { themeClasses } = useThemeContext();

  return (
    <header className={`${themeClasses.banner} border-b border-white/10 sticky top-0 z-40 shadow-xl transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-white tracking-tight drop-shadow-md">
              日本語 MASTER
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
