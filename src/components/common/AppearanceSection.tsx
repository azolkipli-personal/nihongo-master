import { Check } from 'lucide-react';

interface AppearanceSectionProps {
    appearance: 'light' | 'dark';
    colorTheme: string;
    onAppearanceChange: (appearance: 'light' | 'dark') => void;
    onColorThemeChange: (theme: string) => void;
}

const COLOR_THEMES = [
    { id: 'default', color: 'bg-blue-600' },
    { id: 'ocean', color: 'bg-[#00B4FF]' },
    { id: 'emerald', color: 'bg-[#00D98B]' },
    { id: 'purple', color: 'bg-[#A88BFF]' },
    { id: 'pink', color: 'bg-[#FF6B8B]' },
    { id: 'yellow', color: 'bg-[#FFB800]' },
    { id: 'violet', color: 'bg-[#8B5CF6]' },
];

export function AppearanceSection({
    appearance,
    colorTheme,
    onAppearanceChange,
    onColorThemeChange
}: AppearanceSectionProps) {
    return (
        <section className="mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Appearance</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                    onClick={() => onAppearanceChange('light')}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${appearance === 'light'
                        ? 'bg-white text-blue-600 border-blue-500 shadow-md'
                        : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                        }`}
                >
                    Light Mode
                </button>
                <button
                    onClick={() => onAppearanceChange('dark')}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${appearance === 'dark'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                        }`}
                >
                    Dark Mode
                </button>
            </div>

            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Color Theme</h3>
            <div className="grid grid-cols-4 gap-4">
                {COLOR_THEMES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onColorThemeChange(t.id)}
                        className={`group flex flex-col items-center gap-2`}
                    >
                        <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${colorTheme === t.id ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900 shadow-blue-500/50' : ''
                            }`}>
                            {colorTheme === t.id && (
                                <Check className="w-6 h-6 text-white drop-shadow-md" />
                            )}
                        </div>
                        <span className={`text-[10px] uppercase font-bold tracking-tighter ${colorTheme === t.id ? 'text-white' : 'text-gray-500'
                            }`}>
                            {t.id}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
