import React from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { GEMINI_MODELS } from '../../services/llm';

interface ModelSelectorProps {
    currentService: string;
    selectedModel: string;
    ollamaModels: string[];
    modelDropdownOpen: boolean;
    refreshingModels: boolean;
    onModelDropdownToggle: () => void;
    onModelSelect: (model: string) => void;
    onRefreshOllamaModels: () => void;
}

export function ModelSelector({
    currentService,
    selectedModel,
    ollamaModels,
    modelDropdownOpen,
    refreshingModels,
    onModelDropdownToggle,
    onModelSelect,
    onRefreshOllamaModels,
}: ModelSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Model ({currentService === 'ollama' ? 'Local Ollama' : 'Google Gemini'})
            </label>
            <div className="relative">
                <button
                    onClick={onModelDropdownToggle}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between text-left"
                >
                    <span>
                        {currentService === 'ollama'
                            ? (selectedModel || 'Select a model...')
                            : (GEMINI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel)
                        }
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {modelDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {currentService === 'ollama' ? (
                            <div className="py-1">
                                <div className="px-2 pb-2 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-500 px-2">Local Models</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRefreshOllamaModels();
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded text-blue-500"
                                        title="Refresh Models"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${refreshingModels ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {ollamaModels.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                        {refreshingModels ? 'Loading...' : 'No models found. Is Ollama running?'}
                                    </div>
                                ) : (
                                    ollamaModels.map((model) => (
                                        <button
                                            key={model}
                                            onClick={() => onModelSelect(model)}
                                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel === model ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                                        >
                                            <div className="font-medium">{model}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="py-1">
                                <div className="px-4 py-2 text-xs text-gray-500 font-medium">Gemini Models</div>
                                {GEMINI_MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => onModelSelect(model.id)}
                                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel === model.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                                    >
                                        <div className="font-medium">{model.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
