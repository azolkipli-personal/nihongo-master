export interface WordResult {
  wordDetails: {
    kanji: string;
    hiragana: string;
    romaji: string;
  };
  meaning: string;
  conversations: Array<{
    title: string;
    dialogue: Array<{
      speaker: string;
      japanese: string;
      japaneseWithFurigana: string;
      romaji: string;
      english: string;
    }>;
  }>;
}

export interface LLMResponse {
  results: WordResult[];
}

export const GEMINI_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini-3-Pro' },
  { id: 'gemini-3-flash-preview', name: 'Gemini-3-Flash' },
  { id: 'gemini-2.5-pro-preview', name: 'Gemini-2.5-Pro' },
  { id: 'gemini-2.5-flash-native-audio-preview', name: 'Gemini-2.5-Flash' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini-2.5-Flash-Lite' },
  { id: 'gemini-2.0-flash', name: 'Gemini-2-Flash' },
];

export async function getOllamaModels(url: string = 'http://localhost:11434'): Promise<string[]> {
  try {
    const response = await fetch(`${url}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models.map((m: any) => m.name);
  } catch (error) {
    console.warn('Failed to fetch Ollama models:', error);
    return [];
  }
}

export async function generateConversation(
  words: string[],
  scenario: string,
  service: string,
  apiKey: string,
  ollamaUrl?: string,
  model?: string,
  cefrLevel: string = 'B1'
): Promise<LLMResponse> {
  const prompt = buildConversationPrompt(words, scenario, cefrLevel);

  switch (service) {
    case 'gemini':
      return callGemini(prompt, apiKey, model || 'gemini-3-flash-preview');
    case 'openrouter':
      return callOpenRouter(prompt, apiKey);
    case 'ollama':
      return callOllama(prompt, ollamaUrl || 'http://localhost:11434', model);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

export async function generateSentenceUpgrade(
  sentence: string,
  targetLevel: string,
  service: string,
  apiKey: string,
  ollamaUrl?: string,
  model?: string
): Promise<{ upgraded: string; explanation: string }> {
  const prompt = buildUpgradePrompt(sentence, targetLevel);

  switch (service) {
    case 'gemini':
      return callGeminiForUpgrade(prompt, apiKey, model || 'gemini-3-flash-preview');
    case 'openrouter':
      return callOpenRouterForUpgrade(prompt, apiKey);
    case 'ollama':
      return callOllamaForUpgrade(prompt, ollamaUrl || 'http://localhost:11434', model);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

function buildConversationPrompt(words: string[], scenario: string, cefrLevel: string): string {
  return `Act as a professional Japanese language instructor.
Scenario/Context: ${scenario || 'Daily conversation'}

CEFR Target Level: ${cefrLevel}

For EACH of the following vocabulary words or phrases: ${words.join(', ')}
You MUST generate a dedicated study block.

Requirements for EACH word/phrase results entry:
- The conversation complexity, grammar, and vocabulary should strictly match the ${cefrLevel} CEFR level.
- "wordDetails":
    - "kanji": The word in proper Japanese KANJI (e.g. if input is 'renkei', return '連携'). MUST NOT be Romaji.
    - "hiragana": The word in proper HIRAGANA (e.g. if input is 'renkei', return 'れんけい').
    - "romaji": The word in Romaji (e.g. 'renkei').
- "meaning":
    - English meaning on the FIRST line.
    - Detailed context/scenario explanation in a subsequent paragraph (use \\n\\n).
- "conversations":
    - Generate 3 different conversations focusing on this specific word.
    - Each conversation should have 6-8 exchanges.
    - Use the vocabulary word naturally in context.
    - Use ONLY 漢字[ふりがな] format for furigana (e.g. 日本[にほん]).
    - Provide Romaji transliteration.
    - Provide English translations.

Return ONLY valid JSON in this exact format:
{
  "results": [
    {
      "wordDetails": {
        "kanji": "...",
        "hiragana": "...",
        "romaji": "..."
      },
      "meaning": "Meaning of the word\\n\\nDetailed context and scenario explanation",
      "conversations": [
        {
          "title": "...",
          "dialogue": [
            {
              "speaker": "...",
              "japanese": "...",
              "japaneseWithFurigana": "...",
              "romaji": "...",
              "english": "..."
            }
          ]
        }
      ]
    }
  ]
}`;
}

function buildUpgradePrompt(sentence: string, targetLevel: string): string {
  return `Upgrade the following Japanese sentence to ${targetLevel} CEFR level business Japanese:

Original sentence: ${sentence}
Target level: ${targetLevel}

Requirements:
- Maintain the same meaning
- Use appropriate ${targetLevel} grammar patterns and vocabulary
- Use formal business register
- Add furigana in format: 漢字[かんじ]
- Explain what changes were made and why

Return ONLY valid JSON in this exact format:
{
  "upgraded": "The upgraded Japanese sentence with 漢字[ふりがな] format",
  "explanation": "Explanation of the grammatical and vocabulary changes made"
}`;
}

async function callGemini(prompt: string, apiKey: string, model: string): Promise<LLMResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseLLMResponse(text);
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<LLMResponse> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://nihongo-master.app',
      'X-Title': 'Nihongo Master',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseLLMResponse(text);
}

async function callOllama(prompt: string, url: string, model: string = 'llama3.2'): Promise<LLMResponse> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  const text = data.response || '';
  return parseLLMResponse(text);
}

async function callGeminiForUpgrade(
  prompt: string,
  apiKey: string,
  model: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseUpgradeResponse(text);
}

async function callOpenRouterForUpgrade(
  prompt: string,
  apiKey: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseUpgradeResponse(text);
}

async function callOllamaForUpgrade(
  prompt: string,
  url: string,
  model: string = 'llama3.2'
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  const text = data.response || '';
  return parseUpgradeResponse(text);
}

function parseLLMResponse(text: string): LLMResponse {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse LLM response:', text);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

function parseUpgradeResponse(text: string): { upgraded: string; explanation: string } {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse upgrade response:', text);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
