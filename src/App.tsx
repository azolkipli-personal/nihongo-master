import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { loadConfig } from './utils/configManager';
import { createBackend } from './services/syncBackend';
import { useAutoSync } from './hooks/useAutoSync';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('kaiwa');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { themeClasses } = useThemeContext();

  // Initialize sync backend from config
  const syncBackend = useMemo(() => {
    const cfg = loadConfig();
    return createBackend(cfg.syncBackend || 'none');
  }, [loadConfig().syncBackend, loadConfig().syncNucUrl]);

  // Auto-sync every 30s when backend is configured
  useAutoSync(syncBackend, 30_000);

  const handlePushSync = useCallback(async () => {
    if (!syncBackend || syncBackend.id === 'none') return;
    try {
      const { gatherProgress, gatherConfig } = await import('./services/syncBackend');
      const progress = gatherProgress();
      await syncBackend.putProgress(progress);
      await syncBackend.putConfig(gatherConfig());
      alert('✅ Data pushed to server');
    } catch (e) {
      console.error('Push failed:', e);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'CONFLICT') {
        alert(
          '⚠️ Conflict: server has newer data. Pull from server first (to merge), then push again.'
        );
      } else if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('TypeError')
      ) {
        alert('❌ Cannot reach server — check your sync URL and network connection.');
      } else {
        alert(`❌ Push failed: ${msg}`);
      }
    }
  }, [syncBackend]);

  const handlePullSync = useCallback(async () => {
    if (!syncBackend || syncBackend.id === 'none') return;
    try {
      const { applyProgress } = await import('./services/syncBackend');
      const result = await syncBackend.getProgress();
      if (result.data && Object.keys(result.data).length > 0) {
        const keyCount = Object.keys(result.data).length;
        const keyNames = Object.keys(result.data).join(', ');
        applyProgress(result);
        alert(`✅ Pulled ${keyCount} data groups: ${keyNames}. Reloading...`);
        window.location.reload();
      } else {
        alert('⚠️ No data found on server. Push data first from the device that has it.');
      }
    } catch (e) {
      console.error('Pull failed:', e);
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('TypeError')
      ) {
        alert('❌ Cannot reach server — check your sync URL and network connection.');
      } else {
        alert(`❌ Pull failed: ${msg}`);
      }
    }
  }, [syncBackend]);

  const handleForcePushSync = useCallback(async () => {
    if (!syncBackend || syncBackend.id === 'none') return;
    try {
      const { gatherProgress, gatherConfig } = await import('./services/syncBackend');
      const progress = gatherProgress();
      await syncBackend.putProgress(progress, true);
      await syncBackend.putConfig(gatherConfig(), true);
      alert('✅ Force push complete — server data overwritten');
    } catch (e) {
      console.error('Force push failed:', e);
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('TypeError')
      ) {
        alert('❌ Cannot reach server — check your sync URL and network connection.');
      } else {
        alert(`❌ Force push failed: ${msg}`);
      }
    }
  }, [syncBackend]);

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
    <div className={`min-h-screen overflow-x-hidden ${themeClasses.background}`}>
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

      <SettingsSidebar
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onPushSync={handlePushSync}
        onPullSync={handlePullSync}
        onForcePushSync={handleForcePushSync}
      />
    </div>
  );
}

export default App;
