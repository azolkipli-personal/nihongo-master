import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/common/Header';
import { TabNavigation } from './components/common/TabNavigation';
import { SettingsSidebar } from './components/common/SettingsSidebar';
import { KaiwaTab } from './components/kaiwa_v2/KaiwaTab';
import { BunpoTab } from './components/bunpo/BunpoTab';
import { TangoTab } from './components/tango/TangoTab';
import { ShinchokuTab } from './components/shinchoku/ShinchokuTab';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TabType } from './types';
import { useThemeContext } from './utils/ThemeContext';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('kaiwa');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { themeClasses } = useThemeContext();

  // Listen for tab switch requests from child components
  useEffect(() => {
    const handleTabSwitch = (e: CustomEvent<TabType>) => {
      setActiveTab(e.detail);
    };

    window.addEventListener('switch-tab', handleTabSwitch as EventListener);
    return () => {
      window.removeEventListener('switch-tab', handleTabSwitch as EventListener);
    };
  }, []);

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {activeTab === 'kaiwa' && <KaiwaTab />}
          {activeTab === 'bunpo' && <BunpoTab />}
          {activeTab === 'tango' && <TangoTab />}
          {activeTab === 'shinchoku' && <ShinchokuTab />}
        </ErrorBoundary>
      </main>

      <SettingsSidebar isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
