import { useState } from 'react';
import { Header } from './components/common/Header';
import { TabNavigation } from './components/common/TabNavigation';
import { SettingsSidebar } from './components/common/SettingsSidebar';
import { KaiwaTab } from './components/kaiwa/KaiwaTab';
import { BunpoTab } from './components/bunpo/BunpoTab';
import { TangoTab } from './components/tango/TangoTab';
import { ShinchokuTab } from './components/shinchoku/ShinchokuTab';
import { TabType } from './types';
import { useThemeContext } from './utils/ThemeContext';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('kaiwa');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { themeClasses } = useThemeContext();

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'kaiwa' && <KaiwaTab />}
        {activeTab === 'bunpo' && <BunpoTab />}
        {activeTab === 'tango' && <TangoTab />}
        {activeTab === 'shinchoku' && <ShinchokuTab />}
      </main>

      <SettingsSidebar 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </div>
  );
}

export default App;
