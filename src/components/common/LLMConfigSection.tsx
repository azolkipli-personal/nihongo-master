import { GEMINI_MODELS } from '../../services/llm';

interface LLMConfigSectionProps {
  selectedService: string;
  geminiModel: string;
  openrouterModel: string;
  geminiApiKey: string;
  openrouterApiKey: string;
  onServiceChange: (service: 'gemini' | 'openrouter') => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (key: string) => void;
}

const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'anthropic/claude-haiku-4', name: 'Claude Haiku 4' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
];

export function LLMConfigSection({
  selectedService,
  geminiModel,
  openrouterModel,
  geminiApiKey,
  openrouterApiKey,
  onServiceChange,
  onModelChange,
  onApiKeyChange,
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
          onClick={() => onServiceChange('openrouter')}
          className={`py-2.5 rounded-md text-sm font-medium transition-all ${
            selectedService === 'openrouter'
              ? 'bg-[#7C89FF] text-white'
              : 'bg-[#2A344D] text-gray-400 hover:bg-[#35415E]'
          }`}
        >
          OpenRouter
        </button>
      </div>

      <div className="bg-[#171C2B] border border-[#2D364D] rounded-lg p-5 relative z-10">
        <h4 className="text-sm font-semibold text-white mb-4">
          {selectedService === 'gemini' ? 'Gemini Configuration' : 'OpenRouter Configuration'}
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Model</label>
            <select
              value={selectedService === 'gemini' ? geminiModel : openrouterModel}
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
              {selectedService === 'gemini'
                ? GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))
                : OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">API Key</label>
            <input
              type="password"
              value={selectedService === 'gemini' ? geminiApiKey : openrouterApiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={
                selectedService === 'gemini' ? 'Enter Gemini API Key' : 'Enter OpenRouter API Key'
              }
              className="w-full bg-[#2A344D] border border-[#3E4A6D] text-white text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C89FF]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
