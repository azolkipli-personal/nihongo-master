import React from 'react';
import { Check } from 'lucide-react';

interface AppearanceSectionProps {
    theme: string;
    onThemeChange: (theme: string) => void;
}

const COLOR_THEMES = [
    { id: 'ocean', color: 'bg-[#00B4FF]' },
    { id: 'emerald', color: 'bg-[#00D98B]' },
    { id: 'purple', color: 'bg-[#A88BFF]' },
    { id: 'pink', color: 'bg-[#FF6B8B]' },
    { id: 'yellow', color: 'bg-[#FFB800]' },
    { id: 'dark-purple', color: 'bg-[#6B5BFF]' },
    { id: 'violet', color: 'bg-[#8B5CF6]' },
];

export function AppearanceSection({ theme, onThemeChange }: AppearanceSectionProps) {
    return (
        <section className="mb-8">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Appearance</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                    onClick={() => onThemeChange('light')}
                    className={`py-2.5 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-[#3E4A6D] text-white' : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
                        }`}
                >
                    Light Mode
                </button>
                <button
                    onClick={() => onThemeChange('dark')}
                    className={`py-2.5 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-[#7C89FF] text-white' : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
                        }`}
                >
                    Dark Mode
                </button>
            </div>

            <h3 className="text-sm font-medium text-gray-300 mb-4">Color Theme</h3>
            <div className="flex flex-wrap gap-3">
                {COLOR_THEMES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onThemeChange(t.id)}
                        className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center transition-transform hover:scale-110 relative`}
                    >
                        {theme === t.id && (
                            <div className="absolute inset-0 rounded-full border-2 border-white flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </section>
    );
}
