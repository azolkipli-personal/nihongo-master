interface IntegrationsSectionProps {
    wanikaniApiKey: string;
    onWaniKaniApiKeyChange: (key: string) => void;
}

export function IntegrationsSection({
    wanikaniApiKey,
    onWaniKaniApiKeyChange,
}: IntegrationsSectionProps) {
    return (
        <section className="mb-8">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Integrations</h3>
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
                        <p className="mt-2 text-[10px] text-gray-500">
                            Used for syncing vocabulary and progress from WaniKani.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
