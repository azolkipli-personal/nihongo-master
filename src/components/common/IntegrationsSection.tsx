import { Download, Upload } from 'lucide-react';
import { downloadProgressAsFile, importProgress } from '../../utils/progressSync';
import { useRef } from 'react';

interface IntegrationsSectionProps {
    wanikaniApiKey: string;
    onWaniKaniApiKeyChange: (key: string) => void;
}

export function IntegrationsSection({
    wanikaniApiKey,
    onWaniKaniApiKeyChange,
}: IntegrationsSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (importProgress(content)) {
                alert('Progress imported successfully! Please refresh the page.');
                window.location.reload();
            } else {
                alert('Failed to import progress. Invalid file format.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <section className="mb-8">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Integrations & Data</h3>
            
            <div className="space-y-4">
                {/* WaniKani */}
                <div className="bg-[#171C2B] border border-[#2D364D] rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-white mb-4">WaniKani</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                API Key (v2)
                            </label>
                            <input
                                type="password"
                                value={wanikaniApiKey}
                                onChange={(e) => onWaniKaniApiKeyChange(e.target.value)}
                                placeholder="Enter WaniKani API Key"
                                className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF]"
                            />
                        </div>
                    </div>
                </div>

                {/* Backup & Sync */}
                <div className="bg-[#171C2B] border border-[#2D364D] rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-white mb-4">Backup & Sync</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={downloadProgressAsFile}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#2D364D] hover:bg-[#3E4A6D] text-white text-sm font-medium py-2 rounded-md transition-colors"
                        >
                            <Download size={16} />
                            Export Backup (JSON)
                        </button>
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#2D364D] hover:bg-[#3E4A6D] text-white text-sm font-medium py-2 rounded-md transition-colors"
                        >
                            <Upload size={16} />
                            Import Backup
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".json"
                            className="hidden"
                        />
                    </div>
                    <p className="mt-3 text-[10px] text-gray-500">
                        Exports your SRS stages, vocabulary, and study history as a portable JSON file.
                    </p>
                </div>
            </div>
        </section>
    );
}
