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
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash-Lite' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Stable)' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Stable)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Legacy)' },
];

/**
 * Fetches available models from an Ollama instance
 * @param url - The URL of the Ollama server (defaults to localhost:11434)
 * @returns Promise resolving to an array of model names
 */
export async function getOllamaModels(url: string = 'http://localhost:11434'): Promise<string[]> {
  try {
    console.log('Fetching Ollama models from:', url);
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Ollama response:', data);

    if (!data.models || !Array.isArray(data.models)) {
      console.warn('Invalid response format from Ollama:', data);
      return [];
    }

    const models = data.models.map((m: { name: string }) => m.name);
    console.log(`Found ${models.length} models:`, models);
    return models;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('CORS or Network error - cannot reach Ollama server at', url);
      console.error('Make sure Ollama is running and CORS is enabled.');
      console.error('For remote servers, set: OLLAMA_ORIGINS=*');
    } else {
      console.error('Failed to fetch Ollama models:', error);
    }
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
  cefrLevel: string = 'B1',
  focusGrammar?: string[]
): Promise<LLMResponse> {
  const prompt = buildConversationPrompt(words, scenario, cefrLevel, focusGrammar);

  switch (service) {
    case 'gemini':
      return callGemini(prompt, apiKey, model || 'gemini-2.5-flash');
    case 'openrouter':
      return callOpenRouter(prompt, apiKey, model);
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
      return callGeminiForUpgrade(prompt, apiKey, model || 'gemini-2.5-flash');
    case 'openrouter':
      return callOpenRouterForUpgrade(prompt, apiKey, model);
    case 'ollama':
      return callOllamaForUpgrade(prompt, ollamaUrl || 'http://localhost:11434', model);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

export function buildConversationPrompt(
  words: string[],
  scenario: string,
  cefrLevel: string,
  focusGrammar?: string[]
): string {
  const focusGrammarLine =
    focusGrammar && focusGrammar.length > 0
      ? `Focus on using these grammar patterns naturally in the conversations: ${focusGrammar.join(', ')}
`
      : '';
  return `Act as a professional Japanese language instructor.
${focusGrammarLine}Scenario/Context: ${scenario || 'Daily conversation'}

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

export function buildUpgradePrompt(sentence: string, targetLevel: string): string {
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 65536 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason || 'unknown';
    console.error(
      'Gemini returned empty response. Block reason:',
      blockReason,
      'Full data:',
      JSON.stringify(data).slice(0, 500)
    );
    throw new Error(
      `AI returned empty response (blocked: ${blockReason}). Try a different model or check your prompt.`
    );
  }

  return parseLLMResponse(text);
}

async function callOpenRouter(
  prompt: string,
  apiKey: string,
  model: string = 'google/gemini-2.5-flash'
): Promise<LLMResponse> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://nihongo-master.app',
      'X-Title': 'Nihongo Master',
    },
    body: JSON.stringify({
      model,
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

async function callOllama(
  prompt: string,
  url: string,
  model: string = 'llama3.2'
): Promise<LLMResponse> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
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
        generationConfig: { temperature: 0.5, maxOutputTokens: 65536 },
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
  apiKey: string,
  model: string = 'google/gemini-2.5-flash'
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
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
      model,
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
  if (!text || !text.trim()) {
    throw new Error(
      'AI returned empty response. The model may have blocked the request or the prompt is too complex. Try fewer words or a different model.'
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    try {
      const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (blockMatch) return JSON.parse(blockMatch[1].trim());
    } catch {
      /* empty */
    }
    try {
      const resultsMatch = text.match(/\{[\s\S]*?"results"[\s\S]*?\}/);
      if (resultsMatch) return JSON.parse(resultsMatch[0]);
    } catch {
      /* empty */
    }
    try {
      const objMatch = text.match(/\{[^{}]*"wordDetails"[\s\S]*?\}/);
      if (objMatch) {
        const parsed = JSON.parse(objMatch[0]);
        if (parsed.wordDetails && !parsed.results) {
          return { results: [parsed] };
        }
        return parsed;
      }
    } catch {
      /* empty */
    }
    console.error('RAW RESPONSE FROM AI (first 1000 chars):', text.slice(0, 1000));
    throw new Error(
      'Failed to parse AI response. The model returned unexpected content. Try with fewer words or a different model.'
    );
  }
}

export interface ChallengeQuestionData {
  pattern: string;
  original: string;
  blanked: string;
  english: string;
  furigana?: string;
}

export async function generateChallengeQuestions(
  patterns: Array<{ pattern: string; meaning: string; cefr: string }>,
  service: string,
  apiKey: string,
  ollamaUrl?: string,
  model?: string
): Promise<ChallengeQuestionData[]> {
  const prompt = `Generate ${patterns.length} Japanese sentences for a fill-in-the-blank quiz.

For each grammar pattern below, create a sentence where the target grammar pattern part is replaced with "____":
${patterns.map((p, i) => `${i + 1}. Pattern: ${p.pattern} (${p.meaning}) [${p.cefr}]`).join('\n')}

Return ONLY valid JSON (no markdown, no code fences):
{"questions": [
  {"pattern": "pattern name", "original": "full sentence with 漢字[ふりがな]", "blanked": "blanked sentence with ____ and 漢字[ふりがな]", "english": "english translation"}
]}

CRITICAL: Use 漢字[ふりがな] format for ALL kanji in both "original" and "blanked" fields.
Examples:
  - Correct: 私[わたし]は毎日[まいにち]図書館[としょかん]で勉強[べんきょう]する
  - Correct with blank: 私[わたし]は____図書館[としょかん]で勉強[べんきょう]する
  - Wrong: 私は毎日図書館で勉強する (no furigana)

Rules:
- Each sentence must be at the specified CEFR level
- Naturally demonstrate the target grammar pattern
- Use practical daily/workplace vocabulary
- The blank should replace ONLY the grammar pattern part
- Keep sentences concise (under 15 words)
- Use natural Japanese`;

  switch (service) {
    case 'gemini':
      return callGeminiForChallenge(prompt, apiKey, model || 'gemini-2.5-flash');
    case 'openrouter':
      return callOpenRouterForChallenge(prompt, apiKey, model);
    case 'ollama':
      return callOllamaForChallenge(prompt, ollamaUrl || 'http://localhost:11434', model);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

async function callGeminiForChallenge(
  prompt: string,
  apiKey: string,
  model: string
): Promise<ChallengeQuestionData[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseChallengeResponse(text);
}

async function callOpenRouterForChallenge(
  prompt: string,
  apiKey: string,
  model: string = 'google/gemini-2.5-flash'
): Promise<ChallengeQuestionData[]> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseChallengeResponse(text);
}

async function callOllamaForChallenge(
  prompt: string,
  url: string,
  model: string = 'llama3.2'
): Promise<ChallengeQuestionData[]> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  return parseChallengeResponse(data.response || '');
}

function parseChallengeResponse(text: string): ChallengeQuestionData[] {
  try {
    const jsonMatch = text.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonStr);
    const questions = parsed.questions || parsed;
    if (Array.isArray(questions)) {
      return questions.map((q: any) => {
        // Try multiple fields for the blanked sentence
        let blanked = q.blanked || q.blankedSentence || '';
        // If blanked has no ____, try to extract from the sentence
        if (!blanked.includes('____') && q.sentence) {
          blanked = q.sentence; // Use sentence as-is (it might already have ____)
        }
        if (!blanked.includes('____') && q.original) {
          // Fallback: blanked is missing — use sentence if it has ____, otherwise use original
          blanked = q.sentence?.includes('____') ? q.sentence : q.original;
        }

        return {
          pattern: q.pattern || '',
          original: q.original || q.sentence || '',
          blanked,
          english: q.english || '',
          furigana: q.furigana || blanked || q.original || '',
        };
      });
    }
    throw new Error('Unexpected response format');
  } catch (e) {
    console.error('Failed to parse challenge response:', text.slice(0, 500));
    throw new Error('Failed to parse AI challenge question response. Please try again.');
  }
}

function parseUpgradeResponse(text: string): { upgraded: string; explanation: string } {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonStr);
  } catch (_error) {
    console.error('Failed to parse upgrade response:', text);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
