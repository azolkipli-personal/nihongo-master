import { GEMINI_MODELS } from '../../services/llm';

interface LLMConfigSectionProps {
  selectedService: 'gemini' | 'openrouter' | 'ollama';
  geminiModel: string;
  ollamaModel: string;
  geminiApiKey: string;
  ollamaUrl: string;
  ollamaModels: string[];
  loadingModels?: boolean;
  onServiceChange: (service: 'gemini' | 'openrouter' | 'ollama') => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  onOllamaUrlChange: (url: string) => void;
  onRefreshOllamaModels: () => void;
}

export function LLMConfigSection({
  selectedService,
  geminiModel,
  ollamaModel,
  geminiApiKey,
  ollamaUrl,
  ollamaModels,
  loadingModels = false,
  onServiceChange,
  onModelChange,
  onApiKeyChange,
  onOllamaUrlChange,
  onRefreshOllamaModels,
}: LLMConfigSectionProps) {
  return (
    <section className="mb-8">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Language Model</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => onServiceChange('gemini')}
          className={`py-2.5 rounded-md text-sm font-medium transition-all ${
            selectedService === 'gemini'
              ? 'bg-[#7C89FF] text-white'
              : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
          }`}
        >
          Google Gemini
        </button>
        <button
          onClick={() => onServiceChange('ollama')}
          className={`py-2.5 rounded-md text-sm font-medium transition-all ${
            selectedService === 'ollama'
              ? 'bg-[#7C89FF] text-white'
              : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
          }`}
        >
          Ollama (Local)
        </button>
      </div>

      {/* Dynamic Configuration Container */}
      <div className="bg-[#171C2B] border border-[#2D364D] rounded-lg p-5 relative z-10">
        <h4 className="text-sm font-semibold text-white mb-4">
          {selectedService === 'gemini' ? 'Gemini Configuration' : 'Ollama Configuration'}
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Select a Model</label>
            <select
              value={selectedService === 'gemini' ? geminiModel : ollamaModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF] appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              {selectedService === 'gemini' ? (
                GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="">
                    {loadingModels
                      ? 'Loading models...'
                      : ollamaModels.length === 0
                        ? 'No models found'
                        : 'Select a model'}
                  </option>
                  {ollamaModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {selectedService === 'gemini' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">API Key</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="Enter Gemini API Key"
                className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF]"
              />
            </div>
          )}

          {selectedService === 'ollama' && (
            <div className="relative z-10">
              <label className="block text-xs font-medium text-gray-400 mb-2">Ollama URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => {
                  onOllamaUrlChange(e.target.value);
                }}
                placeholder="http://localhost:11434"
                className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF] cursor-text"
                style={{ minWidth: '200px' }}
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    onRefreshOllamaModels();
                  }}
                  disabled={loadingModels}
                  className="text-xs text-[#7C89FF] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingModels ? 'Loading models...' : 'Refresh Models'}
                </button>
                {loadingModels && (
                  <span className="text-xs text-gray-400">Fetching from: {ollamaUrl}...</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
