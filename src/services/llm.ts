import { Conversation } from '../types';

export interface LLMResponse {
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

export async function generateConversation(
  words: string[],
  scenario: string,
  service: string,
  apiKey: string,
  ollamaUrl?: string
): Promise<LLMResponse> {
  const prompt = buildConversationPrompt(words, scenario);

  switch (service) {
    case 'gemini':
      return callGemini(prompt, apiKey);
    case 'openrouter':
      return callOpenRouter(prompt, apiKey);
    case 'cohere':
      return callCohere(prompt, apiKey);
    case 'ollama':
      return callOllama(prompt, ollamaUrl || 'http://localhost:11434');
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

export async function generateSentenceUpgrade(
  sentence: string,
  targetLevel: string,
  service: string,
  apiKey: string,
  ollamaUrl?: string
): Promise<{ upgraded: string; explanation: string }> {
  const prompt = buildUpgradePrompt(sentence, targetLevel);

  switch (service) {
    case 'gemini':
      return callGeminiForUpgrade(prompt, apiKey);
    case 'openrouter':
      return callOpenRouterForUpgrade(prompt, apiKey);
    case 'cohere':
      return callCohereForUpgrade(prompt, apiKey);
    case 'ollama':
      return callOllamaForUpgrade(prompt, ollamaUrl || 'http://localhost:11434');
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

function buildConversationPrompt(words: string[], scenario: string): string {
  return `Generate 5 Japanese conversations using the following vocabulary words: ${words.join(', ')}

Scenario/Context: ${scenario || 'Daily conversation'}

Requirements:
- Generate 5 different conversations, each with 6-8 exchanges
- Use the vocabulary words naturally in context
- Include both casual and formal speech where appropriate
- Add furigana in format: 漢字[かんじ]
- Include romaji transliteration
- Provide English translations

Return ONLY valid JSON in this exact format:
{
  "conversations": [
    {
      "title": "Brief title in English",
      "dialogue": [
        {
          "speaker": "A",
          "japanese": "Natural Japanese sentence",
          "japaneseWithFurigana": "Japanese with 漢字[かんじ] furigana format",
          "romaji": "Romaji transliteration",
          "english": "English translation"
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

async function callGemini(prompt: string, apiKey: string): Promise<LLMResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

async function callCohere(prompt: string, apiKey: string): Promise<LLMResponse> {
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'command-r',
      prompt,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cohere API error: ${error}`);
  }

  const data = await response.json();
  const text = data.generations?.[0]?.text || '';
  return parseLLMResponse(text);
}

async function callOllama(prompt: string, url: string): Promise<LLMResponse> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
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
  apiKey: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

async function callCohereForUpgrade(
  prompt: string,
  apiKey: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'command-r',
      prompt,
      temperature: 0.5,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cohere API error: ${error}`);
  }

  const data = await response.json();
  const text = data.generations?.[0]?.text || '';
  return parseUpgradeResponse(text);
}

async function callOllamaForUpgrade(
  prompt: string,
  url: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
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
    // Extract JSON from markdown code blocks if present
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
