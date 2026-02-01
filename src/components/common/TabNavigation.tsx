import { MessageSquare, BookOpen, Library, BarChart3 } from 'lucide-react';
import { TabType } from '../../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'kaiwa', label: 'KAIWA', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'bunpo', label: 'BUNPO', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'tango', label: 'TANGO', icon: <Library className="w-5 h-5" /> },
    { id: 'shinchoku', label: 'SHINCHOKU', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
