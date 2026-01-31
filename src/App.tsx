import React, { useState } from 'react';
import { Settings } from 'lucide-react';

// Theme colors
const themeColors: Record<string, { primary: string; secondary: string; light: string; background: string }> = {
  sky: { primary: '#38bdf8', secondary: '#2c3e50', light: '#e0f2fe', background: '#f0fdf4' },
  emerald: { primary: '#34d399', secondary: '#064e3b', light: '#d1fae5', background: '#ecfdf5' },
  violet: { primary: '#a78bfa', secondary: '#4c1d95', light: '#ede9fe', background: '#f5f3ff' },
  rose: { primary: '#fb7185', secondary: '#881337', light: '#ffe4e6', background: '#fff1f2' },
  amber: { primary: '#fbbf24', secondary: '#78350f', light: '#fef3c7', background: '#fffbeb' },
};

function App() {
  const [activeTab, setActiveTab] = useState('kaiwa');
  const [colorTheme, setColorTheme] = useState('sky');

  // Apply theme
  const colors = themeColors[colorTheme];
  document.documentElement.style.setProperty('--color-primary', colors.primary);
  document.documentElement.style.setProperty('--color-secondary', colors.secondary);
  document.documentElement.style.setProperty('--color-light', colors.light);
  document.documentElement.style.setProperty('--color-background', colors.background);

  const tabs = [
    { id: 'kaiwa', label: '会話', sublabel: 'KAIWA' },
    { id: 'bunpo', label: '文法', sublabel: 'BUNPO' },
    { id: 'tango', label: '単語', sublabel: 'TANGO' },
    { id: 'shinchoku', label: '進捗', sublabel: 'SHINCHOKU' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="font-jp">日本語</span> Master
              </h1>
            </div>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-2 text-center border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block text-lg font-jp font-medium">{tab.label}</span>
                <span className="block text-xs text-gray-400">{tab.sublabel}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Nihongo Master
          </h2>
          <p className="text-gray-600 mb-8">
            Choose a tab above to start learning
          </p>
          
          {/* Theme Selector */}
          <div className="flex justify-center space-x-2">
            <span className="text-sm text-gray-500">Theme:</span>
            {Object.keys(themeColors).map((theme) => (
              <button
                key={theme}
                onClick={() => setColorTheme(theme)}
                className={`w-6 h-6 rounded-full border-2 ${
                  colorTheme === theme ? 'border-gray-900' : 'border-transparent'
                }`}
                style={{ backgroundColor: themeColors[theme].primary }}
                aria-label={`${theme} theme`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;